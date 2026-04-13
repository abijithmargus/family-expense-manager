import logging
from decimal import Decimal
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date

from app.models.domain import Transaction, Loan, SavingsPool, RecurringRule, Budget, TypeEnum, Debt, DebtTypeEnum
from app.repositories.domain_repos import TransactionRepository, LoanRepository, SavingsRepository, RuleBudgetRepository, DebtRepository
from app.schemas.domain import TransactionCreate, LoanCreate, LoanUpdate, WithdrawRequest, RecurringRuleCreate, BudgetCreate, DebtCreate, DebtUpdate

logger = logging.getLogger(__name__)

class TransactionService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = TransactionRepository(db)
        self.savings_repo = SavingsRepository(db)
        self.loan_repo = LoanRepository(db)

    async def create_transaction(self, tx_data: TransactionCreate, user_id: int):
        existing = await self.repo.get_by_idempotency_key(tx_data.idempotency_key)
        if existing:
            return {"success": True, "data": existing.id, "message": "Transaction already exists"}
            
        try:
            tx = Transaction(
                idempotency_key=tx_data.idempotency_key,
                type=TypeEnum(tx_data.type),
                amount=tx_data.amount,
                date=tx_data.date,
                notes=tx_data.notes,
                purpose=tx_data.purpose,
                category_id=tx_data.category_id,
                loan_id=tx_data.loan_id,
                savings_pool_id=tx_data.savings_pool_id,
                created_by=user_id,
                from_user_id=tx_data.from_user_id,
                to_user_id=tx_data.to_user_id,
                from_account_type=tx_data.from_account_type,
                to_account_type=tx_data.to_account_type
            )
            await self.repo.create(tx)

            if tx_data.type == "expense" and tx_data.purpose == "savings_contribution" and tx_data.savings_pool_id:
                pool = await self.savings_repo.get_pool_by_id_for_update(tx_data.savings_pool_id)
                if not pool:
                    raise HTTPException(status_code=404, detail="Savings pool not found")
                pool.current_balance += Decimal(str(tx_data.amount))
                pool.total_contributions += Decimal(str(tx_data.amount))

            elif tx_data.type == "expense" and tx_data.purpose == "loan_payment" and tx_data.loan_id:
                loan = await self.loan_repo.get_by_id_for_update(tx_data.loan_id)
                if loan:
                    loan.paid_amount += Decimal(str(tx_data.amount))
                    loan.remaining_amount = loan.total_amount - loan.paid_amount

            await self.db.commit()
            await self.db.refresh(tx)
            return {"success": True, "data": tx.id}
        except Exception as e:
            await self.db.rollback()
            raise HTTPException(status_code=400, detail=str(e))
            
    async def delete_transaction(self, tx_id: int, user_id: int, user_role: str):
        try:
            tx = await self.repo.get_by_id_for_update(tx_id)
            if not tx:
                raise HTTPException(status_code=404, detail="Transaction not found")
                
            # RBAC Ownership Check
            if user_role != "super_admin" and tx.created_by != user_id:
                raise HTTPException(status_code=403, detail="Forbidden. You can only delete your own transactions.")
                
            # --- Reverse Side Effects mathematically ---
            if tx.type.value == "expense" and tx.purpose.value == "savings_contribution" and tx.savings_pool_id:
                pool = await self.savings_repo.get_pool_by_id_for_update(tx.savings_pool_id)
                if pool:
                    pool.current_balance -= tx.amount  # tx.amount is already Decimal from DB
                    pool.total_contributions -= tx.amount
                    
            elif tx.type.value == "expense" and tx.purpose.value == "loan_payment" and tx.loan_id:
                loan = await self.loan_repo.get_by_id_for_update(tx.loan_id)
                if loan:
                    loan.paid_amount -= tx.amount  # tx.amount is already Decimal from DB
                    loan.remaining_amount += tx.amount
                    
            elif tx.type.value == "transfer" and tx.from_account_type == "savings" and tx.savings_pool_id:
                pool = await self.savings_repo.get_pool_by_id_for_update(tx.savings_pool_id)
                if pool:
                    pool.current_balance += tx.amount
                    pool.total_withdrawals -= tx.amount

            await self.repo.delete_by_id(tx_id)
            await self.db.commit()
            return {"success": True}
        except Exception as e:
            await self.db.rollback()
            raise HTTPException(status_code=400, detail=str(e))

    async def get_all(self, filters: dict):
        txs = await self.repo.get_all(
            start_date=filters.get("start_date"),
            end_date=filters.get("end_date"),
            users=filters.get("users"),
            t_type=filters.get("type"),
            purpose=filters.get("purpose"),
            loan_id=filters.get("loan_id")
        )
        return {"success": True, "data": [{
            "id": t.id, "type": t.type.value, "amount": float(t.amount),
            "date": str(t.date), "notes": t.notes, "purpose": t.purpose.value, "category_id": t.category_id
        } for t in txs]}

class DashboardService:
    def __init__(self, db: AsyncSession):
        self.tx_repo = TransactionRepository(db)
        self.savings_repo = SavingsRepository(db)
        self.loan_repo = LoanRepository(db)
        self.debt_repo = DebtRepository(db)

    async def get_summary(self, month: str = None, target_user: int = None, start_date: str = None, end_date: str = None, users: str = None, t_type: str = None, purpose: str = None, loan_id: str = None):
        logger.info(f"DashboardService: Compiling full financial dashboard with deep filters")
        
        income = await self.tx_repo.sum_by_type(
            TypeEnum.income, month=month, user_id=target_user, 
            start_date=start_date, end_date=end_date, users=users, 
            purpose=purpose, loan_id=loan_id
        )
        expense = await self.tx_repo.sum_by_type(
            TypeEnum.expense, month=month, user_id=target_user, 
            start_date=start_date, end_date=end_date, users=users, 
            purpose=purpose, loan_id=loan_id
        )
        
        savings_bal = await self.savings_repo.get_all_pools_balance()
        loans_rem = await self.loan_repo.sum_remaining()
        
        # Debts - support target_user or users filter
        borrowed = await self.debt_repo.sum_by_type_for_user(DebtTypeEnum.taken, user_id=target_user, is_admin=True, users=users)
        lent = await self.debt_repo.sum_by_type_for_user(DebtTypeEnum.given, user_id=target_user, is_admin=True, users=users)

        cat_dist = await self.tx_repo.get_expenses_by_category(
            TypeEnum.expense, month=month, user_id=target_user, 
            start_date=start_date, end_date=end_date, users=users, 
            purpose=purpose, loan_id=loan_id
        )
        dist_list = [{"name": c[0], "value": float(c[1])} for c in cat_dist]

        return {
            "success": True,
            "data": {
                "totalIncome": float(income),
                "totalExpense": float(expense),
                "netBalance": float(income - expense),
                "totalLoanRemaining": float(loans_rem),
                "totalSavingsBalance": float(savings_bal),
                "totalDebtBorrowed": float(borrowed),
                "totalDebtLent": float(lent),
                "categoryDistribution": dist_list,
                "monthlyTrend": [{"month": "Filtered Segment", "income": float(income), "expense": float(expense)}]
            }
        }

class LoanService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = LoanRepository(db)

    async def get_all(self):
        loans = await self.repo.get_all_active()
        return {"success": True, "data": [{
            "id": l.id, "name": l.name, "total_amount": float(l.total_amount),
            "paid_amount": float(l.paid_amount), "remaining_amount": float(l.remaining_amount),
            "interest_rate": float(l.interest_rate)
        } for l in loans]}

    async def create(self, l_data: LoanCreate):
        loan = Loan(
            name=l_data.name, total_amount=l_data.total_amount, remaining_amount=l_data.total_amount, 
            interest_type=l_data.interest_type, interest_rate=l_data.interest_rate,
            tenure_months=l_data.tenure_months, start_date=l_data.start_date
        )
        await self.repo.create(loan)
        await self.db.commit()
        await self.db.refresh(loan)
        return {"success": True, "data": loan.id}
        
    async def delete(self, loan_id: int):
        from sqlalchemy import text
        # Nullify child transactions safely to preserve ledger but untie the connection
        await self.db.execute(text("UPDATE transactions SET loan_id = NULL WHERE loan_id = :lid"), {"lid": loan_id})
        
        await self.repo.delete(loan_id)
        await self.db.commit()
        return {"success": True}

    async def update(self, loan_id: int, data: LoanUpdate):
        loan = await self.repo.get_by_id_for_update(loan_id)
        if not loan:
            raise HTTPException(status_code=404, detail="Loan not found")
        
        if data.name is not None:
            loan.name = data.name
        if data.interest_type is not None:
            loan.interest_type = data.interest_type
        if data.interest_rate is not None:
            loan.interest_rate = Decimal(str(data.interest_rate))
        if data.tenure_months is not None:
            loan.tenure_months = data.tenure_months
        if data.total_amount is not None:
            new_total = Decimal(str(data.total_amount))
            diff = new_total - loan.total_amount
            loan.total_amount = new_total
            loan.remaining_amount = max(Decimal('0'), loan.remaining_amount + diff)
            
        await self.db.commit()
        return {"success": True}

class SavingsService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = SavingsRepository(db)

    async def get_all(self):
        pools = await self.repo.get_pools()
        return {"success": True, "data": [{
            "id": p.id,
            "name": p.name,
            "current_balance": float(p.current_balance),
            "total_contributions": float(p.total_contributions),
            "total_withdrawals": float(p.total_withdrawals)
        } for p in pools]}
        
    async def create_pool(self, data):
        amt = Decimal(str(data.initial_amount)) if data.initial_amount else Decimal('0')
        pool = SavingsPool(name=data.name, current_balance=amt, total_contributions=amt)
        await self.repo.create_pool(pool)
        await self.db.commit()
        return {"success": True, "data": pool.id}
        
    async def delete_pool(self, pool_id: int):
        pool = await self.repo.get_pool_by_id_for_update(pool_id)
        if not pool:
            raise HTTPException(status_code=404, detail="Pool not found")
        if pool.current_balance > 0:
            raise HTTPException(status_code=400, detail=f"Cannot delete pool. Native balance exists: ₹{pool.current_balance}. Please withdraw internally first.")
            
        await self.repo.delete_by_id(pool_id)
        await self.db.commit()
        return {"success": True}

    async def withdraw(self, req: WithdrawRequest, user_id: int):
        pool = await self.repo.get_pool_by_id_for_update(req.savings_pool_id)
        if not pool:
            raise HTTPException(status_code=404, detail="Savings pool not found")
        
        req_amount = Decimal(str(req.amount))
        if pool.current_balance < req_amount:
            raise HTTPException(status_code=400, detail=f"Insufficient savings. Pool balance: ₹{float(pool.current_balance):.2f}")
        
        target_to_user_id = req.to_user_id if req.to_user_id else user_id

        import time
        try:
            pool.current_balance -= req_amount
            pool.total_withdrawals += req_amount
            tx = Transaction(
                idempotency_key=f"withdraw_{pool.id}_{req.amount}_{user_id}_{int(time.time())}",
                type=TypeEnum.transfer, amount=req_amount, date=date.today(),
                notes=f"Withdrawal from {pool.name}", from_account_type="savings", to_account_type="user",
                to_user_id=target_to_user_id, purpose="normal", created_by=user_id,
                savings_pool_id=pool.id
            )
            self.db.add(tx)
            await self.db.commit()
            return {"success": True, "data": tx.id}
        except Exception as e:
            await self.db.rollback()
            raise HTTPException(status_code=400, detail=str(e))

class RuleBudgetService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = RuleBudgetRepository(db)

    async def get_rules(self):
        rules = await self.repo.get_rules()
        return {"success": True, "data": [{
            "id": r.id, "rule_type": r.rule_type, "amount": float(r.amount),
            "frequency": r.frequency.value, "next_run_date": str(r.next_run_date) if r.next_run_date else None
        } for r in rules]}

    async def create_rule(self, req: RecurringRuleCreate, user_id: int):
        rule = RecurringRule(
            rule_type=req.rule_type, amount=req.amount, frequency=req.frequency,
            category_id=req.category_id, assigned_user_id=user_id, start_date=req.start_date, next_run_date=req.start_date,
            savings_pool_id=req.savings_pool_id, loan_id=req.loan_id
        )
        await self.repo.create_rule(rule)
        await self.db.commit()
        await self.db.refresh(rule)
        return {"success": True, "data": rule.id}
        
    async def delete_rule(self, rule_id: int):
        await self.repo.delete_rule(rule_id)
        await self.db.commit()
        return {"success": True}

    async def get_budgets(self):
        bgts = await self.repo.get_budgets()
        return {"success": True, "data": [{
            "id": b.id, "amount": float(b.amount), "month_year": str(b.month_year)
        } for b in bgts]}

    async def create_budget(self, req: BudgetCreate):
        bgt = Budget(month_year=req.month_year, category_id=req.category_id, amount=req.amount)
        await self.repo.create_budget(bgt)
        await self.db.commit()
        await self.db.refresh(bgt)
        return {"success": True, "data": bgt.id}
        
    async def delete_budget(self, budget_id: int):
        await self.repo.delete_budget_by_id(budget_id)
        await self.db.commit()
        return {"success": True}


class DebtService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = DebtRepository(db)

    def _serialize(self, d: Debt) -> dict:
        return {
            "id": d.id,
            "contact_name": d.contact_name,
            "type": d.type.value,
            "amount": float(d.amount),
            "description": d.description,
            "due_date": str(d.due_date) if d.due_date else None,
            "is_settled": d.is_settled,
            "settled_at": str(d.settled_at) if d.settled_at else None,
            "created_at": str(d.created_at),
        }

    async def get_all(self, user_id: int, is_admin: bool):
        debts = await self.repo.get_all_for_user(user_id, is_admin)
        return {"success": True, "data": [self._serialize(d) for d in debts]}

    async def create(self, data: DebtCreate, user_id: int):
        debt = Debt(
            created_by=user_id,
            contact_name=data.contact_name,
            type=DebtTypeEnum(data.type),
            amount=Decimal(str(data.amount)),
            description=data.description,
            due_date=data.due_date,
        )
        await self.repo.create(debt)
        await self.db.commit()
        await self.db.refresh(debt)
        return {"success": True, "data": self._serialize(debt)}

    async def update(self, debt_id: int, data: DebtUpdate, user_id: int, is_admin: bool):
        debt = await self.repo.get_by_id(debt_id)
        if not debt:
            raise HTTPException(status_code=404, detail="Debt not found")
        if not is_admin and debt.created_by != user_id:
            raise HTTPException(status_code=403, detail="You can only edit your own debts")

        if data.contact_name is not None:
            debt.contact_name = data.contact_name
        if data.amount is not None:
            debt.amount = Decimal(str(data.amount))
        if data.description is not None:
            debt.description = data.description
        if data.due_date is not None:
            debt.due_date = data.due_date
        if data.is_settled is not None:
            debt.is_settled = data.is_settled
            if data.is_settled:
                from datetime import datetime
                debt.settled_at = datetime.utcnow()

        await self.db.commit()
        return {"success": True, "data": self._serialize(debt)}

    async def delete(self, debt_id: int, user_id: int, is_admin: bool):
        debt = await self.repo.get_by_id(debt_id)
        if not debt:
            raise HTTPException(status_code=404, detail="Debt not found")
        if not is_admin and debt.created_by != user_id:
            raise HTTPException(status_code=403, detail="You can only delete your own debts")
        await self.repo.delete(debt_id)
        await self.db.commit()
        return {"success": True}

    async def get_summary(self, user_id: int, is_admin: bool):
        owed_to_you = await self.repo.sum_by_type_for_user(DebtTypeEnum.given, user_id, is_admin)
        you_owe = await self.repo.sum_by_type_for_user(DebtTypeEnum.taken, user_id, is_admin)
        return {
            "owed_to_you": float(owed_to_you),
            "you_owe": float(you_owe),
            "net": float(owed_to_you) - float(you_owe),
        }

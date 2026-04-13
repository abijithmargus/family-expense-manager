from datetime import date
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete, Date, cast
from app.models.domain import User, Transaction, Category, SavingsPool, Loan, RecurringRule, Budget, Debt, DebtTypeEnum
import logging

logger = logging.getLogger(__name__)

class BaseRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

class TransactionRepository(BaseRepository):
    async def get_by_idempotency_key(self, key: str):
        res = await self.db.execute(select(Transaction).where(Transaction.idempotency_key == key))
        return res.scalars().first()
        
    async def create(self, tx: Transaction):
        self.db.add(tx)
        
    def _apply_filters(self, stmt, start_date=None, end_date=None, month=None, user_id=None, users=None, t_type=None, purpose=None, loan_id=None):
        if start_date:
            d = date.fromisoformat(start_date) if isinstance(start_date, str) else start_date
            stmt = stmt.where(Transaction.date >= d)
        if end_date:
            d = date.fromisoformat(end_date) if isinstance(end_date, str) else end_date
            stmt = stmt.where(Transaction.date <= d)
        if month:
            stmt = stmt.where(func.to_char(Transaction.date, 'YYYY-MM') == month)
            
        if user_id:
            stmt = stmt.where(Transaction.created_by == user_id)
        elif users:
            user_id_list = [int(u) for u in str(users).split(",") if u.strip().isdigit()]
            if user_id_list:
                stmt = stmt.where(Transaction.created_by.in_(user_id_list))
                
        if t_type: stmt = stmt.where(Transaction.type == t_type)
        if purpose: stmt = stmt.where(Transaction.purpose == purpose)
        if loan_id: stmt = stmt.where(Transaction.loan_id == int(loan_id))
        return stmt

    async def get_all(self, start_date=None, end_date=None, users=None, t_type=None, purpose=None, loan_id=None):
        stmt = select(Transaction).order_by(Transaction.date.desc())
        stmt = self._apply_filters(stmt, start_date=start_date, end_date=end_date, users=users, t_type=t_type, purpose=purpose, loan_id=loan_id)
        res = await self.db.execute(stmt)
        return res.scalars().all()
        
    async def get_by_id_for_update(self, tx_id: int):
        res = await self.db.execute(select(Transaction).where(Transaction.id == tx_id).with_for_update())
        return res.scalars().first()
        
    async def delete_by_id(self, tx_id: int):
        await self.db.execute(delete(Transaction).where(Transaction.id == tx_id))
        
    async def sum_by_type(self, type_enum, month: str = None, user_id: int = None, start_date=None, end_date=None, users=None, purpose=None, loan_id=None):
        stmt = select(func.sum(Transaction.amount)).where(Transaction.type == type_enum)
        stmt = self._apply_filters(stmt, start_date=start_date, end_date=end_date, month=month, user_id=user_id, users=users, purpose=purpose, loan_id=loan_id)
        res = await self.db.execute(stmt)
        return res.scalar() or 0
        
    async def get_expenses_by_category(self, type_enum, month: str = None, user_id: int = None, start_date=None, end_date=None, users=None, purpose=None, loan_id=None):
        stmt = (
            select(Category.name, func.sum(Transaction.amount))
            .join(Transaction, Transaction.category_id == Category.id)
            .where(Transaction.type == type_enum)
        )
        stmt = self._apply_filters(stmt, start_date=start_date, end_date=end_date, month=month, user_id=user_id, users=users, purpose=purpose, loan_id=loan_id)
        stmt = stmt.group_by(Category.name)
        
        res = await self.db.execute(stmt)
        return res.all()

class LoanRepository(BaseRepository):
    async def get_all_active(self):
        res = await self.db.execute(select(Loan).where(Loan.is_active == True))
        return res.scalars().all()
        
    async def sum_remaining(self):
        res = await self.db.execute(select(func.sum(Loan.remaining_amount)).where(Loan.is_active == True))
        return res.scalar() or 0
        
    async def get_by_id_for_update(self, loan_id: int):
        res = await self.db.execute(select(Loan).where(Loan.id == loan_id).with_for_update())
        return res.scalars().first()
        
    async def create(self, loan: Loan):
        self.db.add(loan)
        
    async def delete(self, loan_id: int):
        logger.info(f"DB[LoanRepo]: Executing hard DELETE for Loan {loan_id}")
        await self.db.execute(delete(Loan).where(Loan.id == loan_id))

class SavingsRepository(BaseRepository):
    async def get_pools(self):
        res = await self.db.execute(select(SavingsPool).order_by(SavingsPool.name))
        return res.scalars().all()
        
    async def get_pool_by_id_for_update(self, pool_id: int):
        res = await self.db.execute(select(SavingsPool).where(SavingsPool.id == pool_id).with_for_update())
        return res.scalars().first()
        
    async def get_all_pools_balance(self):
        res = await self.db.execute(select(func.sum(SavingsPool.current_balance)))
        return res.scalar() or 0
        
    async def create_pool(self, pool: SavingsPool):
        self.db.add(pool)
        
    async def delete_by_id(self, pool_id: int):
        await self.db.execute(delete(SavingsPool).where(SavingsPool.id == pool_id))

class UserRepository(BaseRepository):
    async def get_by_email(self, email: str):
        res = await self.db.execute(select(User).where(User.email == email))
        return res.scalars().first()
        
    async def get_by_id(self, user_id: int):
        res = await self.db.execute(select(User).where(User.id == user_id, User.is_active == True))
        return res.scalars().first()
        
    async def get_all(self):
        res = await self.db.execute(select(User).where(User.is_active == True))
        return res.scalars().all()

class RuleBudgetRepository(BaseRepository):
    async def get_rules(self):
        res = await self.db.execute(select(RecurringRule).where(RecurringRule.is_active == True))
        return res.scalars().all()
        
    async def create_rule(self, rule: RecurringRule):
        self.db.add(rule)
        
    async def delete_rule_db(self, rule):
        self.db.delete(rule)
        
    async def get_rule_by_id_for_update(self, rule_id: int):
        res = await self.db.execute(select(RecurringRule).where(RecurringRule.id == rule_id).with_for_update())
        return res.scalars().first()
        
    async def delete_rule(self, rule_id: int):
        logger.info(f"DB[RuleBudgetRepo]: Executing hard DELETE for Rule {rule_id}")
        await self.db.execute(delete(RecurringRule).where(RecurringRule.id == rule_id))
        
    async def get_budgets(self):
        res = await self.db.execute(select(Budget).where(Budget.is_active == True))
        return res.scalars().all()
        
    async def create_budget(self, budget: Budget):
        self.db.add(budget)
        
    async def get_budget_by_id_for_update(self, budget_id: int):
        res = await self.db.execute(select(Budget).where(Budget.id == budget_id).with_for_update())
        return res.scalars().first()
        
    async def delete_budget_by_id(self, budget_id: int):
        await self.db.execute(delete(Budget).where(Budget.id == budget_id))

class DebtRepository(BaseRepository):
    async def get_all_for_user(self, user_id: int, is_admin: bool = False, users: str = None):
        stmt = select(Debt).order_by(Debt.created_at.desc())
        if user_id:
            stmt = stmt.where(Debt.created_by == user_id)
        elif users:
            u_list = [int(u) for u in str(users).split(",") if u.strip().isdigit()]
            if u_list: stmt = stmt.where(Debt.created_by.in_(u_list))
        elif not is_admin:
            stmt = stmt.where(Debt.created_by == user_id)
        res = await self.db.execute(stmt)
        return res.scalars().all()

    async def get_by_id(self, debt_id: int):
        res = await self.db.execute(select(Debt).where(Debt.id == debt_id))
        return res.scalars().first()

    async def create(self, debt: Debt):
        self.db.add(debt)

    async def delete(self, debt_id: int):
        await self.db.execute(delete(Debt).where(Debt.id == debt_id))

    async def sum_by_type_for_user(self, debt_type: DebtTypeEnum, user_id: int = None, is_admin: bool = False, users: str = None):
        stmt = select(func.sum(Debt.amount)).where(Debt.type == debt_type, Debt.is_settled == False)
        if user_id:
            stmt = stmt.where(Debt.created_by == user_id)
        elif users:
            u_list = [int(u) for u in str(users).split(",") if u.strip().isdigit()]
            if u_list: stmt = stmt.where(Debt.created_by.in_(u_list))
        elif not is_admin:
            pass
        
        res = await self.db.execute(stmt)
        return res.scalar() or 0

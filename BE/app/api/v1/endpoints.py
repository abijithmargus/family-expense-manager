import logging
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import get_db
from app.api.v1.auth import get_current_user
from app.models.domain import User
from app.repositories.domain_repos import UserRepository

from app.schemas.domain import TransactionCreate, LoanCreate, LoanUpdate, WithdrawRequest, RecurringRuleCreate, BudgetCreate, SavingsPoolCreate, DebtCreate, DebtUpdate
from app.services.business_services import TransactionService, DashboardService, LoanService, SavingsService, RuleBudgetService, DebtService

logger = logging.getLogger(__name__)
router = APIRouter()

# --- Users ---
@router.get("/users")
async def get_all_users(db: AsyncSession = Depends(get_db)):
    repo = UserRepository(db)
    users = await repo.get_all()
    return {"success": True, "data": [{"id": u.id, "name": u.name, "email": u.email, "role": u.role.value} for u in users]}

@router.get("/categories")
async def get_all_categories(db: AsyncSession = Depends(get_db)):
    from sqlalchemy import select
    from app.models.domain import Category
    res = await db.execute(select(Category).where(Category.is_active == True))
    cats = res.scalars().all()
    return {"success": True, "data": [{"id": c.id, "name": c.name} for c in cats]}

# --- Transactions ---

@router.post("/transactions")
async def create_transaction(
    tx: TransactionCreate, 
    db: AsyncSession = Depends(get_db), 
    current_user: User = Depends(get_current_user)
):
    logger.info(f"Received POST /transactions payload from user_id: {current_user.id}")
    service = TransactionService(db)
    return await service.create_transaction(tx, current_user.id)

@router.get("/transactions")
async def get_transactions(
    start_date: str = None,
    end_date: str = None,
    users: str = None,
    type: str = None,
    purpose: str = None,
    loan_id: str = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    logger.info(f"Received GET /transactions request from user_id: {current_user.id} with filters")
    service = TransactionService(db)
    
    # Strict Data Isolation: Default to current user for everyone.
    # Members can ONLY see their own. Admins see theirs by default but can filter for others.
    if not users or not users.strip() or current_user.role.value != "super_admin":
        users = str(current_user.id)
        
    filters = {
        "start_date": start_date if start_date and start_date.strip() else None,
        "end_date": end_date if end_date and end_date.strip() else None,
        "users": users if users and users.strip() else None,
        "type": type if type and type.strip() else None,
        "purpose": purpose if purpose and purpose.strip() else None,
        "loan_id": loan_id if loan_id and loan_id.strip() else None,
    }
    
    return await service.get_all(filters)

@router.delete("/transactions/{tx_id}")
async def delete_transaction(tx_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    logger.info(f"Received DELETE /transactions/{tx_id} request")
    service = TransactionService(db)
    return await service.delete_transaction(tx_id, current_user.id, current_user.role.value)

@router.put("/transactions/{tx_id}")
async def update_transaction(tx_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    # MVP: Currently mapped for architecture placeholder
    return {"success": True, "message": "Transaction update API reached"}

# --- Dashboard ---

@router.get("/dashboard/summary")
async def get_dashboard_summary(
    month: str = None, 
    user_id: str = None, 
    start_date: str = None,
    end_date: str = None,
    users: str = None,
    type: str = None,
    purpose: str = None,
    loan_id: str = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)):
    logger.info(f"Received GET /dashboard/summary request with advanced filters")
    
    # Handle empty strings from frontend
    parsed_user_id = int(user_id) if user_id and user_id.strip() else None
    parsed_month = month if month and month.strip() else None
    
    # Everyone sees global family view by default on Dashboard
    # Filters provided via 'users' or 'user_id' will narrow it down
    pass
        
    service = DashboardService(db)
    return await service.get_summary(
        parsed_month, 
        parsed_user_id,
        start_date=start_date if start_date and start_date.strip() else None,
        end_date=end_date if end_date and end_date.strip() else None,
        users=users if users and users.strip() else None,
        t_type=type if type and type.strip() else None,
        purpose=purpose if purpose and purpose.strip() else None,
        loan_id=loan_id if loan_id and loan_id.strip() else None
    )

# --- Loans ---

@router.get("/loans")
async def get_loans(db: AsyncSession = Depends(get_db)):
    logger.info("Received GET /loans request")
    service = LoanService(db)
    return await service.get_all()

@router.post("/loans")
async def create_loan(loan: LoanCreate, db: AsyncSession = Depends(get_db)):
    logger.info("Received POST /loans request")
    service = LoanService(db)
    return await service.create(loan)

@router.delete("/loans/{loan_id}")
async def delete_loan(loan_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    logger.info(f"Received DELETE /loans/{loan_id} request")
    if current_user.role.value != "super_admin":
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Admin Privileges Required to mutate active loans.")
    service = LoanService(db)
    return await service.delete(loan_id)

@router.put("/loans/{loan_id}")
async def update_loan(loan_id: int, req: LoanUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role.value != "super_admin":
        from fastapi import HTTPException
        raise HTTPException(status_code=403, detail="Admin Privileges Required to mutate active loans.")
    service = LoanService(db)
    return await service.update(loan_id, req)

# --- Savings ---

@router.get("/savings/pool")
async def get_savings(db: AsyncSession = Depends(get_db)):
    logger.info("Received GET /savings/pool request")
    service = SavingsService(db)
    return await service.get_all()

@router.post("/savings/pool")
async def create_savings_pool(req: SavingsPoolCreate, db: AsyncSession = Depends(get_db)):
    logger.info("Received POST /savings/pool request")
    service = SavingsService(db)
    return await service.create_pool(req)

@router.delete("/savings/pool/{pool_id}")
async def delete_savings_pool(pool_id: int, db: AsyncSession = Depends(get_db)):
    logger.info(f"Received DELETE /savings/pool/{pool_id}")
    service = SavingsService(db)
    return await service.delete_pool(pool_id)

@router.post("/savings/withdraw")
async def withdraw_savings(req: WithdrawRequest, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    logger.info(f"Received POST /savings/withdraw request from user_id: {current_user.id}")
    service = SavingsService(db)
    return await service.withdraw(req, current_user.id)

# --- Recurring Rules ---

@router.get("/recurring-rules")
async def get_recurring_rules(db: AsyncSession = Depends(get_db)):
    logger.info("Received GET /recurring-rules request")
    service = RuleBudgetService(db)
    return await service.get_rules()

@router.post("/recurring-rules")
async def create_recurring_rule(req: RecurringRuleCreate, db: AsyncSession = Depends(get_db), user: User = Depends(get_current_user)):
    logger.info(f"Received POST /recurring-rules request from user_id: {user.id}")
    service = RuleBudgetService(db)
    return await service.create_rule(req, user.id)

@router.delete("/recurring-rules/{rule_id}")
async def delete_recurring_rule(rule_id: int, db: AsyncSession = Depends(get_db)):
    logger.info(f"Received DELETE /recurring-rules/{rule_id} request")
    service = RuleBudgetService(db)
    return await service.delete_rule(rule_id)

# --- Budgets ---

@router.get("/budgets")
async def get_budgets(db: AsyncSession = Depends(get_db)):
    logger.info("Received GET /budgets request")
    service = RuleBudgetService(db)
    return await service.get_budgets()

@router.post("/budgets")
async def create_budget(req: BudgetCreate, db: AsyncSession = Depends(get_db)):
    logger.info("Received POST /budgets request")
    service = RuleBudgetService(db)
    return await service.create_budget(req)

@router.delete("/budgets/{budget_id}")
async def delete_budget(budget_id: int, db: AsyncSession = Depends(get_db)):
    logger.info(f"Received DELETE /budgets/{budget_id} request")
    service = RuleBudgetService(db)
    return await service.delete_budget(budget_id)

# --- Debts ---

@router.get("/debts")
async def get_debts(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    service = DebtService(db)
    # Isolation: Only show user's own debts by default. 
    # If we want admins to see family-wide aggregation, we'd add an 'all' flag here.
    return await service.get_all(current_user.id, False)

@router.get("/debts/summary")
async def get_debt_summary(db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    service = DebtService(db)
    return {"success": True, "data": await service.get_summary(current_user.id, False)}

@router.post("/debts")
async def create_debt(req: DebtCreate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    service = DebtService(db)
    return await service.create(req, current_user.id)

@router.put("/debts/{debt_id}")
async def update_debt(debt_id: int, req: DebtUpdate, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    service = DebtService(db)
    is_admin = current_user.role.value == "super_admin"
    return await service.update(debt_id, req, current_user.id, is_admin)

@router.delete("/debts/{debt_id}")
async def delete_debt(debt_id: int, db: AsyncSession = Depends(get_db), current_user: User = Depends(get_current_user)):
    service = DebtService(db)
    is_admin = current_user.role.value == "super_admin"
    return await service.delete(debt_id, current_user.id, is_admin)

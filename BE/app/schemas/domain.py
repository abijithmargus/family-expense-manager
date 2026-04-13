from pydantic import BaseModel
from typing import Optional
from datetime import date

class TransactionCreate(BaseModel):
    idempotency_key: str
    type: str # income, expense, transfer
    amount: float
    date: date
    notes: Optional[str] = None
    purpose: str = "normal"
    category_id: Optional[int] = None
    loan_id: Optional[int] = None
    savings_pool_id: Optional[int] = None
    
    from_user_id: Optional[int] = None
    to_user_id: Optional[int] = None
    from_account_type: Optional[str] = None
    to_account_type: Optional[str] = None

class LoanCreate(BaseModel):
    name: str
    total_amount: float
    interest_type: str
    interest_rate: float
    tenure_months: int
    start_date: date

class SavingsPoolCreate(BaseModel):
    name: str
    initial_amount: float = 0

class WithdrawRequest(BaseModel):
    savings_pool_id: int
    amount: float
    to_user_id: Optional[int] = None

class RecurringRuleCreate(BaseModel):
    rule_type: str
    amount: float
    frequency: str
    category_id: Optional[int] = None
    start_date: date
    savings_pool_id: Optional[int] = None
    loan_id: Optional[int] = None

class BudgetCreate(BaseModel):
    month_year: date
    category_id: int
    amount: float

class TransactionUpdate(BaseModel):
    type: Optional[str] = None
    amount: Optional[float] = None
    date: Optional[date] = None
    notes: Optional[str] = None
    purpose: Optional[str] = None
    category_id: Optional[int] = None
    loan_id: Optional[int] = None
    savings_pool_id: Optional[int] = None
    
class LoanUpdate(BaseModel):
    name: Optional[str] = None
    total_amount: Optional[float] = None
    interest_type: Optional[str] = None
    interest_rate: Optional[float] = None
    tenure_months: Optional[int] = None
    start_date: Optional[date] = None

class SavingsPoolUpdate(BaseModel):
    name: str

class RecurringRuleUpdate(BaseModel):
    amount: Optional[float] = None
    frequency: Optional[str] = None
    category_id: Optional[int] = None
    start_date: Optional[date] = None

class BudgetUpdate(BaseModel):
    amount: float

class DebtCreate(BaseModel):
    contact_name: str
    type: str  # given | taken
    amount: float
    description: Optional[str] = None
    due_date: Optional[date] = None

class DebtUpdate(BaseModel):
    contact_name: Optional[str] = None
    amount: Optional[float] = None
    description: Optional[str] = None
    due_date: Optional[date] = None
    is_settled: Optional[bool] = None

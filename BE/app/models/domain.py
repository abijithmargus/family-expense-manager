from sqlalchemy import Column, Integer, String, Boolean, DateTime, Enum, Numeric, Date, ForeignKey, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import enum
from .base import Base

class RoleEnum(str, enum.Enum):
    super_admin = "super_admin"
    member = "member"

class TypeEnum(str, enum.Enum):
    income = "income"
    expense = "expense"
    transfer = "transfer"

class DebtTypeEnum(str, enum.Enum):
    given = "given"   # You lent money (asset - owed to you)
    taken = "taken"   # You borrowed money (liability - you owe)

class PurposeEnum(str, enum.Enum):
    normal = "normal"
    loan_payment = "loan_payment"
    savings_contribution = "savings_contribution"

class AccountTypeEnum(str, enum.Enum):
    user = "user"
    savings = "savings"

class InterestTypeEnum(str, enum.Enum):
    flat = "flat"
    reducing = "reducing"

class FrequencyEnum(str, enum.Enum):
    daily = "daily"
    weekly = "weekly"
    monthly = "monthly"
    yearly = "yearly"

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    google_id = Column(String(255), unique=True, index=True)
    name = Column(String(100))
    email = Column(String(255), unique=True, index=True)
    role = Column(Enum(RoleEnum))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

class Category(Base):
    __tablename__ = "categories"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True)
    type = Column(Enum(TypeEnum)) # Either income or expense
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

class Transaction(Base):
    __tablename__ = "transactions"
    id = Column(Integer, primary_key=True, index=True)
    idempotency_key = Column(String(255), unique=True, index=True)
    type = Column(Enum(TypeEnum))
    amount = Column(Numeric(15, 4))
    date = Column(Date)
    notes = Column(Text)
    
    from_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    to_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    from_account_type = Column(Enum(AccountTypeEnum), nullable=True)
    to_account_type = Column(Enum(AccountTypeEnum), nullable=True)
    
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    loan_id = Column(Integer, ForeignKey("loans.id"), nullable=True)
    savings_pool_id = Column(Integer, ForeignKey("savings_pool.id"), nullable=True)
    
    purpose = Column(Enum(PurposeEnum))
    created_by = Column(Integer, ForeignKey("users.id"))
    is_system_generated = Column(Boolean, default=False)
    
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

class Loan(Base):
    __tablename__ = "loans"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100))
    total_amount = Column(Numeric(15, 4))
    paid_amount = Column(Numeric(15, 4), default=0)
    remaining_amount = Column(Numeric(15, 4))
    interest_type = Column(Enum(InterestTypeEnum))
    interest_rate = Column(Numeric(5, 4))
    tenure_months = Column(Integer)
    start_date = Column(Date)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

class SavingsPool(Base):
    __tablename__ = "savings_pool"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), default="General Savings", index=True)
    current_balance = Column(Numeric(15, 4), default=0)
    total_contributions = Column(Numeric(15, 4), default=0)
    total_withdrawals = Column(Numeric(15, 4), default=0)
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

class RecurringRule(Base):
    __tablename__ = "recurring_rules"
    id = Column(Integer, primary_key=True, index=True)
    rule_type = Column(String(50)) # "savings_contribution" or "expense"
    amount = Column(Numeric(15, 4))
    frequency = Column(Enum(FrequencyEnum))
    category_id = Column(Integer, ForeignKey("categories.id"))
    assigned_user_id = Column(Integer, ForeignKey("users.id"))
    
    savings_pool_id = Column(Integer, ForeignKey("savings_pool.id"), nullable=True)
    loan_id = Column(Integer, ForeignKey("loans.id"), nullable=True)
    
    start_date = Column(Date)
    next_run_date = Column(Date)
    last_run_date = Column(Date, nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

class Budget(Base):
    __tablename__ = "budgets"
    id = Column(Integer, primary_key=True, index=True)
    month_year = Column(Date)
    category_id = Column(Integer, ForeignKey("categories.id"))
    amount = Column(Numeric(15, 4))
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

class ErrorLog(Base):
    __tablename__ = "error_logs"
    id = Column(Integer, primary_key=True, index=True)
    error_message = Column(Text)
    stack_trace = Column(Text)
    endpoint = Column(String(255))
    method = Column(String(10))
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    request_payload = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=func.now())

class Debt(Base):
    __tablename__ = "debts"
    id = Column(Integer, primary_key=True, index=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    contact_name = Column(String(150), nullable=False)  # Who you lent to / borrowed from
    type = Column(Enum(DebtTypeEnum), nullable=False)   # given | taken
    amount = Column(Numeric(15, 4), nullable=False)
    description = Column(Text, nullable=True)
    due_date = Column(Date, nullable=True)
    is_settled = Column(Boolean, default=False)
    settled_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())

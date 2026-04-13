import asyncio
import csv
import os
from datetime import datetime
from decimal import Decimal
from sqlalchemy import select
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker

# Import models from the app
import sys
sys.path.append(os.getcwd())
from app.models.domain import Transaction, Category, TypeEnum, PurposeEnum, AccountTypeEnum, User, RoleEnum
from app.core.settings import settings

# Database setup
engine = create_async_engine(settings.DATABASE_URL.replace("asyncpg", "asyncpg"))
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

# Configuration mapping
USER_DATA = [
    {"id": 1, "name": "Abi", "email": "abijithmargus@gmail.com", "role": RoleEnum.super_admin},
    {"id": 2, "name": "Angel", "email": "angelmargus266@gmail.com", "role": RoleEnum.member},
    {"id": 3, "name": "Appa", "email": "christianraja319@gmail.com", "role": RoleEnum.member},
    {"id": 4, "name": "Amma", "email": "amma_placeholder@family.com", "role": RoleEnum.member},
]

USER_MAPPING = {
    "amma": 4,
    "appa": 3,
    "angel": 2,
    "savings": 1,
    "abi": 1
}

CATEGORY_MAP = {
    "utilities": "Utilities",
    "pg rent": "Housing",
    "savings": "Savings",
    "food": "Food & Dining",
    "groceries": "Groceries",
    "movie": "Entertainment",
    "electricity bill": "Utilities",
    "amma": "Family & Transfers",
    "appa": "Family & Transfers",
    "angel": "Family & Transfers"
}

async def get_or_create_category(session, name, trans_type=TypeEnum.expense):
    result = await session.execute(select(Category).where(Category.name == name))
    cat = result.scalar_one_or_none()
    if not cat:
        cat = Category(name=name, type=trans_type)
        session.add(cat)
        await session.flush()
    return cat.id

async def ensure_users(session):
    print("Synchronizing user matrix...")
    for u_data in USER_DATA:
        result = await session.execute(select(User).where(User.id == u_data["id"]))
        if not result.scalar_one_or_none():
            new_user = User(**u_data)
            session.add(new_user)
            print(f"Created user: {u_data['name']}")
    await session.flush()

async def import_csv():
    csv_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "expenses.csv")
    print(f"Reading from: {csv_path}")
    
    async with AsyncSessionLocal() as session:
        try:
            await ensure_users(session)
            with open(csv_path, 'r') as f:
                lines = f.readlines()
            
            count = 0
            for line in lines:
                line = line.strip()
                if not line: continue
                
                parts = [p.strip() for p in line.split('\t') if p.strip()]
                if len(parts) < 6: continue
                
                try:
                    date_str = parts[1]
                    date_obj = datetime.strptime(date_str, "%d/%m/%Y").date()
                    
                    description = parts[3].lower()
                    amount = Decimal(parts[4])
                    
                    if amount <= 0: continue
                    
                    # Determine recipient and purpose
                    to_user_id = None
                    to_account_type = AccountTypeEnum.user
                    purpose = PurposeEnum.normal
                    
                    target_key = next((k for k in USER_MAPPING if k in description), None)
                    if target_key:
                        to_user_id = USER_MAPPING[target_key]
                        if target_key == "savings":
                            purpose = PurposeEnum.savings_contribution
                            to_account_type = AccountTypeEnum.savings
                    
                    # Determine Category
                    cat_name = CATEGORY_MAP.get(target_key if target_key else description, "General")
                    cat_id = await get_or_create_category(session, cat_name)
                    
                    # PRE-CHECK: Avoid duplicates and 'autoflush' errors
                    tx_id_key = f"csv_import_{parts[0]}"
                    existing_tx = await session.execute(select(Transaction).where(Transaction.idempotency_key == tx_id_key))
                    if existing_tx.scalar():
                        print(f"Skipping (Already Imported): {date_str} | {description}")
                        continue

                    # Create Transaction
                    tx = Transaction(
                        idempotency_key=tx_id_key,
                        type=TypeEnum.expense,
                        amount=amount,
                        date=date_obj,
                        notes=f"Auto-import: {description}",
                        from_user_id=1, # Abi
                        to_user_id=to_user_id,
                        to_account_type=to_account_type,
                        purpose=purpose,
                        category_id=cat_id,
                        created_by=1,
                        is_system_generated=True
                    )
                    session.add(tx)
                    count += 1
                    print(f"Prepared: {date_str} | {description} | Rs. {amount}")
                    
                except Exception as e:
                    await session.rollback() # Clear the failed state
                    print(f"Skipping line due to error: {line} | Error: {e}")
                    continue
            
            print(f"\nCommitting {count} new transactions to cloud database...")
            await session.commit()
            print("Import completed successfully!")
            
        except Exception as e:
            await session.rollback()
            print(f"Fatal error during import: {e}")

if __name__ == "__main__":
    asyncio.run(import_csv())

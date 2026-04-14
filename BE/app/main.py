from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import text, select
from contextlib import asynccontextmanager
import logging

from app.core.database import engine
from app.core.settings import settings
from app.models.base import Base
from app.models import domain  # Registers all models with SQLAlchemy metadata
from app.models.domain import Category, TypeEnum

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info(f"Verified Google OAuth Client ID: {settings.GOOGLE_CLIENT_ID[:15]}...")
    logger.info(f"Database: {settings.DATABASE_URL.split('://')[0]}")

    # 1. Create any missing tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    # 2. Safe schema migrations (IF NOT EXISTS = idempotent, safe to run every boot)
    try:
        async with engine.begin() as conn:
            await conn.execute(text("ALTER TABLE savings_pool ADD COLUMN IF NOT EXISTS name VARCHAR(100);"))
            await conn.execute(text("UPDATE savings_pool SET name = 'General Savings' WHERE name IS NULL;"))
            await conn.execute(text("ALTER TABLE transactions ADD COLUMN IF NOT EXISTS savings_pool_id INTEGER REFERENCES savings_pool(id);"))
            await conn.execute(text("ALTER TABLE recurring_rules ADD COLUMN IF NOT EXISTS savings_pool_id INTEGER REFERENCES savings_pool(id);"))
            await conn.execute(text("ALTER TABLE recurring_rules ADD COLUMN IF NOT EXISTS loan_id INTEGER REFERENCES loans(id);"))

        # 3. Seed default expense categories (skips existing ones)
        async with AsyncSession(engine) as session:
            for name in ['Food', 'Electricity Bill', 'Groceries', 'Fuel', 'Rent', 'Medicine', 'Others']:
                exists = await session.execute(select(Category).where(Category.name == name))
                if not exists.scalars().first():
                    session.add(Category(name=name, type=TypeEnum.expense, is_active=True))
            await session.commit()
            logger.info("Startup migrations and category seeding complete.")

    except Exception as e:
        logger.error(f"Startup migration error: {e}")

    logger.info("Application ready.")
    yield


app = FastAPI(title="Family Finance Manager API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5180",
        "https://*.vercel.app",
        "https://*.trycloudflare.com",
        "https://*.ngrok-free.dev",
        "https://family-expense-manager.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from app.api.v1.auth import router as auth_router
from app.api.v1.endpoints import router as api_router

app.include_router(auth_router, prefix="/api/v1/auth", tags=["Auth"])
app.include_router(api_router, prefix="/api/v1", tags=["API"])


@app.get("/healthCheck")
def health_check():
    return {"status": "ok"}

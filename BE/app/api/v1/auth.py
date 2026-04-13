import logging
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from google.oauth2 import id_token
from google.auth.transport import requests
from pydantic import BaseModel
from datetime import datetime, timedelta, timezone
import jwt

from app.core.settings import settings
from app.core.database import get_db
from app.models.domain import User, RoleEnum

logger = logging.getLogger(__name__)
router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/auth/google")

class GoogleAuthRequest(BaseModel):
    id_token: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str
    user: dict

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    logger.info(f"Issuing JWT access token for ID {data.get('sub')}")
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: AsyncSession = Depends(get_db)):
    logger.info("Verifying JWT attached to protected route access...")
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        token=str(token)
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id_str = payload.get("sub")
        if user_id_str is None:
            raise credentials_exception
        user_id = int(user_id_str)
    except jwt.ExpiredSignatureError as e:
        logger.warning(f"JWT explicitly EXPIRED. Token rejected: {e}")
        raise credentials_exception
    except jwt.InvalidTokenError as e:
        logger.warning(f"JWT Decode Validation Failed. Error Context: {type(e).__name__} - {str(e)} | Token preview: {token[:25]}...")
        raise credentials_exception
        
    res = await db.execute(select(User).where(User.id == user_id, User.is_active == True))
    user = res.scalars().first()
    if user is None:
        logger.warning(f"Rejecting valid JWT bounded to inactive or missing user {user_id}")
        raise credentials_exception
    
    logger.info(f"JWT successfully validated for User_ID: {user.id} ({user.role.value})")
    return user

@router.post("/google", response_model=TokenResponse)
async def google_auth(request: GoogleAuthRequest, db: AsyncSession = Depends(get_db)):
    logger.info("Received POST /api/v1/auth/google logic loop...")
    try:
        idinfo = id_token.verify_oauth2_token(
            request.id_token, requests.Request(), settings.GOOGLE_CLIENT_ID
        )
        logger.info("Google strictly verified OAuth token signature successfully.")
        
        email = idinfo["email"]
        name = idinfo.get("name", "Unknown Name")
        google_id = idinfo["sub"]
        
        res = await db.execute(select(User).where(User.email == email))
        user = res.scalars().first()
        
        if not user:
            logger.info(f"User email {email} not found in DB. Initiating new user creation.")
            count_res = await db.execute(select(User))
            is_first = len(count_res.scalars().all()) == 0
            role = RoleEnum.super_admin if is_first else RoleEnum.member
            
            logger.info(f"Generating account. First user flag: {is_first}. Assigned Role: {role}")
            user = User(
                google_id=google_id,
                email=email,
                name=name,
                role=role
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)

        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(user.id), "role": user.role.value}, expires_delta=access_token_expires
        )
        
        logger.info(f"Returning successful login flow data for UID: {user.id}")
        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": {
                "id": user.id,
                "name": user.name,
                "email": user.email,
                "role": user.role.value
            }
        }
    except ValueError as e:
        logger.error(f"Google login signature check failed: {e}")
        raise HTTPException(status_code=400, detail=f"Invalid Google Token: {str(e)}")

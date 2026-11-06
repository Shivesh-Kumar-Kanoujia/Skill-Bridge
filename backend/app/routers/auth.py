"""Authentication endpoints: signup, login, logout, current user."""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import (
    create_access_token,
    get_current_user_full,
    get_current_user_optional,
    hash_password,
    verify_password,
)
from app.models import User, StudentProfile
from app.services.audit import log_action
from app.schemas import (
    LoginRequest,
    MessageResponse,
    SignupRequest,
    TokenResponse,
    UserPublic,
)

router = APIRouter(prefix="/api/auth", tags=["auth"])
logger = logging.getLogger("skillbridge.auth")


@router.post("/signup", response_model=TokenResponse, status_code=status.HTTP_201_CREATED)
async def signup(body: SignupRequest, db: AsyncSession = Depends(get_db)):
    """Register a new student account."""
    # Check duplicate email
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="An account with this email already exists.",
        )

    # Create user
    user = User(
        email=body.email,
        password_hash=hash_password(body.password),
        role="student",
    )
    db.add(user)
    await db.flush()  # get user.id

    # Create student profile
    profile = StudentProfile(
        user_id=user.id,
        name=body.name,
        department=body.department,
        semester=body.semester,
    )
    db.add(profile)
    await log_action(db, user_id=user.id, action="SIGNUP", entity_type="user", entity_id=user.id, details=f"User signed up: {user.email}")
    await db.commit()
    await db.refresh(user)

    logger.info("New signup: user_id=%d email=%s", user.id, user.email)

    token = create_access_token(data={"sub": str(user.id)})
    return TokenResponse(
        access_token=token,
        user=UserPublic(id=user.id, email=user.email, role=user.role),
    )


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: AsyncSession = Depends(get_db)):
    """Authenticate with email and password."""
    result = await db.execute(select(User).where(User.email == body.email))
    user = result.scalar_one_or_none()

    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated.",
        )

    await log_action(db, user_id=user.id, action="LOGIN", entity_type="user", entity_id=user.id, details=f"User logged in: {user.email}")
    await db.commit()

    logger.info("Login: user_id=%d", user.id)
    token = create_access_token(data={"sub": str(user.id)})
    return TokenResponse(
        access_token=token,
        user=UserPublic(id=user.id, email=user.email, role=user.role),
    )


@router.get("/me", response_model=UserPublic)
async def get_current_user_info(
    user_id: int = Depends(get_current_user_full),
    db: AsyncSession = Depends(get_db),
):
    """Return the current authenticated user's basic info."""
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found.")
    return UserPublic(id=user.id, email=user.email, role=user.role)


@router.post("/logout", response_model=MessageResponse)
async def logout(user_id: Optional[int] = Depends(get_current_user_optional)):
    """Logout — JWT is stateless so the client simply discards the token."""
    if user_id:
        logger.info("Logout: user_id=%d", user_id)
    return MessageResponse(message="Logged out successfully.")

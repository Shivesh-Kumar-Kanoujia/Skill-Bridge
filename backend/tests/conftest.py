"""Pytest test configuration and fixtures for SkillBridge backend."""

import pytest
import pytest_asyncio
from typing import AsyncGenerator
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import StaticPool

from app.core.database import Base, get_db
from app.main import app
from app.core.security import hash_password, create_access_token
from app.models import User, StudentProfile, Skill, StudentSkill

# In-memory SQLite database for testing
TEST_DATABASE_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)

TestingSessionLocal = async_sessionmaker(
    test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


@pytest_asyncio.fixture(autouse=True)
async def setup_db() -> AsyncGenerator[None, None]:
    """Create all tables in memory before each test and drop them after."""
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)


async def override_get_db() -> AsyncGenerator[AsyncSession, None]:
    async with TestingSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


app.dependency_overrides[get_db] = override_get_db


@pytest_asyncio.fixture
async def client() -> AsyncGenerator[AsyncClient, None]:
    """Async HTTP client for testing API endpoints."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest_asyncio.fixture
async def db_session() -> AsyncGenerator[AsyncSession, None]:
    """Yield a database session for direct model manipulation in tests."""
    async with TestingSessionLocal() as session:
        yield session


@pytest_asyncio.fixture
async def test_user(db_session: AsyncSession) -> dict:
    """Create a primary test user with profile."""
    user = User(
        email="test.student@apex.edu",
        password_hash=hash_password("password123"),
        role="student",
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()

    profile = StudentProfile(
        user_id=user.id,
        name="Test Student",
        department="Computer Science",
        semester=5,
        college="Apex Institute of Technology",
        availability_status="Actively Looking",
        availability_hours=15,
    )
    db_session.add(profile)
    await db_session.commit()
    await db_session.refresh(user)

    token = create_access_token(data={"sub": str(user.id)})
    return {
        "user_id": user.id,
        "email": user.email,
        "token": token,
        "headers": {"Authorization": f"Bearer {token}"},
    }


@pytest_asyncio.fixture
async def second_user(db_session: AsyncSession) -> dict:
    """Create a second test user with profile for authorization checks."""
    user = User(
        email="second.student@apex.edu",
        password_hash=hash_password("password123"),
        role="student",
        is_active=True,
    )
    db_session.add(user)
    await db_session.flush()

    profile = StudentProfile(
        user_id=user.id,
        name="Second Student",
        department="Information Science",
        semester=4,
        college="Apex Institute of Technology",
        availability_status="Open to Offers",
        availability_hours=10,
    )
    db_session.add(profile)
    await db_session.commit()
    await db_session.refresh(user)

    token = create_access_token(data={"sub": str(user.id)})
    return {
        "user_id": user.id,
        "email": user.email,
        "token": token,
        "headers": {"Authorization": f"Bearer {token}"},
    }


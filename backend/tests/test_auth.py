"""Authentication and authorization tests."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    """Verify health endpoint."""
    response = await client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"


@pytest.mark.asyncio
async def test_signup_success(client: AsyncClient):
    """Verify new student registration."""
    payload = {
        "name": "New User",
        "email": "new.user@apex.edu",
        "password": "securepassword123",
        "department": "Computer Science",
        "semester": 3,
    }
    response = await client.post("/api/auth/signup", json=payload)
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "new.user@apex.edu"


@pytest.mark.asyncio
async def test_signup_duplicate_email(client: AsyncClient, test_user: dict):
    """Verify registration fails with duplicate email."""
    payload = {
        "name": "Duplicate User",
        "email": test_user["email"],
        "password": "password123",
        "department": "Computer Science",
        "semester": 4,
    }
    response = await client.post("/api/auth/signup", json=payload)
    assert response.status_code == 409


@pytest.mark.asyncio
async def test_signup_invalid_data(client: AsyncClient):
    """Verify registration validation rules."""
    # Invalid email
    response = await client.post("/api/auth/signup", json={
        "name": "Invalid Email",
        "email": "notanemail",
        "password": "password123",
        "department": "CS",
        "semester": 3,
    })
    assert response.status_code == 422

    # Password too short
    response = await client.post("/api/auth/signup", json={
        "name": "Short Pass",
        "email": "short@apex.edu",
        "password": "123",
        "department": "CS",
        "semester": 3,
    })
    assert response.status_code == 422


@pytest.mark.asyncio
async def test_login_success(client: AsyncClient, test_user: dict):
    """Verify valid login returns JWT access token."""
    response = await client.post("/api/auth/login", json={
        "email": test_user["email"],
        "password": "password123",
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == test_user["email"]


@pytest.mark.asyncio
async def test_login_invalid_credentials(client: AsyncClient, test_user: dict):
    """Verify invalid password returns 401."""
    response = await client.post("/api/auth/login", json={
        "email": test_user["email"],
        "password": "wrongpassword",
    })
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_login_nonexistent_user(client: AsyncClient):
    """Verify non-existent user returns 401."""
    response = await client.post("/api/auth/login", json={
        "email": "nobody@apex.edu",
        "password": "password123",
    })
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_get_current_user_me(client: AsyncClient, test_user: dict):
    """Verify /api/auth/me returns current user."""
    response = await client.get("/api/auth/me", headers=test_user["headers"])
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == test_user["email"]
    assert data["id"] == test_user["user_id"]


@pytest.mark.asyncio
async def test_unauthenticated_request_rejected(client: AsyncClient):
    """Verify protected route rejects request without token."""
    response = await client.get("/api/auth/me")
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_logout(client: AsyncClient, test_user: dict):
    """Verify logout returns success."""
    response = await client.post("/api/auth/logout", headers=test_user["headers"])
    assert response.status_code == 200
    assert response.json()["success"] is True


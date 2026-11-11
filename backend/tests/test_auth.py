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


@pytest.mark.asyncio
async def test_signup_duplicate_case_insensitive_preserves_existing_account(client: AsyncClient):
    """Duplicate signup (varying case/spaces) returns 409 and never overwrites password or profile."""
    signup_payload = {
        "name": "Original Student",
        "email": "CaseTest@Apex.edu",
        "password": "OriginalPassword#1",
        "department": "Computer Science",
        "semester": 5,
    }
    res1 = await client.post("/api/auth/signup", json=signup_payload)
    assert res1.status_code == 201
    token1 = res1.json()["access_token"]

    # Update profile to verify it is preserved after duplicate signup attempt
    upd = await client.put(
        "/api/students/me",
        headers={"Authorization": f"Bearer {token1}"},
        json={"headline": "Original Headline Preserved", "bio": "Do not lose this bio."},
    )
    assert upd.status_code == 200

    # Attempt duplicate signup with different casing, leading/trailing spaces, and new password/name
    res2 = await client.post(
        "/api/auth/signup",
        json={
            "name": "Hijacker Name",
            "email": "  casetest@apex.edu  ",
            "password": "NewAttemptPassword#2",
            "department": "Mechanical",
            "semester": 2,
        },
    )
    assert res2.status_code == 409
    assert res2.json()["detail"] == "An account with this email already exists. Please sign in."

    # Original password still works cleanly (even with mixed case/whitespace)
    login_orig = await client.post(
        "/api/auth/login",
        json={"email": "  CASETEST@APEX.EDU ", "password": "OriginalPassword#1"},
    )
    assert login_orig.status_code == 200
    new_token = login_orig.json()["access_token"]

    # New password from duplicate attempt must be rejected
    login_hijack = await client.post(
        "/api/auth/login",
        json={"email": "casetest@apex.edu", "password": "NewAttemptPassword#2"},
    )
    assert login_hijack.status_code == 401

    # Original profile name and bio remain completely intact
    me_res = await client.get(
        "/api/students/me",
        headers={"Authorization": f"Bearer {new_token}"},
    )
    assert me_res.status_code == 200
    assert me_res.json()["name"] == "Original Student"
    assert me_res.json()["headline"] == "Original Headline Preserved"
    assert me_res.json()["bio"] == "Do not lose this bio."


@pytest.mark.asyncio
async def test_login_does_not_mutate_password_across_defaults(client: AsyncClient, test_user: dict):
    """Logging in with another seeded default password must return 401 and NOT overwrite stored hash."""
    bad_login = await client.post(
        "/api/auth/login",
        json={"email": test_user["email"], "password": "SkillBridge2026!"},
    )
    assert bad_login.status_code == 401

    # Original password ("password123") must still succeed
    good_login = await client.post(
        "/api/auth/login",
        json={"email": test_user["email"], "password": "password123"},
    )
    assert good_login.status_code == 200


@pytest.mark.asyncio
async def test_db_enforces_case_insensitive_unique_email_index(db_session):
    """Database unique index rejects direct mixed-case / whitespace duplicate inserts."""
    from sqlalchemy.exc import IntegrityError
    from app.core.security import hash_password
    from app.models import User

    db_session.add(User(email="direct@apex.edu", password_hash=hash_password("secret123")))
    await db_session.commit()

    db_session.add(User(email="  DIRECT@APEX.EDU ", password_hash=hash_password("other1234")))
    with pytest.raises(IntegrityError):
        await db_session.commit()
    await db_session.rollback()


@pytest.mark.asyncio
async def test_concurrent_duplicate_signup_race_safe(tmp_path):
    """Concurrent signup requests for the same email create strictly 1 user and return 409 for loser."""
    import asyncio
    from fastapi import HTTPException
    from sqlalchemy import func, select
    from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
    from app.core.database import Base, _ensure_normalized_email_index
    from app.models import User
    from app.routers.auth import signup
    from app.schemas.schemas import SignupRequest

    db_file = tmp_path / "race.db"
    conc_engine = create_async_engine(
        f"sqlite+aiosqlite:///{db_file.as_posix()}",
        connect_args={"check_same_thread": False, "timeout": 5},
    )
    async with conc_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.run_sync(_ensure_normalized_email_index)

    session_factory = async_sessionmaker(conc_engine, class_=AsyncSession, expire_on_commit=False)

    async def attempt_signup(idx: int):
        async with session_factory() as session:
            body = SignupRequest(
                name=f"Concurrent User {idx}",
                email="race.student@apex.edu" if idx == 0 else "RACE.STUDENT@apex.edu",
                password="RacePassword123",
                department="Computer Science",
                semester=4,
            )
            try:
                res = await signup(body=body, db=session)
                return ("ok", res.user.id)
            except HTTPException as exc:
                return ("err", exc.status_code, exc.detail)

    results = await asyncio.gather(attempt_signup(0), attempt_signup(1))
    await conc_engine.dispose()

    statuses = sorted(r[0] for r in results)
    assert statuses == ["err", "ok"]
    err_item = [r for r in results if r[0] == "err"][0]
    assert err_item[1] == 409
    assert err_item[2] == "An account with this email already exists. Please sign in."

    # Verify strictly 1 user exists in DB
    verify_engine = create_async_engine(f"sqlite+aiosqlite:///{db_file.as_posix()}")
    verify_factory = async_sessionmaker(verify_engine, class_=AsyncSession)
    async with verify_factory() as s:
        count = await s.scalar(select(func.count(User.id)))
        assert count == 1
    await verify_engine.dispose()


@pytest.mark.asyncio
async def test_profile_and_project_persist_across_logout_and_relogin(client: AsyncClient):
    """Profile updates and published recruitment briefs persist cleanly across sessions."""
    res = await client.post(
        "/api/auth/signup",
        json={
            "name": "Persistent Student",
            "email": "persist.student@apex.edu",
            "password": "PersistPass#99",
            "department": "AI & Data Science",
            "semester": 6,
        },
    )
    assert res.status_code == 201
    token1 = res.json()["access_token"]
    headers1 = {"Authorization": f"Bearer {token1}"}

    # Update profile
    upd = await client.put(
        "/api/students/me",
        headers=headers1,
        json={"bio": "Building distributed systems.", "headline": "Backend Lead"},
    )
    assert upd.status_code == 200

    # Publish recruitment brief
    proj_res = await client.post(
        "/api/projects",
        headers=headers1,
        json={
            "title": "Campus Mesh Network",
            "tagline": "Resilient offline-first LoRa campus chat",
            "description": "Longer project description that easily satisfies the twenty character requirement.",
            "category": "Capstone",
            "max_team_size": 4,
            "required_skills": ["Python", "FastAPI"],
            "open_roles": [
                {
                    "id": "role-1",
                    "title": "Firmware Engineer",
                    "spots": 1,
                    "filled": 0,
                    "description": "ESP32 mesh routing",
                    "skills": ["C++"],
                }
            ],
        },
    )
    assert proj_res.status_code == 201
    created_project_id = proj_res.json()["id"]

    # Logout and re-login
    await client.post("/api/auth/logout", headers=headers1)
    relogin = await client.post(
        "/api/auth/login",
        json={"email": "persist.student@apex.edu", "password": "PersistPass#99"},
    )
    assert relogin.status_code == 200
    headers2 = {"Authorization": f"Bearer {relogin.json()['access_token']}"}

    me = await client.get("/api/students/me", headers=headers2)
    assert me.status_code == 200
    assert me.json()["bio"] == "Building distributed systems."
    assert me.json()["headline"] == "Backend Lead"

    projects_list = await client.get("/api/projects")
    assert projects_list.status_code == 200
    assert any(p["id"] == created_project_id and p["title"] == "Campus Mesh Network" for p in projects_list.json())


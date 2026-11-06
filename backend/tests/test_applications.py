"""Project applications and atomic team formation tests."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_apply_to_project_success(client: AsyncClient, test_user: dict, second_user: dict):
    """Verify student can apply to another user's project."""
    # test_user creates project
    proj_res = await client.post("/api/projects", json={
        "title": "Robotics Exploration",
        "category": "Open Source",
        "max_team_size": 3,
        "required_skills": ["Python", "C++"],
        "status": "Recruiting",
    }, headers=test_user["headers"])
    proj_id = int(proj_res.json()["id"].replace("proj-", ""))

    # second_user applies
    apply_res = await client.post("/api/applications", json={
        "project_id": proj_id,
        "role_applied": "Firmware Engineer",
        "statement": "I have experience with C++ and embedded systems.",
    }, headers=second_user["headers"])
    assert apply_res.status_code == 201
    data = apply_res.json()
    assert data["status"] == "Pending"
    assert data["roleApplied"] == "Firmware Engineer"
    assert data["applicantId"] == f"student-{second_user['user_id']}"


@pytest.mark.asyncio
async def test_cannot_apply_to_own_project(client: AsyncClient, test_user: dict):
    """Verify user cannot apply to their own project."""
    proj_res = await client.post("/api/projects", json={
        "title": "Solo Project",
        "category": "Coursework",
        "max_team_size": 2,
    }, headers=test_user["headers"])
    proj_id = int(proj_res.json()["id"].replace("proj-", ""))

    apply_res = await client.post("/api/applications", json={
        "project_id": proj_id,
        "role_applied": "Lead",
        "statement": "Applying to my own project",
    }, headers=test_user["headers"])
    assert apply_res.status_code == 400


@pytest.mark.asyncio
async def test_duplicate_application_prevented(client: AsyncClient, test_user: dict, second_user: dict):
    """Verify duplicate applications are rejected with 409 Conflict."""
    proj_res = await client.post("/api/projects", json={
        "title": "Duplicate Test Project",
        "category": "Capstone",
        "max_team_size": 4,
    }, headers=test_user["headers"])
    proj_id = int(proj_res.json()["id"].replace("proj-", ""))

    # First application
    await client.post("/api/applications", json={
        "project_id": proj_id,
        "role_applied": "Frontend",
        "statement": "First submission statement.",
    }, headers=second_user["headers"])

    # Duplicate application attempt
    dup_res = await client.post("/api/applications", json={
        "project_id": proj_id,
        "role_applied": "Frontend",
        "statement": "Second duplicate statement.",
    }, headers=second_user["headers"])
    assert dup_res.status_code == 409


@pytest.mark.asyncio
async def test_accept_application_creates_team_member(client: AsyncClient, test_user: dict, second_user: dict):
    """Verify owner accepting application atomically creates team membership."""
    # test_user creates project with max_team_size = 2 (owner + 1)
    proj_res = await client.post("/api/projects", json={
        "title": "Team Formation Test",
        "category": "Capstone",
        "max_team_size": 2,
    }, headers=test_user["headers"])
    proj_id = int(proj_res.json()["id"].replace("proj-", ""))

    # second_user applies
    app_res = await client.post("/api/applications", json={
        "project_id": proj_id,
        "role_applied": "Data Scientist",
        "statement": "I have experience with pandas and sklearn.",
    }, headers=second_user["headers"])
    app_id = int(app_res.json()["id"].replace("app-", ""))

    # test_user (owner) accepts application
    accept_res = await client.post(
        f"/api/applications/{app_id}/action",
        json={"action": "accept"},
        headers=test_user["headers"],
    )
    assert accept_res.status_code == 200
    assert accept_res.json()["status"] == "Accepted"

    # Verify team member was created
    team_res = await client.get(f"/api/teams/{proj_id}/members")
    assert team_res.status_code == 200
    members = team_res.json()
    assert len(members) == 2
    member_ids = [m["studentId"] for m in members]
    assert f"student-{second_user['user_id']}" in member_ids


@pytest.mark.asyncio
async def test_non_owner_cannot_accept_application(client: AsyncClient, test_user: dict, second_user: dict):
    """Verify non-owner cannot accept applications (403)."""
    proj_res = await client.post("/api/projects", json={
        "title": "Owner Only Action",
        "category": "Coursework",
        "max_team_size": 3,
    }, headers=test_user["headers"])
    proj_id = int(proj_res.json()["id"].replace("proj-", ""))

    app_res = await client.post("/api/applications", json={
        "project_id": proj_id,
        "role_applied": "Developer",
        "statement": "Applying here.",
    }, headers=second_user["headers"])
    app_id = int(app_res.json()["id"].replace("app-", ""))

    # second_user tries to accept their own application
    malicious_res = await client.post(
        f"/api/applications/{app_id}/action",
        json={"action": "accept"},
        headers=second_user["headers"],
    )
    assert malicious_res.status_code == 403


@pytest.mark.asyncio
async def test_team_capacity_limit_enforced(client: AsyncClient, test_user: dict, second_user: dict, db_session):
    """Verify acceptance fails with 409 when max_team_size is reached."""
    # test_user creates project with max_team_size = 1 (only owner fits!)
    proj_res = await client.post("/api/projects", json={
        "title": "Full Project",
        "category": "Coursework",
        "max_team_size": 1,
    }, headers=test_user["headers"])
    proj_id = int(proj_res.json()["id"].replace("proj-", ""))

    # second_user applies
    app_res = await client.post("/api/applications", json={
        "project_id": proj_id,
        "role_applied": "Extra Member",
        "statement": "Trying to join full team.",
    }, headers=second_user["headers"])
    app_id = int(app_res.json()["id"].replace("app-", ""))

    # Attempt to accept — should fail due to capacity
    accept_res = await client.post(
        f"/api/applications/{app_id}/action",
        json={"action": "accept"},
        headers=test_user["headers"],
    )
    assert accept_res.status_code == 409
    assert "full" in accept_res.json()["detail"].lower()


@pytest.mark.asyncio
async def test_withdraw_application(client: AsyncClient, test_user: dict, second_user: dict):
    """Verify applicant can withdraw their own pending application."""
    proj_res = await client.post("/api/projects", json={
        "title": "Withdrawal Test",
        "category": "Coursework",
        "max_team_size": 3,
    }, headers=test_user["headers"])
    proj_id = int(proj_res.json()["id"].replace("proj-", ""))

    app_res = await client.post("/api/applications", json={
        "project_id": proj_id,
        "role_applied": "Designer",
        "statement": "Application before withdrawal.",
    }, headers=second_user["headers"])
    app_id = int(app_res.json()["id"].replace("app-", ""))

    # second_user withdraws
    withdraw_res = await client.post(
        f"/api/applications/{app_id}/withdraw",
        headers=second_user["headers"],
    )
    assert withdraw_res.status_code == 200
    assert withdraw_res.json()["success"] is True


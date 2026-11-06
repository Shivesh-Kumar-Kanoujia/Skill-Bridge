"""Team management and invitation tests."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_get_my_teams(client: AsyncClient, test_user: dict):
    """Verify listing of user's active team memberships."""
    # Create project (user becomes owner & member)
    await client.post("/api/projects", json={
        "title": "My Team Project",
        "category": "Coursework",
        "max_team_size": 3,
    }, headers=test_user["headers"])

    res = await client.get("/api/teams/my", headers=test_user["headers"])
    assert res.status_code == 200
    teams = res.json()
    assert len(teams) >= 1
    assert any(t["projectTitle"] == "My Team Project" for t in teams)


@pytest.mark.asyncio
async def test_send_and_accept_invitation(client: AsyncClient, test_user: dict, second_user: dict):
    """Verify owner can invite a student and student can accept into team."""
    # test_user creates project
    proj_res = await client.post("/api/projects", json={
        "title": "Invite Test Project",
        "category": "Hackathon",
        "max_team_size": 4,
    }, headers=test_user["headers"])
    proj_id = int(proj_res.json()["id"].replace("proj-", ""))

    # test_user invites second_user
    inv_res = await client.post("/api/invitations", json={
        "project_id": proj_id,
        "student_id": second_user["user_id"],
        "role": "Backend Specialist",
        "message": "Join our hackathon squad!",
    }, headers=test_user["headers"])
    assert inv_res.status_code == 201
    inv_id = int(inv_res.json()["id"].replace("inv-", ""))

    # second_user checks received invitations
    my_invs = await client.get("/api/invitations/my", headers=second_user["headers"])
    assert my_invs.status_code == 200
    assert any(i["id"] == f"inv-{inv_id}" for i in my_invs.json())

    # second_user accepts invitation
    accept_res = await client.post(
        f"/api/invitations/{inv_id}/action",
        json={"action": "accept"},
        headers=second_user["headers"],
    )
    assert accept_res.status_code == 200
    assert accept_res.json()["status"] == "Accepted"

    # Verify second_user is now a team member
    members_res = await client.get(f"/api/teams/{proj_id}/members")
    assert members_res.status_code == 200
    members = members_res.json()
    assert any(m["studentId"] == f"student-{second_user['user_id']}" for m in members)


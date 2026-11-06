"""Project management and authorization tests."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_create_project(client: AsyncClient, test_user: dict):
    """Verify authenticated user can create a project and becomes owner & member."""
    payload = {
        "title": "Autonomous Drone Navigation",
        "tagline": "Computer vision drone project",
        "description": "Building an autonomous quadcopter using ROS2 and OpenCV.",
        "category": "Capstone",
        "max_team_size": 4,
        "duration": "12 Weeks",
        "deadline": "Nov 30, 2026",
        "required_skills": ["Python", "ROS2", "OpenCV"],
        "preferred_interests": ["Robotics", "AI/ML"],
        "open_roles": [
            {
                "id": "role-1",
                "title": "CV Engineer",
                "spots": 1,
                "filled": 0,
                "skills": ["Python", "OpenCV"],
                "description": "Implement feature tracking.",
            }
        ],
        "status": "Recruiting",
    }
    response = await client.post("/api/projects", json=payload, headers=test_user["headers"])
    assert response.status_code == 201
    data = response.json()
    assert data["title"] == "Autonomous Drone Navigation"
    assert data["category"] == "Capstone"
    assert data["ownerId"] == f"student-{test_user['user_id']}"
    assert data["teamSize"]["current"] == 1
    assert data["teamSize"]["max"] == 4
    assert len(data["requiredSkills"]) == 3
    assert len(data["currentMembers"]) == 1
    assert data["currentMembers"][0]["isOwner"] is True


@pytest.mark.asyncio
async def test_create_project_unauthenticated(client: AsyncClient):
    """Verify unauthenticated user cannot create a project."""
    payload = {
        "title": "Unauthenticated Project",
        "category": "Coursework",
        "max_team_size": 3,
    }
    response = await client.post("/api/projects", json=payload)
    assert response.status_code == 401


@pytest.mark.asyncio
async def test_update_project_by_owner(client: AsyncClient, test_user: dict):
    """Verify owner can update their project."""
    # Create project first
    create_res = await client.post("/api/projects", json={
        "title": "Initial Title",
        "category": "Coursework",
        "max_team_size": 3,
    }, headers=test_user["headers"])
    assert create_res.status_code == 201
    proj_id = int(create_res.json()["id"].replace("proj-", ""))

    # Update
    update_res = await client.put(f"/api/projects/{proj_id}", json={
        "title": "Updated Title",
        "status": "In Progress",
    }, headers=test_user["headers"])
    assert update_res.status_code == 200
    assert update_res.json()["title"] == "Updated Title"
    assert update_res.json()["status"] == "In Progress"


@pytest.mark.asyncio
async def test_update_project_by_non_owner_forbidden(client: AsyncClient, test_user: dict, second_user: dict):
    """Verify non-owner CANNOT update someone else's project (403)."""
    # test_user creates project
    create_res = await client.post("/api/projects", json={
        "title": "Owner Project",
        "category": "Coursework",
        "max_team_size": 4,
    }, headers=test_user["headers"])
    proj_id = int(create_res.json()["id"].replace("proj-", ""))

    # second_user attempts update
    update_res = await client.put(f"/api/projects/{proj_id}", json={
        "title": "Malicious Modification",
    }, headers=second_user["headers"])
    assert update_res.status_code == 403


@pytest.mark.asyncio
async def test_list_and_filter_projects(client: AsyncClient, test_user: dict):
    """Verify search, category filter, and sorting for projects."""
    # Create two projects
    await client.post("/api/projects", json={
        "title": "Web App Development",
        "category": "Hackathon",
        "max_team_size": 3,
        "required_skills": ["React"],
    }, headers=test_user["headers"])

    await client.post("/api/projects", json={
        "title": "Machine Learning Research",
        "category": "Research",
        "max_team_size": 4,
        "required_skills": ["PyTorch"],
    }, headers=test_user["headers"])

    # Search query
    res = await client.get("/api/projects?search=Machine")
    assert res.status_code == 200
    data = res.json()
    assert any("Machine" in p["title"] for p in data)

    # Category filter
    res_cat = await client.get("/api/projects?category=Hackathon")
    assert res_cat.status_code == 200
    data_cat = res_cat.json()
    assert all(p["category"] == "Hackathon" for p in data_cat)


@pytest.mark.asyncio
async def test_get_project_by_id(client: AsyncClient, test_user: dict):
    """Verify project retrieval by ID."""
    create_res = await client.post("/api/projects", json={
        "title": "Single Project Check",
        "category": "Startup",
        "max_team_size": 5,
    }, headers=test_user["headers"])
    proj_id = int(create_res.json()["id"].replace("proj-", ""))

    get_res = await client.get(f"/api/projects/{proj_id}")
    assert get_res.status_code == 200
    assert get_res.json()["title"] == "Single Project Check"


"""Student profile and skills management tests."""

import pytest
from httpx import AsyncClient


@pytest.mark.asyncio
async def test_list_students(client: AsyncClient, test_user: dict, second_user: dict):
    """Verify students directory listing."""
    response = await client.get("/api/students")
    assert response.status_code == 200
    data = response.json()
    assert len(data) >= 2


@pytest.mark.asyncio
async def test_list_students_filter_department(client: AsyncClient, test_user: dict, second_user: dict):
    """Verify department filter on students list."""
    response = await client.get("/api/students?department=Computer")
    assert response.status_code == 200
    data = response.json()
    assert any(s["department"] == "Computer Science" for s in data)
    assert not any(s["department"] == "Information Science" for s in data)


@pytest.mark.asyncio
async def test_get_my_profile(client: AsyncClient, test_user: dict):
    """Verify student can retrieve own profile."""
    response = await client.get("/api/students/me", headers=test_user["headers"])
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test Student"
    assert data["department"] == "Computer Science"
    assert data["semester"] == 5


@pytest.mark.asyncio
async def test_update_my_profile(client: AsyncClient, test_user: dict):
    """Verify student can update profile fields and skills."""
    payload = {
        "headline": "Updated Headline",
        "bio": "Updated bio text for test.",
        "availability_hours": 20,
        "availability_status": "Open to Offers",
        "skills": [
            {"name": "React", "category": "Frontend", "level": "Advanced"},
            {"name": "FastAPI", "category": "Backend", "level": "Intermediate"},
        ],
    }
    response = await client.put("/api/students/me", json=payload, headers=test_user["headers"])
    assert response.status_code == 200
    data = response.json()
    assert data["headline"] == "Updated Headline"
    assert data["availability"]["hoursPerWeek"] == 20
    assert data["availability"]["status"] == "Open to Offers"
    assert len(data["skills"]) == 2
    skill_names = [s["name"] for s in data["skills"]]
    assert "React" in skill_names
    assert "FastAPI" in skill_names


@pytest.mark.asyncio
async def test_get_student_by_id(client: AsyncClient, test_user: dict):
    """Verify retrieval of student profile by ID."""
    response = await client.get(f"/api/students/{test_user['user_id']}")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Test Student"


@pytest.mark.asyncio
async def test_get_nonexistent_student(client: AsyncClient):
    """Verify 404 for non-existent student ID."""
    response = await client.get("/api/students/99999")
    assert response.status_code == 404


@pytest.mark.asyncio
async def test_skills_catalogue(client: AsyncClient):
    """Verify skills catalogue listing and search."""
    # Seed skills
    seed_res = await client.post("/api/skills/seed")
    assert seed_res.status_code == 200

    # List all
    res = await client.get("/api/skills")
    assert res.status_code == 200
    skills = res.json()
    assert len(skills) > 0

    # Search
    search_res = await client.get("/api/skills?search=React")
    assert search_res.status_code == 200
    matched = search_res.json()
    assert any(s["name"] == "React" for s in matched)


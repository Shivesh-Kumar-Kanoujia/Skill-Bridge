"""Deterministic rule-based skill matching tests."""

import pytest
from app.services.matching import calculate_match_score


def test_matching_full_skill_and_interest_overlap():
    """Verify high compatibility when skills and interests match."""
    result = calculate_match_score(
        student_skills=["React", "TypeScript", "Tailwind CSS"],
        student_interests=["Web Development", "UI/UX Design"],
        student_availability_status="Actively Looking",
        student_semester=6,
        project_required_skills=["React", "TypeScript", "Tailwind CSS"],
        project_preferred_interests=["Web Development", "UI/UX Design"],
        project_category="Capstone",
    )
    assert result["score"] >= 85
    assert result["label"] == "Outstanding Fit"
    assert len(result["matchedSkills"]) == 3
    assert len(result["missingSkills"]) == 0
    assert "required skill" in result["explanation"]


def test_matching_partial_overlap():
    """Verify moderate score when skills only partially overlap."""
    result = calculate_match_score(
        student_skills=["React"],
        student_interests=["General"],
        student_availability_status="Limited Availability",
        student_semester=2,
        project_required_skills=["React", "Node.js", "Docker", "PostgreSQL"],
        project_preferred_interests=["DevOps"],
        project_category="Coursework",
    )
    assert 25 <= result["score"] <= 70
    assert "React" in result["matchedSkills"]
    assert "Node.js" in result["missingSkills"]


def test_matching_empty_skills():
    """Verify system handles empty skill lists gracefully without exceptions."""
    result = calculate_match_score(
        student_skills=[],
        student_interests=[],
        student_availability_status="Unavailable",
        student_semester=1,
        project_required_skills=[],
        project_preferred_interests=[],
        project_category="Hackathon",
    )
    assert 25 <= result["score"] <= 100
    assert isinstance(result["explanation"], str)
    assert len(result["matchedSkills"]) == 0


def test_matching_case_insensitivity():
    """Verify skills match regardless of case (e.g. 'python' vs 'Python')."""
    result = calculate_match_score(
        student_skills=["python", "pytorch"],
        student_interests=["ai/ml"],
        student_availability_status="Actively Looking",
        student_semester=5,
        project_required_skills=["Python", "PyTorch"],
        project_preferred_interests=["AI/ML"],
        project_category="Research",
    )
    assert len(result["matchedSkills"]) == 2
    assert len(result["missingSkills"]) == 0
    assert result["score"] >= 80


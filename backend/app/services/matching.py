"""Deterministic rule-based skill matching — Python port of src/lib/matching.ts.

Weighted scoring:
  50% Skill overlap
  25% Interest alignment
  15% Availability suitability
  10% Academic level / experience
"""

from __future__ import annotations

from typing import List, Optional


def calculate_match_score(
    student_skills: List[str],
    student_interests: List[str],
    student_availability_status: str,
    student_semester: int,
    project_required_skills: List[str],
    project_preferred_interests: List[str],
    project_category: str = "",
) -> dict:
    """Return a match result dict compatible with MatchScoreOut schema."""

    student_skills_lower = [s.lower() for s in student_skills]
    project_skills_lower = [s.lower() for s in project_required_skills]

    # 1. Skill overlap (50 points)
    matched_skills = [
        req for req in project_required_skills
        if req.lower() in student_skills_lower
    ]
    missing_skills = [
        req for req in project_required_skills
        if req.lower() not in student_skills_lower
    ]

    if project_skills_lower:
        skill_score = (len(matched_skills) / len(project_skills_lower)) * 50
    else:
        skill_score = 35  # neutral if project has no listed skills

    # 2. Interest alignment (25 points)
    student_interests_lower = [i.lower() for i in student_interests]
    project_interests_lower = [i.lower() for i in project_preferred_interests]

    matched_interests = [
        interest for interest in project_preferred_interests
        if interest.lower() in student_interests_lower
        or project_category.lower() in interest.lower()
    ]

    if project_interests_lower:
        interest_score = (len(matched_interests) / len(project_interests_lower)) * 25
    else:
        interest_score = 15

    # 3. Availability (15 points)
    status_map = {
        "Actively Looking": 15,
        "Open to Offers": 12,
        "Limited Availability": 7,
        "Unavailable": 3,
    }
    availability_score = status_map.get(student_availability_status, 8)

    # 4. Experience baseline (10 points)
    experience_score = min(10, max(5, (student_semester / 8) * 10))

    total_raw = round(skill_score + interest_score + availability_score + experience_score)
    final_score = min(98, max(25, total_raw))

    if final_score >= 85:
        label = "Outstanding Fit"
    elif final_score >= 70:
        label = "Strong Fit"
    elif final_score >= 50:
        label = "Moderate Fit"
    else:
        label = "Growth Opportunity"

    # Explanation
    if matched_skills and matched_interests:
        skill_names = ", ".join(matched_skills[:2])
        extra = f" +{len(matched_skills) - 2} more" if len(matched_skills) > 2 else ""
        explanation = (
            f"{len(matched_skills)} required skill{'s' if len(matched_skills) > 1 else ''} "
            f"match ({skill_names}{extra}) and shared interest in {matched_interests[0]}."
        )
    elif matched_skills:
        explanation = (
            f"{len(matched_skills)} of {len(project_required_skills)} "
            f"required skills matched directly."
        )
    else:
        explanation = "Complementary technical background with active availability."

    match_reasons = [
        f"{len(matched_skills)} required skill overlap",
        f"Estimated compatibility: {final_score}%",
        "Role preference fit",
    ]

    return {
        "score": final_score,
        "label": label,
        "matchedSkills": matched_skills,
        "missingSkills": missing_skills,
        "matchedInterests": matched_interests,
        "explanation": explanation,
        "matchReasons": match_reasons,
    }

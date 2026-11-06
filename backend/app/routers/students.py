"""Student profiles and skills management endpoints."""

from __future__ import annotations

import json
import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import get_current_user_full
from app.models import StudentProfile, Skill, StudentSkill, User, TeamMember, Application
from app.schemas import (
    AvailabilityOut,
    MessageResponse,
    ProfileUpdateRequest,
    SkillBase,
    SkillOut,
    StatsOut,
    StudentOut,
)
from app.services.storage import upload_file
from app.services.audit import log_action

router = APIRouter(prefix="/api/students", tags=["students"])
logger = logging.getLogger("skillbridge.students")


def _profile_to_student_out(profile: StudentProfile, user: User) -> StudentOut:
    """Convert DB models to frontend-compatible StudentOut schema."""
    skills = [
        SkillOut(name=ss.skill.name, level=ss.level, category=ss.skill.category)
        for ss in profile.student_skills
    ]

    interests = json.loads(profile.interests) if profile.interests else []
    preferred_roles = json.loads(profile.preferred_roles) if profile.preferred_roles else []

    return StudentOut(
        id=f"student-{user.id}",
        name=profile.name,
        avatar=profile.avatar_url or "",
        email=user.email,
        department=profile.department,
        semester=profile.semester,
        college=profile.college or "Apex Institute of Technology",
        headline=profile.headline or "",
        bio=profile.bio or "",
        skills=skills,
        interests=interests,
        availability=AvailabilityOut(
            hoursPerWeek=profile.availability_hours,
            status=profile.availability_status,
            note=profile.availability_note,
        ),
        preferredRoles=preferred_roles,
        githubUrl=profile.github_url,
        linkedinUrl=profile.linkedin_url,
        portfolioUrl=profile.portfolio_url,
        completedProjects=[],
        stats=StatsOut(),
    )


@router.get("", response_model=List[StudentOut])
async def list_students(
    department: Optional[str] = Query(None),
    semester: Optional[int] = Query(None),
    skill: Optional[str] = Query(None),
    availability: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """List all student profiles with optional filters."""
    query = (
        select(StudentProfile)
        .options(selectinload(StudentProfile.student_skills).selectinload(StudentSkill.skill))
        .join(User, User.id == StudentProfile.user_id)
        .where(User.is_active == True)
    )

    if department:
        query = query.where(StudentProfile.department.ilike(f"%{department}%"))
    if semester:
        query = query.where(StudentProfile.semester == semester)
    if availability:
        query = query.where(StudentProfile.availability_status == availability)
    if search:
        query = query.where(
            StudentProfile.name.ilike(f"%{search}%")
            | StudentProfile.headline.ilike(f"%{search}%")
            | StudentProfile.department.ilike(f"%{search}%")
        )

    result = await db.execute(query)
    profiles = result.scalars().unique().all()

    students = []
    for profile in profiles:
        user_result = await db.execute(select(User).where(User.id == profile.user_id))
        user = user_result.scalar_one()
        student = _profile_to_student_out(profile, user)

        # Filter by skill name if requested
        if skill:
            student_skill_names = [s.name.lower() for s in student.skills]
            if skill.lower() not in student_skill_names:
                continue

        students.append(student)

    return students


@router.get("/me", response_model=StudentOut)
async def get_my_profile(
    user_id: int = Depends(get_current_user_full),
    db: AsyncSession = Depends(get_db),
):
    """Get the current authenticated user's profile."""
    result = await db.execute(
        select(StudentProfile)
        .options(selectinload(StudentProfile.student_skills).selectinload(StudentSkill.skill))
        .where(StudentProfile.user_id == user_id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found.")

    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one()
    return _profile_to_student_out(profile, user)


@router.get("/{student_id}", response_model=StudentOut)
async def get_student(student_id: int, db: AsyncSession = Depends(get_db)):
    """Get a student profile by user ID."""
    result = await db.execute(
        select(StudentProfile)
        .options(selectinload(StudentProfile.student_skills).selectinload(StudentSkill.skill))
        .where(StudentProfile.user_id == student_id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Student not found.")

    user_result = await db.execute(select(User).where(User.id == student_id))
    user = user_result.scalar_one()
    return _profile_to_student_out(profile, user)


@router.put("/me", response_model=StudentOut)
async def update_my_profile(
    body: ProfileUpdateRequest,
    user_id: int = Depends(get_current_user_full),
    db: AsyncSession = Depends(get_db),
):
    """Update the current user's profile and skills."""
    result = await db.execute(
        select(StudentProfile)
        .options(selectinload(StudentProfile.student_skills).selectinload(StudentSkill.skill))
        .where(StudentProfile.user_id == user_id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found.")

    # Update scalar fields
    update_data = body.model_dump(exclude_unset=True, exclude={"skills"})
    if "interests" in update_data and update_data["interests"] is not None:
        update_data["interests"] = json.dumps(update_data["interests"])
    if "preferred_roles" in update_data and update_data["preferred_roles"] is not None:
        update_data["preferred_roles"] = json.dumps(update_data["preferred_roles"])

    for field, value in update_data.items():
        if value is not None:
            setattr(profile, field, value)

    # Update skills if provided
    if body.skills is not None:
        # Remove old skills
        for ss in list(profile.student_skills):
            await db.delete(ss)

        # Add new skills
        for skill_data in body.skills:
            # Get or create skill
            skill_result = await db.execute(
                select(Skill).where(func.lower(Skill.name) == skill_data.name.lower())
            )
            skill = skill_result.scalar_one_or_none()
            if not skill:
                skill = Skill(name=skill_data.name, category=skill_data.category)
                db.add(skill)
                await db.flush()

            ss = StudentSkill(
                profile_id=profile.id,
                skill_id=skill.id,
                level=skill_data.level,
            )
            db.add(ss)

    await log_action(db, user_id=user_id, action="UPDATE_PROFILE", entity_type="student_profile", entity_id=profile.id, details="Updated profile and skills")
    await db.commit()

    # Re-fetch with eager loading and fresh state
    result = await db.execute(
        select(StudentProfile)
        .execution_options(populate_existing=True)
        .options(selectinload(StudentProfile.student_skills).selectinload(StudentSkill.skill))
        .where(StudentProfile.user_id == user_id)
    )
    profile = result.scalar_one()

    user_result = await db.execute(select(User).where(User.id == user_id))
    user = user_result.scalar_one()

    logger.info("Profile updated: user_id=%d", user_id)
    return _profile_to_student_out(profile, user)


@router.post("/me/avatar", response_model=MessageResponse)
async def upload_avatar(
    file: UploadFile = File(...),
    user_id: int = Depends(get_current_user_full),
    db: AsyncSession = Depends(get_db),
):
    """Upload or update profile avatar."""
    url = await upload_file(file, user_id, subfolder="avatars")

    result = await db.execute(
        select(StudentProfile).where(StudentProfile.user_id == user_id)
    )
    profile = result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found.")

    profile.avatar_url = url
    await db.commit()

    logger.info("Avatar updated: user_id=%d url=%s", user_id, url)
    return MessageResponse(message="Avatar uploaded successfully.")

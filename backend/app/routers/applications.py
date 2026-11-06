"""Application endpoints — submit, list, accept/reject with transaction-safe team management."""

from __future__ import annotations

import json
import logging
import urllib.parse
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import get_current_user_full
from app.models import (
    Application,
    Project,
    ProjectSkill,
    StudentProfile,
    StudentSkill,
    TeamMember,
    User,
)
from app.schemas import (
    ApplicationActionRequest,
    ApplicationCreateRequest,
    ApplicationOut,
    MessageResponse,
)
from app.services.matching import calculate_match_score
from app.services.audit import log_action

router = APIRouter(prefix="/api/applications", tags=["applications"])
logger = logging.getLogger("skillbridge.applications")


async def _application_to_out(app: Application, db: AsyncSession) -> ApplicationOut:
    """Convert Application ORM model to frontend-compatible schema."""
    # Get project info
    proj_result = await db.execute(select(Project).where(Project.id == app.project_id))
    project = proj_result.scalar_one_or_none()

    # Get applicant profile
    profile_result = await db.execute(
        select(StudentProfile)
        .options(selectinload(StudentProfile.student_skills).selectinload(StudentSkill.skill))
        .where(StudentProfile.user_id == app.applicant_id)
    )
    profile = profile_result.scalar_one_or_none()

    match_reasons = json.loads(app.match_reasons) if app.match_reasons else []

    app_name = profile.name if profile else "Applicant"
    if profile and profile.avatar_url and profile.avatar_url.strip():
        app_avatar = profile.avatar_url
    else:
        app_avatar = f"https://ui-avatars.com/api/?name={urllib.parse.quote_plus(app_name)}&background=31594B&color=fff&bold=true"

    return ApplicationOut(
        id=f"app-{app.id}",
        projectId=f"proj-{app.project_id}",
        projectTitle=project.title if project else "Unknown",
        projectCategory=project.category if project else "",
        applicantId=f"student-{app.applicant_id}",
        applicantName=app_name,
        applicantAvatar=app_avatar,
        applicantDepartment=profile.department if profile else "",
        applicantSemester=profile.semester if profile else 1,
        applicantSkills=[ss.skill.name for ss in profile.student_skills] if profile else [],
        roleApplied=app.role_applied,
        statement=app.statement or "",
        appliedAt=app.applied_at.isoformat() + "Z" if app.applied_at else "",
        status=app.status,
        matchScore=app.match_score or 0,
        matchReasons=match_reasons,
    )


@router.post("", response_model=ApplicationOut, status_code=status.HTTP_201_CREATED)
async def create_application(
    body: ApplicationCreateRequest,
    user_id: int = Depends(get_current_user_full),
    db: AsyncSession = Depends(get_db),
):
    """Submit a project application. Prevents duplicates."""
    # Check project exists
    proj_result = await db.execute(
        select(Project)
        .options(selectinload(Project.project_skills).selectinload(ProjectSkill.skill))
        .where(Project.id == body.project_id)
    )
    project = proj_result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    if project.status != "Recruiting":
        raise HTTPException(status_code=400, detail="This project is not currently recruiting.")

    # Cannot apply to own project
    if project.owner_id == user_id:
        raise HTTPException(status_code=400, detail="You cannot apply to your own project.")

    # Check for existing active application (not Withdrawn)
    existing = await db.execute(
        select(Application).where(
            and_(
                Application.project_id == body.project_id,
                Application.applicant_id == user_id,
                Application.status.notin_(["Withdrawn"]),
            )
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=409,
            detail="You have already submitted an active application for this project.",
        )

    # Already a team member?
    member_check = await db.execute(
        select(TeamMember).where(
            and_(
                TeamMember.project_id == body.project_id,
                TeamMember.user_id == user_id,
            )
        )
    )
    if member_check.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="You are already a member of this project.")

    # Compute match score
    profile_result = await db.execute(
        select(StudentProfile)
        .options(selectinload(StudentProfile.student_skills).selectinload(StudentSkill.skill))
        .where(StudentProfile.user_id == user_id)
    )
    profile = profile_result.scalar_one_or_none()

    student_skills = [ss.skill.name for ss in profile.student_skills] if profile else []
    student_interests = json.loads(profile.interests) if profile and profile.interests else []
    project_skills = [ps.skill.name for ps in project.project_skills]
    project_interests = json.loads(project.preferred_interests) if project.preferred_interests else []

    match = calculate_match_score(
        student_skills=student_skills,
        student_interests=student_interests,
        student_availability_status=profile.availability_status if profile else "Actively Looking",
        student_semester=profile.semester if profile else 1,
        project_required_skills=project_skills,
        project_preferred_interests=project_interests,
        project_category=project.category,
    )

    application = Application(
        project_id=body.project_id,
        applicant_id=user_id,
        role_applied=body.role_applied,
        statement=body.statement,
        match_score=match["score"],
        match_reasons=json.dumps(match["matchReasons"]),
    )
    db.add(application)
    await db.flush()

    await log_action(db, user_id=user_id, action="CREATE_APPLICATION", entity_type="application", entity_id=application.id, details=f"Applied for role '{body.role_applied}' on project {body.project_id}")
    await db.commit()
    await db.refresh(application)

    logger.info(
        "Application created: id=%d project=%d applicant=%d",
        application.id, body.project_id, user_id,
    )
    return await _application_to_out(application, db)


@router.get("/my", response_model=List[ApplicationOut])
async def get_my_applications(
    user_id: int = Depends(get_current_user_full),
    db: AsyncSession = Depends(get_db),
):
    """Get applications submitted by the current user."""
    result = await db.execute(
        select(Application)
        .where(Application.applicant_id == user_id)
        .order_by(Application.applied_at.desc())
    )
    apps = result.scalars().all()
    return [await _application_to_out(a, db) for a in apps]


@router.get("/received", response_model=List[ApplicationOut])
async def get_received_applications(
    user_id: int = Depends(get_current_user_full),
    db: AsyncSession = Depends(get_db),
):
    """Get applications received for projects owned by the current user."""
    # Get user's projects
    proj_result = await db.execute(
        select(Project.id).where(Project.owner_id == user_id)
    )
    project_ids = [row[0] for row in proj_result.all()]

    if not project_ids:
        return []

    result = await db.execute(
        select(Application)
        .where(Application.project_id.in_(project_ids))
        .order_by(Application.applied_at.desc())
    )
    apps = result.scalars().all()
    return [await _application_to_out(a, db) for a in apps]


@router.post("/{application_id}/action", response_model=ApplicationOut)
async def action_application(
    application_id: int,
    body: ApplicationActionRequest,
    user_id: int = Depends(get_current_user_full),
    db: AsyncSession = Depends(get_db),
):
    """Accept or reject an application. Transaction-safe team capacity enforcement.

    Only the project owner can perform this action. When accepting:
    - Check team capacity hasn't been exceeded
    - Create team membership
    - Update application status
    All within a single transaction.
    """
    # Fetch application
    app_result = await db.execute(
        select(Application).where(Application.id == application_id)
    )
    application = app_result.scalar_one_or_none()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found.")

    # Verify ownership
    proj_result = await db.execute(
        select(Project)
        .options(selectinload(Project.team_members))
        .where(Project.id == application.project_id)
    )
    project = proj_result.scalar_one_or_none()
    if not project or project.owner_id != user_id:
        raise HTTPException(
            status_code=403,
            detail="Only the project owner can accept or reject applications.",
        )

    # Validate state transition
    if application.status != "Pending":
        raise HTTPException(
            status_code=400,
            detail=f"Cannot {body.action} an application with status '{application.status}'.",
        )

    if body.action == "accept":
        # ── TRANSACTION: capacity check + accept + add member ──
        current_count = len(project.team_members)
        if current_count >= project.max_team_size:
            raise HTTPException(
                status_code=409,
                detail=f"Team is full ({current_count}/{project.max_team_size}). "
                       f"Cannot accept more members.",
            )

        # Check not already a member
        already_member = any(tm.user_id == application.applicant_id for tm in project.team_members)
        if already_member:
            raise HTTPException(status_code=409, detail="Applicant is already a team member.")

        application.status = "Accepted"

        tm = TeamMember(
            project_id=project.id,
            user_id=application.applicant_id,
            role=application.role_applied,
            is_owner=False,
        )
        db.add(tm)

        logger.info(
            "Application accepted: app=%d user=%d project=%d",
            application_id, application.applicant_id, project.id,
        )
        await log_action(db, user_id=user_id, action="ACCEPT_APPLICATION", entity_type="application", entity_id=application_id, details=f"Accepted applicant {application.applicant_id} for project {project.id}")

    elif body.action == "reject":
        application.status = "Rejected"
        logger.info("Application rejected: app=%d", application_id)
        await log_action(db, user_id=user_id, action="REJECT_APPLICATION", entity_type="application", entity_id=application_id, details=f"Rejected applicant {application.applicant_id} for project {project.id}")

    await db.commit()
    await db.refresh(application)
    return await _application_to_out(application, db)


@router.post("/{application_id}/withdraw", response_model=MessageResponse)
async def withdraw_application(
    application_id: int,
    user_id: int = Depends(get_current_user_full),
    db: AsyncSession = Depends(get_db),
):
    """Withdraw an application. Only the applicant can withdraw."""
    app_result = await db.execute(
        select(Application).where(Application.id == application_id)
    )
    application = app_result.scalar_one_or_none()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found.")

    if application.applicant_id != user_id:
        raise HTTPException(status_code=403, detail="You can only withdraw your own applications.")

    if application.status != "Pending":
        raise HTTPException(
            status_code=400,
            detail=f"Cannot withdraw an application with status '{application.status}'.",
        )

    application.status = "Withdrawn"
    await log_action(db, user_id=user_id, action="WITHDRAW_APPLICATION", entity_type="application", entity_id=application_id, details=f"Withdrew application {application_id}")
    await db.commit()

    logger.info("Application withdrawn: app=%d by user=%d", application_id, user_id)
    return MessageResponse(message="Application withdrawn successfully.")

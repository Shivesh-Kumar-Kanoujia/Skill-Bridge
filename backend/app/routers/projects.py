"""Project CRUD, search/filter/pagination, and skill management endpoints."""

from __future__ import annotations

import json
import logging
import urllib.parse
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import get_current_user_full
from app.models import (
    Application,
    Project,
    ProjectSkill,
    Skill,
    StudentProfile,
    StudentSkill,
    TeamMember,
    User,
)
from app.schemas import (
    MessageResponse,
    ProjectCreateRequest,
    ProjectOut,
    ProjectRoleSchema,
    ProjectUpdateRequest,
    TeamMemberOut,
)
from app.services.matching import calculate_match_score
from app.services.audit import log_action
from app.schemas import MatchScoreOut

router = APIRouter(prefix="/api/projects", tags=["projects"])
logger = logging.getLogger("skillbridge.projects")


async def _project_to_out(project: Project, db: AsyncSession) -> ProjectOut:
    """Convert a Project ORM model to the frontend-compatible ProjectOut schema."""
    # Get owner profile
    owner_result = await db.execute(
        select(StudentProfile).where(StudentProfile.user_id == project.owner_id)
    )
    owner_profile = owner_result.scalar_one_or_none()

    owner_name = owner_profile.name if owner_profile else "Project Lead"
    if owner_profile and owner_profile.avatar_url and owner_profile.avatar_url.strip():
        owner_avatar = owner_profile.avatar_url
    else:
        owner_avatar = f"https://ui-avatars.com/api/?name={urllib.parse.quote_plus(owner_name)}&background=31594B&color=fff&bold=true"
    owner_dept = owner_profile.department if owner_profile else ""

    # Get required skills
    required_skills = [ps.skill.name for ps in project.project_skills]

    # Get team members
    members = []
    for tm in project.team_members:
        member_profile_result = await db.execute(
            select(StudentProfile).where(StudentProfile.user_id == tm.user_id)
        )
        mp = member_profile_result.scalar_one_or_none()
        m_name = mp.name if mp else "Team Member"
        if mp and mp.avatar_url and mp.avatar_url.strip():
            m_avatar = mp.avatar_url
        else:
            m_avatar = f"https://ui-avatars.com/api/?name={urllib.parse.quote_plus(m_name)}&background=31594B&color=fff&bold=true"

        members.append(
            TeamMemberOut(
                studentId=f"student-{tm.user_id}",
                name=m_name,
                role=tm.role,
                avatar=m_avatar,
                department=mp.department if mp else "",
                isOwner=tm.is_owner,
            )
        )

    # Parse JSON fields
    preferred_interests = json.loads(project.preferred_interests) if project.preferred_interests else []
    open_roles = json.loads(project.open_roles) if project.open_roles else []
    open_role_schemas = [ProjectRoleSchema(**r) if isinstance(r, dict) else r for r in open_roles]

    return ProjectOut(
        id=f"proj-{project.id}",
        title=project.title,
        tagline=project.tagline or "",
        description=project.description or "",
        category=project.category,
        ownerId=f"student-{project.owner_id}",
        ownerName=owner_name,
        ownerAvatar=owner_avatar,
        ownerDepartment=owner_dept,
        teamSize={"current": len(project.team_members), "max": project.max_team_size},
        duration=project.duration or "",
        deadline=project.deadline or "",
        requiredSkills=required_skills,
        preferredInterests=preferred_interests,
        openRoles=open_role_schemas,
        currentMembers=members,
        status=project.status,
        createdAt=project.created_at.isoformat() + "Z" if project.created_at else "",
        featured=project.featured,
    )


@router.get("", response_model=List[ProjectOut])
async def list_projects(
    category: Optional[str] = Query(None),
    status_filter: Optional[str] = Query(None, alias="status"),
    skill: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    sort: Optional[str] = Query("newest"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: AsyncSession = Depends(get_db),
):
    """List projects with search, filter, sort, and pagination."""
    query = (
        select(Project)
        .options(
            selectinload(Project.project_skills).selectinload(ProjectSkill.skill),
            selectinload(Project.team_members),
        )
    )

    if category:
        query = query.where(Project.category == category)
    if status_filter:
        query = query.where(Project.status == status_filter)
    if search:
        query = query.where(
            Project.title.ilike(f"%{search}%")
            | Project.tagline.ilike(f"%{search}%")
            | Project.description.ilike(f"%{search}%")
        )

    # Sort
    if sort == "oldest":
        query = query.order_by(Project.created_at.asc())
    elif sort == "deadline":
        query = query.order_by(Project.deadline.asc())
    else:  # "newest" default
        query = query.order_by(Project.created_at.desc())

    query = query.offset(offset).limit(limit)

    result = await db.execute(query)
    projects = result.scalars().unique().all()

    # Filter by skill if specified
    out = []
    for project in projects:
        proj_out = await _project_to_out(project, db)
        if skill:
            if skill.lower() not in [s.lower() for s in proj_out.requiredSkills]:
                continue
        out.append(proj_out)

    return out


@router.get("/{project_id}", response_model=ProjectOut)
async def get_project(project_id: int, db: AsyncSession = Depends(get_db)):
    """Get a single project by ID."""
    result = await db.execute(
        select(Project)
        .options(
            selectinload(Project.project_skills).selectinload(ProjectSkill.skill),
            selectinload(Project.team_members),
        )
        .where(Project.id == project_id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    return await _project_to_out(project, db)


@router.post("", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
async def create_project(
    body: ProjectCreateRequest,
    user_id: int = Depends(get_current_user_full),
    db: AsyncSession = Depends(get_db),
):
    """Create a new project. The creator becomes the owner and first team member."""
    project = Project(
        owner_id=user_id,
        title=body.title,
        tagline=body.tagline,
        description=body.description,
        category=body.category,
        max_team_size=body.max_team_size,
        duration=body.duration,
        deadline=body.deadline,
        preferred_interests=json.dumps(body.preferred_interests) if body.preferred_interests else None,
        open_roles=json.dumps([r.model_dump() for r in body.open_roles]) if body.open_roles else None,
        status=body.status,
    )
    db.add(project)
    await db.flush()

    # Add required skills
    for skill_name in body.required_skills:
        skill_result = await db.execute(
            select(Skill).where(func.lower(Skill.name) == skill_name.lower())
        )
        skill = skill_result.scalar_one_or_none()
        if not skill:
            skill = Skill(name=skill_name, category="Core")
            db.add(skill)
            await db.flush()

        ps = ProjectSkill(project_id=project.id, skill_id=skill.id)
        db.add(ps)

    # Add owner as first team member
    owner_profile_result = await db.execute(
        select(StudentProfile).where(StudentProfile.user_id == user_id)
    )
    owner_profile = owner_profile_result.scalar_one_or_none()

    tm = TeamMember(
        project_id=project.id,
        user_id=user_id,
        role="Project Owner",
        is_owner=True,
    )
    db.add(tm)

    await log_action(db, user_id=user_id, action="CREATE_PROJECT", entity_type="project", entity_id=project.id, details=f"Created project: {project.title}")
    await db.commit()

    # Re-fetch with eager loading
    result = await db.execute(
        select(Project)
        .options(
            selectinload(Project.project_skills).selectinload(ProjectSkill.skill),
            selectinload(Project.team_members),
        )
        .where(Project.id == project.id)
    )
    project = result.scalar_one()

    logger.info("Project created: id=%d title=%s owner=%d", project.id, project.title, user_id)
    return await _project_to_out(project, db)


@router.put("/{project_id}", response_model=ProjectOut)
async def update_project(
    project_id: int,
    body: ProjectUpdateRequest,
    user_id: int = Depends(get_current_user_full),
    db: AsyncSession = Depends(get_db),
):
    """Update a project. Only the project owner can update."""
    result = await db.execute(
        select(Project)
        .options(
            selectinload(Project.project_skills).selectinload(ProjectSkill.skill),
            selectinload(Project.team_members),
        )
        .where(Project.id == project_id)
    )
    project = result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    if project.owner_id != user_id:
        raise HTTPException(status_code=403, detail="Only the project owner can update this project.")

    update_data = body.model_dump(exclude_unset=True, exclude={"required_skills"})

    if "preferred_interests" in update_data and update_data["preferred_interests"] is not None:
        update_data["preferred_interests"] = json.dumps(update_data["preferred_interests"])
    if "open_roles" in update_data and update_data["open_roles"] is not None:
        update_data["open_roles"] = json.dumps([r.model_dump() for r in update_data["open_roles"]])

    for field, value in update_data.items():
        if value is not None:
            setattr(project, field, value)

    # Update skills if provided
    if body.required_skills is not None:
        for ps in list(project.project_skills):
            await db.delete(ps)

        for skill_name in body.required_skills:
            skill_result = await db.execute(
                select(Skill).where(func.lower(Skill.name) == skill_name.lower())
            )
            skill = skill_result.scalar_one_or_none()
            if not skill:
                skill = Skill(name=skill_name, category="Core")
                db.add(skill)
                await db.flush()
            ps = ProjectSkill(project_id=project.id, skill_id=skill.id)
            db.add(ps)

    await log_action(db, user_id=user_id, action="UPDATE_PROJECT", entity_type="project", entity_id=project.id, details=f"Updated project: {project.title}")
    await db.commit()

    # Re-fetch
    result = await db.execute(
        select(Project)
        .options(
            selectinload(Project.project_skills).selectinload(ProjectSkill.skill),
            selectinload(Project.team_members),
        )
        .where(Project.id == project_id)
    )
    project = result.scalar_one()

    logger.info("Project updated: id=%d by user=%d", project_id, user_id)
    return await _project_to_out(project, db)


@router.get("/{project_id}/match", response_model=MatchScoreOut)
async def get_project_match(
    project_id: int,
    user_id: int = Depends(get_current_user_full),
    db: AsyncSession = Depends(get_db),
):
    """Get the current user's match score for a specific project."""
    # Fetch project
    proj_result = await db.execute(
        select(Project)
        .options(selectinload(Project.project_skills).selectinload(ProjectSkill.skill))
        .where(Project.id == project_id)
    )
    project = proj_result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    # Fetch student profile with skills
    profile_result = await db.execute(
        select(StudentProfile)
        .options(selectinload(StudentProfile.student_skills).selectinload(StudentSkill.skill))
        .where(StudentProfile.user_id == user_id)
    )
    profile = profile_result.scalar_one_or_none()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found.")

    student_skills = [ss.skill.name for ss in profile.student_skills]
    student_interests = json.loads(profile.interests) if profile.interests else []
    project_skills = [ps.skill.name for ps in project.project_skills]
    project_interests = json.loads(project.preferred_interests) if project.preferred_interests else []

    match = calculate_match_score(
        student_skills=student_skills,
        student_interests=student_interests,
        student_availability_status=profile.availability_status,
        student_semester=profile.semester,
        project_required_skills=project_skills,
        project_preferred_interests=project_interests,
        project_category=project.category,
    )

    return MatchScoreOut(**match)

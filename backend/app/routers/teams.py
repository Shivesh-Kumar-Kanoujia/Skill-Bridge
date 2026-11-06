"""Team management endpoints — list members, my teams."""

from __future__ import annotations

import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import get_current_user_full
from app.models import (
    Project,
    ProjectSkill,
    StudentProfile,
    TeamMember,
)
from app.schemas import TeamMemberOut

router = APIRouter(prefix="/api/teams", tags=["teams"])
logger = logging.getLogger("skillbridge.teams")


@router.get("/my", response_model=list)
async def get_my_teams(
    user_id: int = Depends(get_current_user_full),
    db: AsyncSession = Depends(get_db),
):
    """Get all projects where the current user is a team member."""
    result = await db.execute(
        select(TeamMember).where(TeamMember.user_id == user_id)
    )
    memberships = result.scalars().all()

    teams = []
    for tm in memberships:
        proj_result = await db.execute(
            select(Project)
            .options(selectinload(Project.team_members))
            .where(Project.id == tm.project_id)
        )
        project = proj_result.scalar_one_or_none()
        if not project:
            continue

        # Get all member info
        members = []
        for member in project.team_members:
            profile_result = await db.execute(
                select(StudentProfile).where(StudentProfile.user_id == member.user_id)
            )
            profile = profile_result.scalar_one_or_none()
            members.append(
                TeamMemberOut(
                    studentId=f"student-{member.user_id}",
                    name=profile.name if profile else "Unknown",
                    role=member.role,
                    avatar=profile.avatar_url or "" if profile else "",
                    department=profile.department if profile else "",
                    isOwner=member.is_owner,
                )
            )

        teams.append({
            "projectId": f"proj-{project.id}",
            "projectTitle": project.title,
            "category": project.category,
            "status": project.status,
            "myRole": tm.role,
            "isOwner": tm.is_owner,
            "teamSize": {"current": len(project.team_members), "max": project.max_team_size},
            "members": [m.model_dump() for m in members],
        })

    return teams


@router.get("/{project_id}/members", response_model=List[TeamMemberOut])
async def get_team_members(
    project_id: int,
    db: AsyncSession = Depends(get_db),
):
    """Get team members for a specific project."""
    result = await db.execute(
        select(TeamMember).where(TeamMember.project_id == project_id)
    )
    members = result.scalars().all()

    out = []
    for member in members:
        profile_result = await db.execute(
            select(StudentProfile).where(StudentProfile.user_id == member.user_id)
        )
        profile = profile_result.scalar_one_or_none()
        out.append(
            TeamMemberOut(
                studentId=f"student-{member.user_id}",
                name=profile.name if profile else "Unknown",
                role=member.role,
                avatar=profile.avatar_url or "" if profile else "",
                department=profile.department if profile else "",
                isOwner=member.is_owner,
            )
        )

    return out

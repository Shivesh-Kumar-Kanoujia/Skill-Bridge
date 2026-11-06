"""Invitation endpoints — send, list, accept/decline with team management."""

from __future__ import annotations

import json
import logging
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.database import get_db
from app.core.security import get_current_user_full
from app.models import (
    Invitation,
    Project,
    StudentProfile,
    TeamMember,
    User,
)
from app.schemas import (
    InvitationActionRequest,
    InvitationCreateRequest,
    InvitationOut,
    MessageResponse,
)

router = APIRouter(prefix="/api/invitations", tags=["invitations"])
logger = logging.getLogger("skillbridge.invitations")


async def _invitation_to_out(inv: Invitation, db: AsyncSession) -> InvitationOut:
    """Convert Invitation ORM to frontend-compatible schema."""
    proj_result = await db.execute(select(Project).where(Project.id == inv.project_id))
    project = proj_result.scalar_one_or_none()

    sender_result = await db.execute(
        select(StudentProfile).where(StudentProfile.user_id == inv.sender_id)
    )
    sender = sender_result.scalar_one_or_none()

    receiver_result = await db.execute(
        select(StudentProfile).where(StudentProfile.user_id == inv.receiver_id)
    )
    receiver = receiver_result.scalar_one_or_none()

    return InvitationOut(
        id=f"inv-{inv.id}",
        projectId=f"proj-{inv.project_id}",
        projectTitle=project.title if project else "Unknown",
        senderId=f"student-{inv.sender_id}",
        senderName=sender.name if sender else "Unknown",
        receiverId=f"student-{inv.receiver_id}",
        receiverName=receiver.name if receiver else "Unknown",
        role=inv.role,
        message=inv.message or "",
        sentAt=inv.sent_at.isoformat() + "Z" if inv.sent_at else "",
        status=inv.status,
    )


@router.post("", response_model=InvitationOut, status_code=status.HTTP_201_CREATED)
async def send_invitation(
    body: InvitationCreateRequest,
    user_id: int = Depends(get_current_user_full),
    db: AsyncSession = Depends(get_db),
):
    """Send an invitation to a student for a project. Only project owners can invite."""
    # Verify project ownership
    proj_result = await db.execute(
        select(Project)
        .options(selectinload(Project.team_members))
        .where(Project.id == body.project_id)
    )
    project = proj_result.scalar_one_or_none()
    if not project:
        raise HTTPException(status_code=404, detail="Project not found.")

    if project.owner_id != user_id:
        raise HTTPException(status_code=403, detail="Only the project owner can send invitations.")

    # Verify receiver exists
    receiver_result = await db.execute(
        select(StudentProfile).where(StudentProfile.user_id == body.student_id)
    )
    if not receiver_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Student not found.")

    # Cannot invite yourself
    if body.student_id == user_id:
        raise HTTPException(status_code=400, detail="You cannot invite yourself.")

    # Check for existing pending invitation
    existing = await db.execute(
        select(Invitation).where(
            and_(
                Invitation.project_id == body.project_id,
                Invitation.receiver_id == body.student_id,
                Invitation.status == "Pending",
            )
        )
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="A pending invitation already exists for this student.")

    # Check if already a member
    already_member = any(tm.user_id == body.student_id for tm in project.team_members)
    if already_member:
        raise HTTPException(status_code=409, detail="This student is already a team member.")

    inv = Invitation(
        project_id=body.project_id,
        sender_id=user_id,
        receiver_id=body.student_id,
        role=body.role,
        message=body.message,
    )
    db.add(inv)
    await db.commit()
    await db.refresh(inv)

    logger.info(
        "Invitation sent: id=%d project=%d to=%d",
        inv.id, body.project_id, body.student_id,
    )
    return await _invitation_to_out(inv, db)


@router.get("/my", response_model=List[InvitationOut])
async def get_my_invitations(
    user_id: int = Depends(get_current_user_full),
    db: AsyncSession = Depends(get_db),
):
    """Get invitations received by the current user."""
    result = await db.execute(
        select(Invitation)
        .where(Invitation.receiver_id == user_id)
        .order_by(Invitation.sent_at.desc())
    )
    invitations = result.scalars().all()
    return [await _invitation_to_out(inv, db) for inv in invitations]


@router.get("/sent", response_model=List[InvitationOut])
async def get_sent_invitations(
    user_id: int = Depends(get_current_user_full),
    db: AsyncSession = Depends(get_db),
):
    """Get invitations sent by the current user."""
    result = await db.execute(
        select(Invitation)
        .where(Invitation.sender_id == user_id)
        .order_by(Invitation.sent_at.desc())
    )
    invitations = result.scalars().all()
    return [await _invitation_to_out(inv, db) for inv in invitations]


@router.post("/{invitation_id}/action", response_model=InvitationOut)
async def action_invitation(
    invitation_id: int,
    body: InvitationActionRequest,
    user_id: int = Depends(get_current_user_full),
    db: AsyncSession = Depends(get_db),
):
    """Accept or decline an invitation. Transaction-safe team membership."""
    inv_result = await db.execute(
        select(Invitation).where(Invitation.id == invitation_id)
    )
    invitation = inv_result.scalar_one_or_none()
    if not invitation:
        raise HTTPException(status_code=404, detail="Invitation not found.")

    if invitation.receiver_id != user_id:
        raise HTTPException(status_code=403, detail="Only the invited student can respond.")

    if invitation.status != "Pending":
        raise HTTPException(
            status_code=400,
            detail=f"Cannot {body.action} an invitation with status '{invitation.status}'.",
        )

    if body.action == "accept":
        # Check team capacity
        proj_result = await db.execute(
            select(Project)
            .options(selectinload(Project.team_members))
            .where(Project.id == invitation.project_id)
        )
        project = proj_result.scalar_one_or_none()
        if not project:
            raise HTTPException(status_code=404, detail="Project not found.")

        current_count = len(project.team_members)
        if current_count >= project.max_team_size:
            raise HTTPException(
                status_code=409,
                detail=f"Team is full ({current_count}/{project.max_team_size}).",
            )

        # Check not already a member
        already_member = any(tm.user_id == user_id for tm in project.team_members)
        if already_member:
            raise HTTPException(status_code=409, detail="You are already a team member.")

        invitation.status = "Accepted"
        tm = TeamMember(
            project_id=invitation.project_id,
            user_id=user_id,
            role=invitation.role,
            is_owner=False,
        )
        db.add(tm)

        logger.info(
            "Invitation accepted: inv=%d user=%d project=%d",
            invitation_id, user_id, invitation.project_id,
        )

    elif body.action == "decline":
        invitation.status = "Declined"
        logger.info("Invitation declined: inv=%d", invitation_id)

    await db.commit()
    await db.refresh(invitation)
    return await _invitation_to_out(invitation, db)

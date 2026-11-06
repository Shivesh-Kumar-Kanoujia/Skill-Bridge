"""Skills catalogue endpoints — list, search, and manage skills."""

from __future__ import annotations

import logging
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user_full
from app.models import Skill
from app.schemas import SkillOut, MessageResponse

router = APIRouter(prefix="/api/skills", tags=["skills"])
logger = logging.getLogger("skillbridge.skills")

# Default skill catalogue for seeding
DEFAULT_SKILLS = [
    ("React", "Frontend"), ("TypeScript", "Frontend"), ("Next.js", "Frontend"),
    ("Tailwind CSS", "Frontend"), ("HTML/CSS", "Frontend"),
    ("Node.js", "Backend"), ("FastAPI", "Backend"), ("Go (Golang)", "Backend"),
    ("REST APIs", "Backend"), ("Firebase", "Backend"), ("Redis", "Backend"),
    ("MQTT / LoRaWAN", "Backend"), ("WebSockets", "Backend"),
    ("Python", "Core"), ("C/C++", "Core"), ("Git", "Core"), ("Embedded C", "Core"),
    ("PostgreSQL", "Data"), ("Pandas", "Data"),
    ("PyTorch", "AI/ML"), ("scikit-learn", "AI/ML"),
    ("Flutter", "Mobile"), ("Dart", "Mobile"), ("Swift", "Mobile"),
    ("Figma", "Design"), ("UI/UX Design", "Design"), ("Design Systems", "Design"),
    ("User Research", "Design"), ("Prototyping", "Design"), ("PCB Design (KiCad)", "Design"),
    ("Docker", "DevOps"), ("Kubernetes", "DevOps"), ("Linux Systems", "DevOps"),
    ("ESP32 / Arduino", "DevOps"),
]


@router.get("", response_model=List[SkillOut])
async def list_skills(
    category: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """List all skills in the catalogue with optional filters."""
    query = select(Skill)

    if category:
        query = query.where(Skill.category == category)
    if search:
        query = query.where(Skill.name.ilike(f"%{search}%"))

    query = query.order_by(Skill.category, Skill.name)
    result = await db.execute(query)
    skills = result.scalars().all()

    return [
        SkillOut(name=s.name, level="Intermediate", category=s.category)
        for s in skills
    ]


@router.post("/seed", response_model=MessageResponse)
async def seed_skills(
    db: AsyncSession = Depends(get_db),
):
    """Seed the skill catalogue with default skills. Idempotent."""
    added = 0
    for name, category in DEFAULT_SKILLS:
        existing = await db.execute(
            select(Skill).where(func.lower(Skill.name) == name.lower())
        )
        if not existing.scalar_one_or_none():
            db.add(Skill(name=name, category=category))
            added += 1

    await db.commit()
    logger.info("Skills seeded: %d new skills added", added)
    return MessageResponse(message=f"Seed complete. {added} new skills added.")


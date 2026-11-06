"""SQLAlchemy ORM models for the SkillBridge relational schema.

Eight tables in 3NF:
  users, student_profiles, skills, student_skills,
  projects, project_skills, applications, team_members

Plus one association table: invitations (bonus 9th table matching frontend).
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import List, Optional

from sqlalchemy import (
    Boolean,
    CheckConstraint,
    Column,
    DateTime,
    Float,
    ForeignKey,
    Index,
    Integer,
    String,
    Text,
    UniqueConstraint,
    event,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


# ──────────────────────────────────────────
# 1. USERS  — authentication credentials
# ──────────────────────────────────────────
class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(20), nullable=False, default="student")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    profile: Mapped[Optional["StudentProfile"]] = relationship(
        back_populates="user", uselist=False, cascade="all, delete-orphan"
    )


# ──────────────────────────────────────────
# 2. STUDENT_PROFILES  — public profile data
# ──────────────────────────────────────────
class StudentProfile(Base):
    __tablename__ = "student_profiles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False
    )
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    avatar_url: Mapped[Optional[str]] = mapped_column(String(500))
    department: Mapped[str] = mapped_column(String(100), nullable=False)
    semester: Mapped[int] = mapped_column(Integer, nullable=False)
    college: Mapped[str] = mapped_column(String(200), default="Apex Institute of Technology")
    headline: Mapped[Optional[str]] = mapped_column(String(200))
    bio: Mapped[Optional[str]] = mapped_column(Text)
    interests: Mapped[Optional[str]] = mapped_column(Text)  # JSON-encoded list
    preferred_roles: Mapped[Optional[str]] = mapped_column(Text)  # JSON-encoded list
    availability_hours: Mapped[int] = mapped_column(Integer, default=10)
    availability_status: Mapped[str] = mapped_column(
        String(30), default="Actively Looking"
    )
    availability_note: Mapped[Optional[str]] = mapped_column(String(300))
    github_url: Mapped[Optional[str]] = mapped_column(String(300))
    linkedin_url: Mapped[Optional[str]] = mapped_column(String(300))
    portfolio_url: Mapped[Optional[str]] = mapped_column(String(300))
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    user: Mapped["User"] = relationship(back_populates="profile")
    student_skills: Mapped[List["StudentSkill"]] = relationship(
        back_populates="profile", cascade="all, delete-orphan"
    )

    __table_args__ = (
        CheckConstraint("semester >= 1 AND semester <= 10", name="ck_semester_range"),
        CheckConstraint(
            "availability_status IN ('Actively Looking','Open to Offers','Limited Availability','Unavailable')",
            name="ck_availability_status",
        ),
        Index("ix_profiles_department", "department"),
    )


# ──────────────────────────────────────────
# 3. SKILLS  — canonical skill catalogue
# ──────────────────────────────────────────
class Skill(Base):
    __tablename__ = "skills"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    name: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    category: Mapped[str] = mapped_column(String(30), nullable=False, default="Core")

    __table_args__ = (
        CheckConstraint(
            "category IN ('Frontend','Backend','AI/ML','Mobile','Design','Data','DevOps','Core')",
            name="ck_skill_category",
        ),
    )


# ──────────────────────────────────────────
# 4. STUDENT_SKILLS  — M:N association
# ──────────────────────────────────────────
class StudentSkill(Base):
    __tablename__ = "student_skills"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    profile_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("student_profiles.id", ondelete="CASCADE"), nullable=False
    )
    skill_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("skills.id", ondelete="CASCADE"), nullable=False
    )
    level: Mapped[str] = mapped_column(String(20), nullable=False, default="Intermediate")

    # Relationships
    profile: Mapped["StudentProfile"] = relationship(back_populates="student_skills")
    skill: Mapped["Skill"] = relationship()

    __table_args__ = (
        UniqueConstraint("profile_id", "skill_id", name="uq_profile_skill"),
        CheckConstraint(
            "level IN ('Beginner','Intermediate','Advanced')",
            name="ck_skill_level",
        ),
    )


# ──────────────────────────────────────────
# 5. PROJECTS
# ──────────────────────────────────────────
class Project(Base):
    __tablename__ = "projects"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    owner_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    tagline: Mapped[Optional[str]] = mapped_column(String(300))
    description: Mapped[Optional[str]] = mapped_column(Text)
    category: Mapped[str] = mapped_column(String(30), nullable=False, default="Coursework")
    max_team_size: Mapped[int] = mapped_column(Integer, nullable=False, default=4)
    duration: Mapped[Optional[str]] = mapped_column(String(100))
    deadline: Mapped[Optional[str]] = mapped_column(String(50))
    preferred_interests: Mapped[Optional[str]] = mapped_column(Text)  # JSON list
    open_roles: Mapped[Optional[str]] = mapped_column(Text)  # JSON list
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="Recruiting")
    featured: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    owner: Mapped["User"] = relationship()
    project_skills: Mapped[List["ProjectSkill"]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )
    applications: Mapped[List["Application"]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )
    team_members: Mapped[List["TeamMember"]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )
    invitations: Mapped[List["Invitation"]] = relationship(
        back_populates="project", cascade="all, delete-orphan"
    )

    __table_args__ = (
        CheckConstraint(
            "category IN ('Hackathon','Capstone','Coursework','Open Source','Research','Startup')",
            name="ck_project_category",
        ),
        CheckConstraint(
            "status IN ('Recruiting','In Progress','Completed')",
            name="ck_project_status",
        ),
        CheckConstraint("max_team_size >= 1 AND max_team_size <= 20", name="ck_team_size"),
        Index("ix_projects_status", "status"),
        Index("ix_projects_category", "category"),
        Index("ix_projects_owner", "owner_id"),
    )


# ──────────────────────────────────────────
# 6. PROJECT_SKILLS  — M:N association
# ──────────────────────────────────────────
class ProjectSkill(Base):
    __tablename__ = "project_skills"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    project_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    skill_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("skills.id", ondelete="CASCADE"), nullable=False
    )

    project: Mapped["Project"] = relationship(back_populates="project_skills")
    skill: Mapped["Skill"] = relationship()

    __table_args__ = (
        UniqueConstraint("project_id", "skill_id", name="uq_project_skill"),
    )


# ──────────────────────────────────────────
# 7. APPLICATIONS
# ──────────────────────────────────────────
class Application(Base):
    __tablename__ = "applications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    project_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    applicant_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    role_applied: Mapped[str] = mapped_column(String(100), nullable=False)
    statement: Mapped[Optional[str]] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="Pending")
    match_score: Mapped[Optional[float]] = mapped_column(Float)
    match_reasons: Mapped[Optional[str]] = mapped_column(Text)  # JSON list
    applied_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    project: Mapped["Project"] = relationship(back_populates="applications")
    applicant: Mapped["User"] = relationship()

    __table_args__ = (
        CheckConstraint(
            "status IN ('Pending','Accepted','Rejected','Withdrawn')",
            name="ck_application_status",
        ),
        # One active (non-withdrawn) application per user per project
        Index("ix_app_project_applicant", "project_id", "applicant_id"),
    )


# ──────────────────────────────────────────
# 8. TEAM_MEMBERS
# ──────────────────────────────────────────
class TeamMember(Base):
    __tablename__ = "team_members"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    project_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    user_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    role: Mapped[str] = mapped_column(String(100), nullable=False)
    is_owner: Mapped[bool] = mapped_column(Boolean, default=False)
    joined_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    project: Mapped["Project"] = relationship(back_populates="team_members")
    user: Mapped["User"] = relationship()

    __table_args__ = (
        UniqueConstraint("project_id", "user_id", name="uq_project_member"),
    )


# ──────────────────────────────────────────
# 9. INVITATIONS (bonus — matches frontend)
# ──────────────────────────────────────────
class Invitation(Base):
    __tablename__ = "invitations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    project_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("projects.id", ondelete="CASCADE"), nullable=False
    )
    sender_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    receiver_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    role: Mapped[str] = mapped_column(String(100), nullable=False)
    message: Mapped[Optional[str]] = mapped_column(Text)
    status: Mapped[str] = mapped_column(String(20), nullable=False, default="Pending")
    sent_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    project: Mapped["Project"] = relationship(back_populates="invitations")
    sender: Mapped["User"] = relationship(foreign_keys=[sender_id])
    receiver: Mapped["User"] = relationship(foreign_keys=[receiver_id])

    __table_args__ = (
        CheckConstraint(
            "status IN ('Pending','Accepted','Declined')",
            name="ck_invitation_status",
        ),
    )


# ──────────────────────────────────────────
# 10. AUDIT_LOG  — activity tracking
# ──────────────────────────────────────────
class AuditLog(Base):
    __tablename__ = "audit_log"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    user_id: Mapped[Optional[int]] = mapped_column(
        Integer, ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    action: Mapped[str] = mapped_column(String(50), nullable=False)
    entity_type: Mapped[str] = mapped_column(String(50), nullable=False)
    entity_id: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    details: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    ip_address: Mapped[Optional[str]] = mapped_column(String(45), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime, default=lambda: datetime.now(timezone.utc)
    )

    __table_args__ = (
        Index("ix_audit_user", "user_id"),
        Index("ix_audit_action", "action"),
        Index("ix_audit_created", "created_at"),
    )

"""Pydantic schemas for request/response validation — matches frontend TypeScript types."""

from __future__ import annotations

from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


# ════════════════════════════════════════════
#  AUTH SCHEMAS
# ════════════════════════════════════════════
class SignupRequest(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    email: str = Field(..., max_length=255)
    password: str = Field(..., min_length=6, max_length=128)
    department: str = Field(..., min_length=2, max_length=100)
    semester: int = Field(..., ge=1, le=10)

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        if "@" not in v:
            raise ValueError("Please enter a valid email address.")
        return v.lower().strip()


class LoginRequest(BaseModel):
    email: str
    password: str = Field(..., min_length=6)

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        return v.lower().strip()


class ResetPasswordRequest(BaseModel):
    email: str
    new_password: str = Field(..., min_length=6)

    @field_validator("email")
    @classmethod
    def validate_email(cls, v: str) -> str:
        return v.lower().strip()


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: "UserPublic"


class UserPublic(BaseModel):
    id: int
    email: str
    role: str

    model_config = {"from_attributes": True}


# ════════════════════════════════════════════
#  SKILL SCHEMAS
# ════════════════════════════════════════════
class SkillBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    category: str = "Core"
    level: str = "Intermediate"

    @field_validator("category")
    @classmethod
    def validate_category(cls, v):
        allowed = {"Frontend", "Backend", "AI/ML", "Mobile", "Design", "Data", "DevOps", "Core"}
        if v not in allowed:
            raise ValueError(f"Category must be one of: {', '.join(sorted(allowed))}")
        return v

    @field_validator("level")
    @classmethod
    def validate_level(cls, v):
        allowed = {"Beginner", "Intermediate", "Advanced"}
        if v not in allowed:
            raise ValueError(f"Level must be one of: {', '.join(sorted(allowed))}")
        return v


class SkillOut(BaseModel):
    name: str
    level: str
    category: str

    model_config = {"from_attributes": True}


# ════════════════════════════════════════════
#  STUDENT PROFILE SCHEMAS
# ════════════════════════════════════════════
class AvailabilityOut(BaseModel):
    hoursPerWeek: int
    status: str
    note: Optional[str] = None


class StatsOut(BaseModel):
    projectsCompleted: int = 0
    hackathonsWon: int = 0
    reliabilityRating: float = 0.0
    endorsedSkillsCount: int = 0


class StudentProjectOut(BaseModel):
    title: str
    role: str
    description: str
    technologies: List[str] = []
    link: Optional[str] = None


class StudentOut(BaseModel):
    """Full student profile matching frontend Student type."""
    id: str  # "student-{user_id}" for frontend compat
    name: str
    avatar: str
    email: str
    department: str
    semester: int
    college: str
    headline: str
    bio: str
    skills: List[SkillOut] = []
    interests: List[str] = []
    availability: AvailabilityOut
    preferredRoles: List[str] = []
    githubUrl: Optional[str] = None
    linkedinUrl: Optional[str] = None
    portfolioUrl: Optional[str] = None
    completedProjects: List[StudentProjectOut] = []
    stats: StatsOut = StatsOut()

    model_config = {"from_attributes": True}


class ProfileUpdateRequest(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    department: Optional[str] = None
    semester: Optional[int] = Field(None, ge=1, le=10)
    college: Optional[str] = None
    headline: Optional[str] = Field(None, max_length=200)
    bio: Optional[str] = None
    interests: Optional[List[str]] = None
    preferred_roles: Optional[List[str]] = None
    availability_hours: Optional[int] = Field(None, ge=0, le=60)
    availability_status: Optional[str] = None
    availability_note: Optional[str] = Field(None, max_length=300)
    github_url: Optional[str] = None
    linkedin_url: Optional[str] = None
    portfolio_url: Optional[str] = None
    skills: Optional[List[SkillBase]] = None

    @field_validator("availability_status")
    @classmethod
    def validate_avail(cls, v):
        if v is not None:
            allowed = {"Actively Looking", "Open to Offers", "Limited Availability", "Unavailable"}
            if v not in allowed:
                raise ValueError(f"Must be one of: {', '.join(sorted(allowed))}")
        return v


# ════════════════════════════════════════════
#  PROJECT SCHEMAS
# ════════════════════════════════════════════
class ProjectRoleSchema(BaseModel):
    id: Optional[str] = None
    title: str
    spots: int = 1
    filled: int = 0
    skills: List[str] = []
    description: str = ""


class TeamMemberOut(BaseModel):
    studentId: str
    name: str
    role: str
    avatar: str
    department: str
    isOwner: Optional[bool] = False

    model_config = {"from_attributes": True}


class ProjectOut(BaseModel):
    """Full project matching frontend Project type."""
    id: str  # "proj-{id}"
    title: str
    tagline: str
    description: str
    category: str
    ownerId: str
    ownerName: str
    ownerAvatar: str
    ownerDepartment: str
    teamSize: dict  # {current, max}
    duration: str
    deadline: str
    requiredSkills: List[str] = []
    preferredInterests: List[str] = []
    openRoles: List[ProjectRoleSchema] = []
    currentMembers: List[TeamMemberOut] = []
    status: str
    createdAt: str
    featured: bool = False

    model_config = {"from_attributes": True}


class ProjectCreateRequest(BaseModel):
    title: str = Field(..., min_length=3, max_length=200)
    tagline: Optional[str] = Field(None, max_length=300)
    description: Optional[str] = None
    category: str = "Coursework"
    max_team_size: int = Field(4, ge=1, le=20)
    duration: Optional[str] = None
    deadline: Optional[str] = None
    required_skills: List[str] = []
    preferred_interests: List[str] = []
    open_roles: List[ProjectRoleSchema] = []
    status: str = "Recruiting"

    @field_validator("category")
    @classmethod
    def validate_category(cls, v):
        allowed = {"Hackathon", "Capstone", "Coursework", "Open Source", "Research", "Startup"}
        if v not in allowed:
            raise ValueError(f"Must be one of: {', '.join(sorted(allowed))}")
        return v


class ProjectUpdateRequest(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=200)
    tagline: Optional[str] = None
    description: Optional[str] = None
    category: Optional[str] = None
    max_team_size: Optional[int] = Field(None, ge=1, le=20)
    duration: Optional[str] = None
    deadline: Optional[str] = None
    required_skills: Optional[List[str]] = None
    preferred_interests: Optional[List[str]] = None
    open_roles: Optional[List[ProjectRoleSchema]] = None
    status: Optional[str] = None

    @field_validator("category")
    @classmethod
    def validate_category(cls, v):
        if v is not None:
            allowed = {"Hackathon", "Capstone", "Coursework", "Open Source", "Research", "Startup"}
            if v not in allowed:
                raise ValueError(f"Must be one of: {', '.join(sorted(allowed))}")
        return v

    @field_validator("status")
    @classmethod
    def validate_status(cls, v):
        if v is not None:
            allowed = {"Recruiting", "In Progress", "Completed"}
            if v not in allowed:
                raise ValueError(f"Must be one of: {', '.join(sorted(allowed))}")
        return v


# ════════════════════════════════════════════
#  APPLICATION SCHEMAS
# ════════════════════════════════════════════
class ApplicationCreateRequest(BaseModel):
    project_id: int
    role_applied: str = Field(..., min_length=1, max_length=100)
    statement: str = Field(..., min_length=10, max_length=2000)


class ApplicationOut(BaseModel):
    """Matches frontend Application type."""
    id: str  # "app-{id}"
    projectId: str
    projectTitle: str
    projectCategory: str
    applicantId: str
    applicantName: str
    applicantAvatar: str
    applicantDepartment: str
    applicantSemester: int
    applicantSkills: List[str] = []
    roleApplied: str
    statement: str
    appliedAt: str
    status: str
    matchScore: float
    matchReasons: List[str] = []

    model_config = {"from_attributes": True}


class ApplicationActionRequest(BaseModel):
    """Accept or reject an application."""
    action: str = Field(..., pattern="^(accept|reject)$")


# ════════════════════════════════════════════
#  INVITATION SCHEMAS
# ════════════════════════════════════════════
class InvitationCreateRequest(BaseModel):
    student_id: int  # receiver user_id
    project_id: int
    role: str = Field(..., min_length=1, max_length=100)
    message: str = Field("", max_length=1000)


class InvitationOut(BaseModel):
    """Matches frontend Invitation type."""
    id: str
    projectId: str
    projectTitle: str
    senderId: str
    senderName: str
    receiverId: str
    receiverName: str
    role: str
    message: str
    sentAt: str
    status: str

    model_config = {"from_attributes": True}


class InvitationActionRequest(BaseModel):
    action: str = Field(..., pattern="^(accept|decline)$")


# ════════════════════════════════════════════
#  MATCH SCHEMAS
# ════════════════════════════════════════════
class MatchScoreOut(BaseModel):
    score: int
    label: str
    matchedSkills: List[str] = []
    missingSkills: List[str] = []
    matchedInterests: List[str] = []
    explanation: str


# ════════════════════════════════════════════
#  GENERIC
# ════════════════════════════════════════════
class MessageResponse(BaseModel):
    message: str
    success: bool = True


class AvatarUploadResponse(BaseModel):
    message: str = "Avatar uploaded successfully."
    avatar_url: str
    success: bool = True

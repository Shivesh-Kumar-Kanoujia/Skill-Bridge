"""SkillBridge Backend — FastAPI application entry point."""

from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.core.database import create_tables
from app.routers import (
    auth_router,
    students_router,
    projects_router,
    applications_router,
    invitations_router,
    teams_router,
    skills_router,
)

# ── Logging ──
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(name)s | %(levelname)s | %(message)s",
)
logger = logging.getLogger("skillbridge")

# ── Lifespan Handler ──
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting SkillBridge API (env=%s)", settings.APP_ENV)
    logger.info("Database: %s", "SQLite (dev)" if settings.is_sqlite else "Production DB")
    logger.info("CORS origins: %s", settings.CORS_ORIGINS)
    await create_tables()
    logger.info("Database tables created/verified.")
    yield


# ── App ──
app = FastAPI(
    title="SkillBridge API",
    description="Student Skill & Project Collaboration Platform — Backend API",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)

# ── CORS ──
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=r"^https?://(localhost|127\.0\.0\.1)(:[0-9]+)?$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Routers ──
app.include_router(auth_router)
app.include_router(students_router)
app.include_router(projects_router)
app.include_router(applications_router)
app.include_router(invitations_router)
app.include_router(teams_router)
app.include_router(skills_router)

# ── Static file serving for local uploads ──
import os
from pathlib import Path

uploads_dir = Path(__file__).parent.parent / "uploads"
uploads_dir.mkdir(exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(uploads_dir)), name="uploads")


# ── Global error handler ──
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Catch unhandled exceptions — never expose internal details to users."""
    logger.error("Unhandled error: %s %s — %s", request.method, request.url.path, str(exc))
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred."},
    )


# ── Health check ──
@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "SkillBridge API",
        "version": "1.0.0",
    }


# ── Dev Database Seed ──
@app.post("/api/dev/seed")
async def dev_seed_database():
    """Seed initial demonstration data (skills, students, projects, applications)."""
    from app.core.database import AsyncSessionLocal
    from app.core.seed import seed_database
    async with AsyncSessionLocal() as session:
        counts = await seed_database(session)
    return {
        "status": "success",
        "message": "Database seeded successfully.",
        "counts": counts,
    }

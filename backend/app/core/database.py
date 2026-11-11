"""Async SQLAlchemy database engine and session management."""

from __future__ import annotations

from sqlalchemy.ext.asyncio import (
    AsyncSession,
    async_sessionmaker,
    create_async_engine,
)
from sqlalchemy.orm import DeclarativeBase

from app.core.config import settings

import logging
from sqlalchemy import event, inspect, text

_logger = logging.getLogger("skillbridge.database")

# Use connect_args for SQLite only
connect_args = {"check_same_thread": False} if settings.is_sqlite else {}

engine = create_async_engine(
    settings.DATABASE_URL,
    echo=settings.APP_ENV == "development",
    connect_args=connect_args,
)

if settings.is_sqlite:
    @event.listens_for(engine.sync_engine, "connect")
    def _set_sqlite_pragmas(dbapi_connection, connection_record):
        cursor = dbapi_connection.cursor()
        cursor.execute("PRAGMA foreign_keys=ON")
        cursor.execute("PRAGMA busy_timeout=5000")
        cursor.close()

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    """Base class for all ORM models."""
    pass


def _ensure_normalized_email_index(connection) -> None:
    """Create a case-insensitive trimmed UNIQUE index on users.email for SQLite/PostgreSQL."""
    if connection.dialect.name not in ("sqlite", "postgresql"):
        return
    if not inspect(connection).has_table("users"):
        return
    dup_rows = connection.execute(
        text(
            "SELECT LOWER(TRIM(email)) AS norm_email, COUNT(*) AS cnt "
            "FROM users GROUP BY LOWER(TRIM(email)) HAVING COUNT(*) > 1"
        )
    ).fetchall()
    if dup_rows:
        _logger.warning(
            "Skipping ix_users_email_lower creation because duplicate normalized emails exist: %s",
            [(row[0], row[1]) for row in dup_rows],
        )
        return
    connection.execute(
        text(
            "CREATE UNIQUE INDEX IF NOT EXISTS ix_users_email_lower "
            "ON users (LOWER(TRIM(email)))"
        )
    )


@event.listens_for(Base.metadata, "after_create")
def _on_metadata_after_create(target, connection, **kw):
    created_tables = kw.get("tables")
    table_names = (
        {t.name for t in created_tables}
        if created_tables is not None
        else set(target.tables.keys())
    )
    if "users" in table_names:
        _ensure_normalized_email_index(connection)


async def get_db() -> AsyncSession:
    """FastAPI dependency that yields a database session per request."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def create_tables():
    """Create all tables — used during development startup."""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        await conn.run_sync(_ensure_normalized_email_index)

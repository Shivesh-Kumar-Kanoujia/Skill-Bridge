"""Audit logging service — records security-relevant actions."""

from __future__ import annotations

import logging
from typing import Optional

from sqlalchemy.ext.asyncio import AsyncSession

from app.models import AuditLog

logger = logging.getLogger("skillbridge.audit")


async def log_action(
    db: AsyncSession,
    user_id: Optional[int],
    action: str,
    entity_type: str,
    entity_id: Optional[int] = None,
    details: Optional[str] = None,
    ip_address: Optional[str] = None,
) -> None:
    """Record an audit log entry. Best-effort — never raises to caller."""
    try:
        entry = AuditLog(
            user_id=user_id,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            details=details,
            ip_address=ip_address,
        )
        db.add(entry)
        # Do NOT commit here — let the caller's transaction commit handle it
        logger.debug(
            "Audit: user=%s action=%s entity=%s/%s",
            user_id, action, entity_type, entity_id,
        )
    except Exception as e:
        logger.warning("Audit log failed: %s", str(e))


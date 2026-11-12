from __future__ import annotations

from typing import Any

from sqlalchemy.ext.asyncio import AsyncSession

from .models import AuditLog
from .security import AuthenticatedUser


async def record_audit(
    session: AsyncSession,
    user: AuthenticatedUser,
    action: str,
    entity_type: str,
    entity_id: str | None = None,
    details: dict[str, Any] | None = None,
) -> None:
    session.add(
        AuditLog(
            actor_user_id=user.id,
            actor_role=user.primary_role,
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            details=details or {},
        )
    )

from __future__ import annotations

from datetime import datetime, timezone
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from .database import get_db
from .models import Notification
from .security import AuthenticatedUser, get_current_user

router = APIRouter(prefix="/api")


@router.get("/notifications")
async def list_notifications(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
    limit: int = 100,
):
    limit = min(max(limit, 1), 200)
    rows = (await session.scalars(
        select(Notification)
        .where(Notification.user_id == user.id)
        .order_by(Notification.created_at.desc())
        .limit(limit)
    )).all()
    data = [{"id": str(item.id), "title": item.title, "message": item.message, "severity": item.severity, "readAt": item.read_at, "createdAt": item.created_at} for item in rows]
    return {"data": data, "status": "LIVE" if data else "NO_DATA", "source": "BRG PostgreSQL"}


@router.post("/notifications/{notification_id}/read")
async def mark_notification_read(
    notification_id: UUID,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
):
    notification = await session.scalar(
        select(Notification).where(Notification.id == notification_id, Notification.user_id == user.id)
    )
    if notification is None:
        raise HTTPException(status_code=404, detail="Notification not found")
    if notification.read_at is None:
        notification.read_at = datetime.now(timezone.utc)
        await session.commit()
    return {"data": {"id": str(notification.id), "readAt": notification.read_at}, "status": "LIVE", "source": "BRG PostgreSQL"}

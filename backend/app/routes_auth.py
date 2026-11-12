from __future__ import annotations

from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, WebSocket, status
from pydantic import BaseModel
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from .audit import record_audit
from .database import get_optional_db, optional_db_session
from .models import AuditLog
from .realtime import realtime_hub
from .security import AuthenticatedUser, authenticate_access_token, get_current_user

router = APIRouter(prefix="/api")


class AuthEvent(BaseModel):
    event: Literal["login", "logout"]


@router.get("/auth/me")
async def get_me(user: Annotated[AuthenticatedUser, Depends(get_current_user)]):
    role = user.primary_role
    role_map = {
        "CENTRAL_AUTHORITY": ("national_admin", "national"),
        "STATE_AUTHORITY": ("state_admin", "state"),
        "DISTRICT_OFFICER": ("district_admin", "district"),
        "EMERGENCY_OFFICER": ("responder", "district" if user.district_scope else "state"),
        "CITIZEN": ("citizen", "citizen"),
    }
    app_role, command_level = role_map[role]
    name = user.name or (user.email.split("@")[0] if user.email else "BRG User")
    initials = "".join(part[0] for part in name.split()[:2]).upper() or "BR"
    return {
        "data": {
            "id": user.id,
            "name": name,
            "email": user.email,
            "role": app_role,
            "roles": list(user.roles),
            "commandLevel": command_level,
            "stateAssigned": user.state_scope,
            "districtAssigned": user.district_scope,
            "avatarInitials": initials,
            "status": "active",
            "lastActive": "just now",
            "emailVerified": user.email_verified,
        },
        "source": "Neon Auth + BRG role assignments",
        "status": "LIVE",
    }


@router.post("/auth/events", status_code=status.HTTP_202_ACCEPTED)
async def auth_event(
    payload: AuthEvent,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession | None, Depends(get_optional_db)],
):
    if session is None:
        return {"status": "OFFLINE", "detail": "Audit database is not configured"}
    try:
        await record_audit(session, user, f"auth.{payload.event}", "session", details={"role": user.primary_role})
        await session.commit()
        return {"status": "LIVE"}
    except SQLAlchemyError:
        await session.rollback()
        return {"status": "OFFLINE", "detail": "Audit event could not be persisted"}


@router.websocket("/events")
async def events_socket(websocket: WebSocket):
    origin = websocket.headers.get("origin")
    configured = {item.strip().rstrip("/") for item in __import__("os").getenv("FRONTEND_ORIGINS", "").split(",") if item.strip()}
    configured.update({"http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174", "http://localhost:4173", "http://127.0.0.1:4173"})
    forwarded_host = websocket.headers.get("x-forwarded-host") or websocket.headers.get("host")
    forwarded_proto = websocket.headers.get("x-forwarded-proto", "https")
    same_origin = f"{forwarded_proto}://{forwarded_host}".rstrip("/") if forwarded_host else None
    if origin and origin.rstrip("/") not in configured and origin.rstrip("/") != same_origin:
        await websocket.close(code=4403)
        return
    protocols = [protocol.strip() for protocol in websocket.headers.get("sec-websocket-protocol", "").split(",") if protocol.strip()]
    if len(protocols) < 2 or protocols[0] != "brg-auth":
        await websocket.close(code=4401)
        return
    try:
        async with optional_db_session() as session:
            user = await authenticate_access_token(protocols[1], session)
    except HTTPException:
        await websocket.close(code=4401)
        return
    await realtime_hub.serve(websocket, user)

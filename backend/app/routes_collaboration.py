from __future__ import annotations

import re
from datetime import datetime, timedelta, timezone
from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from .audit import record_audit
from .communication_schemas import ChatMessageCreate, MissionStatusUpdate
from .database import get_db
from .models import CommunicationMessage, CommunicationRoom, EvacuationRoute, Incident, Mission, Role, UserProfile, UserRoleAssignment
from .realtime import realtime_hub
from .schemas import MissionCreate
from .security import STAFF_ROLES, AuthenticatedUser, get_current_user, require_roles

router = APIRouter(prefix="/api")
COMMAND_ROLES = ("CENTRAL_AUTHORITY", "STATE_AUTHORITY", "DISTRICT_OFFICER")


def _room_access(room: CommunicationRoom, user: AuthenticatedUser) -> bool:
    if user.has_role("CENTRAL_AUTHORITY"):
        return True
    if not user.has_role(*STAFF_ROLES):
        return False
    if room.command_level == "national":
        return True
    if room.state_scope != user.state_scope:
        return False
    if room.command_level == "district":
        return room.district_scope == user.district_scope
    return True


def _require_incident_scope(incident: Incident, user: AuthenticatedUser) -> None:
    if user.has_role("CENTRAL_AUTHORITY"):
        return
    if user.has_role("DISTRICT_OFFICER"):
        if incident.state != user.state_scope or incident.district != user.district_scope:
            raise HTTPException(status_code=403, detail="Incident is outside your assigned district")
        return
    if user.has_role("STATE_AUTHORITY"):
        if not user.state_scope or incident.state != user.state_scope:
            raise HTTPException(status_code=403, detail="Incident is outside your assigned state")
        return
    if user.has_role("EMERGENCY_OFFICER") and incident.assigned_to == user.id:
        return
    raise HTTPException(status_code=403, detail="Incident is outside your assigned scope")


def _mission_dict(item: Mission) -> dict:
    return {
        "id": str(item.id),
        "incidentId": str(item.incident_id),
        "name": item.name,
        "objective": item.objective,
        "assignedTeam": item.assigned_team,
        "assignedUserId": item.assigned_user_id,
        "status": item.status,
        "startedAt": item.started_at,
        "completedAt": item.completed_at,
        "createdAt": item.created_at,
    }


@router.get("/communications/rooms")
async def list_communication_rooms(
    user: Annotated[AuthenticatedUser, Depends(require_roles(*STAFF_ROLES))],
    session: Annotated[AsyncSession, Depends(get_db)],
):
    rooms = (await session.scalars(select(CommunicationRoom).order_by(CommunicationRoom.command_level, CommunicationRoom.name))).all()
    if user.state_scope and user.has_role("STATE_AUTHORITY", "DISTRICT_OFFICER", "EMERGENCY_OFFICER"):
        state_slug = re.sub(r"[^a-z0-9-]+", "-", user.state_scope.strip().lower()).strip("-")
        state_code = f"state:{state_slug}"
        if not any(room.code == state_code for room in rooms):
            state_room = CommunicationRoom(code=state_code, name=f"{user.state_scope} Command", command_level="state", state_scope=user.state_scope)
            session.add(state_room)
            rooms.append(state_room)
        if user.district_scope:
            district_slug = re.sub(r"[^a-z0-9-]+", "-", user.district_scope.strip().lower()).strip("-")
            district_code = f"district:{state_slug}:{district_slug}"
            if not any(room.code == district_code for room in rooms):
                district_room = CommunicationRoom(code=district_code, name=f"{user.district_scope} District", command_level="district", state_scope=user.state_scope, district_scope=user.district_scope)
                session.add(district_room)
                rooms.append(district_room)
        await session.commit()
    visible = [room for room in rooms if _room_access(room, user)]
    data = [{"id": str(room.id), "code": room.code, "name": room.name, "commandLevel": room.command_level, "stateScope": room.state_scope, "districtScope": room.district_scope} for room in visible]
    return {"data": data, "status": "LIVE" if data else "NO_DATA", "source": "BRG PostgreSQL"}


@router.get("/communications/rooms/{room_id}/messages")
async def list_communication_messages(
    room_id: UUID,
    user: Annotated[AuthenticatedUser, Depends(require_roles(*STAFF_ROLES))],
    session: Annotated[AsyncSession, Depends(get_db)],
    limit: int = 100,
):
    limit = min(max(limit, 1), 200)
    room = await session.get(CommunicationRoom, room_id)
    if room is None:
        raise HTTPException(status_code=404, detail="Communication room not found")
    if not _room_access(room, user):
        raise HTTPException(status_code=403, detail="Room is outside your assigned scope")
    rows = (await session.scalars(
        select(CommunicationMessage)
        .where(CommunicationMessage.room_id == room_id)
        .order_by(CommunicationMessage.created_at.desc())
        .limit(limit)
    )).all()
    data = [{"id": str(item.id), "roomId": str(item.room_id), "senderUserId": item.sender_user_id, "senderName": item.sender_name, "senderRole": item.sender_role, "content": item.content, "createdAt": item.created_at} for item in reversed(rows)]
    return {"data": data, "status": "LIVE" if data else "NO_DATA", "source": "BRG PostgreSQL"}


@router.post("/communications/rooms/{room_id}/messages", status_code=status.HTTP_201_CREATED)
async def create_communication_message(
    room_id: UUID,
    payload: ChatMessageCreate,
    user: Annotated[AuthenticatedUser, Depends(require_roles(*STAFF_ROLES))],
    session: Annotated[AsyncSession, Depends(get_db)],
):
    room = await session.get(CommunicationRoom, room_id)
    if room is None:
        raise HTTPException(status_code=404, detail="Communication room not found")
    if not _room_access(room, user):
        raise HTTPException(status_code=403, detail="Room is outside your assigned scope")
    cutoff = datetime.now(timezone.utc) - timedelta(minutes=1)
    recent_count = await session.scalar(
        select(func.count()).select_from(CommunicationMessage)
        .where(CommunicationMessage.sender_user_id == user.id, CommunicationMessage.created_at >= cutoff)
    )
    if int(recent_count or 0) >= 30:
        raise HTTPException(status_code=429, detail="Message rate limit reached; try again shortly")
    message = CommunicationMessage(
        room_id=room.id,
        sender_user_id=user.id,
        sender_name=(user.name or user.email or "BRG user")[:180],
        sender_role=user.primary_role,
        content=payload.content,
    )
    session.add(message)
    await session.flush()
    await record_audit(session, user, "communication.message_sent", "communication_message", str(message.id), {"roomId": str(room.id)})
    await session.commit()
    data = {"id": str(message.id), "roomId": str(room.id), "senderUserId": message.sender_user_id, "senderName": message.sender_name, "senderRole": message.sender_role, "content": message.content, "createdAt": message.created_at}
    await realtime_hub.broadcast("communication:message", {"roomId": str(room.id), "roomCode": room.code, "commandLevel": room.command_level, "stateScope": room.state_scope, "districtScope": room.district_scope, "message": data})
    return {"data": data, "status": "LIVE", "source": "BRG PostgreSQL"}


@router.get("/missions")
async def list_missions(
    user: Annotated[AuthenticatedUser, Depends(require_roles(*STAFF_ROLES))],
    session: Annotated[AsyncSession, Depends(get_db)],
    incident_id: UUID | None = None,
    limit: int = 100,
):
    limit = min(max(limit, 1), 200)
    statement = select(Mission).join(Incident, Incident.id == Mission.incident_id).order_by(Mission.created_at.desc()).limit(limit)
    if incident_id:
        statement = statement.where(Mission.incident_id == incident_id)
    if user.has_role("CENTRAL_AUTHORITY"):
        pass
    elif user.has_role("DISTRICT_OFFICER"):
        if not user.state_scope or not user.district_scope:
            raise HTTPException(status_code=403, detail="District scope has not been assigned")
        statement = statement.where(Incident.state == user.state_scope, Incident.district == user.district_scope)
    elif user.has_role("STATE_AUTHORITY"):
        if not user.state_scope:
            raise HTTPException(status_code=403, detail="State scope has not been assigned")
        statement = statement.where(Incident.state == user.state_scope)
    else:
        statement = statement.where(Mission.assigned_user_id == user.id)
    rows = (await session.scalars(statement)).all()
    data = [_mission_dict(item) for item in rows]
    return {"data": data, "status": "LIVE" if data else "NO_DATA", "source": "BRG PostgreSQL"}


@router.post("/missions", status_code=status.HTTP_201_CREATED)
async def create_mission(
    payload: MissionCreate,
    user: Annotated[AuthenticatedUser, Depends(require_roles(*COMMAND_ROLES))],
    session: Annotated[AsyncSession, Depends(get_db)],
):
    incident = await session.get(Incident, payload.incident_id)
    if incident is None:
        raise HTTPException(status_code=404, detail="Incident not found")
    _require_incident_scope(incident, user)
    if payload.assigned_user_id:
        target = await session.scalar(
            select(UserProfile.id)
            .join(UserRoleAssignment, UserRoleAssignment.user_id == UserProfile.id)
            .where(
                UserProfile.auth_user_id == payload.assigned_user_id,
                UserRoleAssignment.role_name == "EMERGENCY_OFFICER",
                (UserRoleAssignment.state_scope.is_(None)) | (UserRoleAssignment.state_scope == incident.state),
                (UserRoleAssignment.district_scope.is_(None)) | (UserRoleAssignment.district_scope == incident.district),
            )
        )
        if target is None:
            raise HTTPException(status_code=422, detail="Assignee is not an emergency officer in the incident scope")
    mission = Mission(
        incident_id=incident.id,
        name=payload.name.strip(),
        objective=payload.objective.strip(),
        assigned_team=payload.assigned_team.strip() if payload.assigned_team else None,
        assigned_user_id=payload.assigned_user_id,
        status="assigned" if payload.assigned_user_id or payload.assigned_team else "planning",
        created_by=user.id,
    )
    session.add(mission)
    await session.flush()
    await record_audit(session, user, "mission.created", "mission", str(mission.id), {"incidentId": str(incident.id)})
    await session.commit()
    await realtime_hub.broadcast("mission:created", {"missionId": str(mission.id), "incidentId": str(incident.id), "stateScope": incident.state, "districtScope": incident.district})
    return {"data": _mission_dict(mission), "status": "LIVE", "source": "BRG PostgreSQL"}


@router.patch("/missions/{mission_id}/status")
async def update_mission_status(
    mission_id: UUID,
    payload: MissionStatusUpdate,
    user: Annotated[AuthenticatedUser, Depends(require_roles(*STAFF_ROLES))],
    session: Annotated[AsyncSession, Depends(get_db)],
):
    mission = await session.get(Mission, mission_id)
    if mission is None:
        raise HTTPException(status_code=404, detail="Mission not found")
    incident = await session.get(Incident, mission.incident_id)
    if incident is None:
        raise HTTPException(status_code=409, detail="Mission is missing its incident record")
    _require_incident_scope(incident, user)
    transitions = {"planning": {"assigned", "cancelled"}, "assigned": {"active", "cancelled"}, "active": {"paused", "completed", "cancelled"}, "paused": {"active", "cancelled"}, "completed": set(), "cancelled": set()}
    if payload.status != mission.status and payload.status not in transitions.get(mission.status, set()):
        raise HTTPException(status_code=409, detail="Invalid mission status transition")
    mission.status = payload.status
    if payload.status == "active" and mission.started_at is None:
        mission.started_at = datetime.now(timezone.utc)
    if payload.status in {"completed", "cancelled"}:
        mission.completed_at = datetime.now(timezone.utc)
    await record_audit(session, user, "mission.status_updated", "mission", str(mission.id), {"status": payload.status})
    await session.commit()
    await realtime_hub.broadcast("mission:status", {"missionId": str(mission.id), "incidentId": str(incident.id), "status": mission.status, "stateScope": incident.state, "districtScope": incident.district})
    return {"data": _mission_dict(mission), "status": "LIVE", "source": "BRG PostgreSQL"}


@router.post("/evacuation/routes/{route_id}/activate")
async def activate_evacuation_route(
    route_id: UUID,
    user: Annotated[AuthenticatedUser, Depends(require_roles(*COMMAND_ROLES))],
    session: Annotated[AsyncSession, Depends(get_db)],
):
    route = await session.get(EvacuationRoute, route_id)
    if route is None:
        raise HTTPException(status_code=404, detail="Evacuation route not found")
    if route.incident_id is None:
        raise HTTPException(status_code=409, detail="Route is not associated with an incident")
    incident = await session.get(Incident, route.incident_id)
    if incident is None:
        raise HTTPException(status_code=409, detail="Route incident no longer exists")
    _require_incident_scope(incident, user)
    if route.hazard_status not in {"ASSESSED", "NO_INTERSECTIONS_REPORTED"}:
        raise HTTPException(status_code=409, detail="Route hazard coverage is insufficient for activation")
    incident.status = "responding"
    incident.updated_at = datetime.now(timezone.utc)
    await record_audit(session, user, "evacuation.route_activated", "evacuation_route", str(route.id), {"incidentId": str(incident.id), "hazardStatus": route.hazard_status})
    await session.commit()
    await realtime_hub.broadcast("incident:updated", {"id": str(incident.id), "reference": incident.reference, "status": incident.status, "state": incident.state, "district": incident.district})
    return {"data": {"routeId": str(route.id), "incidentId": str(incident.id), "status": "ACTIVATED", "incidentStatus": incident.status}, "status": "LIVE", "source": "BRG PostgreSQL"}

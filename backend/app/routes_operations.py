from __future__ import annotations

from datetime import datetime, timedelta, timezone
from typing import Annotated, Any
from uuid import UUID, uuid4

from fastapi import APIRouter, Depends, HTTPException, Query, status
from fastapi.encoders import jsonable_encoder
from geoalchemy2.elements import WKTElement
from sqlalchemy import and_, func, or_, select
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from .audit import record_audit
from .database import get_db
from .models import Alert, AuditLog, CitizenReport, Incident, Resource, Role, Shelter, UserProfile, UserRoleAssignment
from .realtime import realtime_hub
from .schemas import AlertCreate, CitizenReportCreate, IncidentAssignment, IncidentCreate, IncidentUpdate, ResourceCreate, RoleAssignmentCreate, ShelterCreate, ShelterUpdate
from .security import AuthenticatedUser, STAFF_ROLES, get_current_user, require_roles

router = APIRouter(prefix="/api")
COMMAND_ROLES = ("CENTRAL_AUTHORITY", "STATE_AUTHORITY", "DISTRICT_OFFICER")
ADMIN_ROLES = ("CENTRAL_AUTHORITY",)


def _point(longitude: float | None, latitude: float | None):
    if longitude is None or latitude is None:
        return None
    return WKTElement(f"POINT({longitude} {latitude})", srid=4326)


def _scope_clause(model: Any, user: AuthenticatedUser):
    if user.has_role("CENTRAL_AUTHORITY"):
        return None
    if user.has_role("DISTRICT_OFFICER"):
        if not user.state_scope or not user.district_scope:
            raise HTTPException(status_code=403, detail="District scope has not been assigned")
        return (model.state == user.state_scope, model.district == user.district_scope)
    if user.has_role("STATE_AUTHORITY"):
        if not user.state_scope:
            raise HTTPException(status_code=403, detail="State scope has not been assigned")
        return (model.state == user.state_scope,)
    if user.has_role("EMERGENCY_OFFICER"):
        return (model.assigned_to == user.id,) if hasattr(model, "assigned_to") else (model.updated_by == user.id,)
    raise HTTPException(status_code=403, detail="Operational staff access is required")


def _ensure_record_scope(model: Any, user: AuthenticatedUser) -> None:
    if user.has_role("CENTRAL_AUTHORITY"):
        return
    if user.has_role("DISTRICT_OFFICER") and (model.state != user.state_scope or model.district != user.district_scope):
        raise HTTPException(status_code=403, detail="Record is outside your assigned district")
    if user.has_role("STATE_AUTHORITY") and model.state != user.state_scope:
        raise HTTPException(status_code=403, detail="Record is outside your assigned state")
    if user.has_role("EMERGENCY_OFFICER") and getattr(model, "assigned_to", None) != user.id:
        raise HTTPException(status_code=403, detail="Record is not assigned to your account")


def _incident_json(item: Incident) -> dict[str, Any]:
    return {
        "id": str(item.id), "reference": item.reference, "hazardType": item.hazard_type,
        "title": item.title, "description": item.description, "severity": item.severity,
        "status": item.status, "location": item.location_text, "state": item.state,
        "district": item.district, "latitude": item.latitude, "longitude": item.longitude,
        "reportedBy": item.reported_by, "assignedTo": item.assigned_to,
        "affectedPopulation": item.affected_population,
        "createdAt": item.created_at, "updatedAt": item.updated_at,
    }


def _shelter_json(item: Shelter, user: AuthenticatedUser) -> dict[str, Any]:
    staff = user.has_role(*STAFF_ROLES)
    return {
        "id": str(item.id), "name": item.name, "address": item.address, "state": item.state,
        "district": item.district, "latitude": item.latitude, "longitude": item.longitude,
        "capacity": item.capacity, "occupancy": item.occupancy, "status": item.status,
        "contactPhone": item.contact_phone if staff else None, "medicalSupport": item.medical_support,
        "foodStock": item.food_stock, "waterStock": item.water_stock, "updatedAt": item.updated_at,
    }


@router.get("/incidents")
async def list_incidents(
    user: Annotated[AuthenticatedUser, Depends(require_roles(*STAFF_ROLES))],
    session: Annotated[AsyncSession, Depends(get_db)],
    incident_status: str | None = Query(default=None, alias="status", max_length=24),
    severity: str | None = Query(default=None, max_length=16),
    state: str | None = Query(default=None, max_length=100),
    district: str | None = Query(default=None, max_length=100),
    limit: int = Query(default=100, ge=1, le=200),
    offset: int = Query(default=0, ge=0, le=100_000),
):
    statement = select(Incident).order_by(Incident.created_at.desc()).limit(limit).offset(offset)
    scope = _scope_clause(Incident, user)
    if scope:
        statement = statement.where(*scope)
    if incident_status:
        statement = statement.where(Incident.status == incident_status)
    if severity:
        statement = statement.where(Incident.severity == severity)
    if state and not user.has_role("CENTRAL_AUTHORITY") and state != user.state_scope:
        raise HTTPException(status_code=403, detail="Requested state is outside your assigned scope")
    if state:
        statement = statement.where(Incident.state == state)
    if district and not user.has_role("CENTRAL_AUTHORITY") and district != user.district_scope and user.has_role("DISTRICT_OFFICER"):
        raise HTTPException(status_code=403, detail="Requested district is outside your assigned scope")
    if district:
        statement = statement.where(Incident.district == district)
    rows = (await session.scalars(statement)).all()
    return {"data": [_incident_json(item) for item in rows], "status": "LIVE" if rows else "NO_DATA", "source": "BRG PostgreSQL"}


@router.post("/incidents", status_code=status.HTTP_201_CREATED)
async def create_incident(
    payload: IncidentCreate,
    user: Annotated[AuthenticatedUser, Depends(require_roles(*COMMAND_ROLES))],
    session: Annotated[AsyncSession, Depends(get_db)],
):
    if not user.has_role("CENTRAL_AUTHORITY") and payload.state != user.state_scope:
        raise HTTPException(status_code=403, detail="Incident state is outside your assigned scope")
    if user.has_role("DISTRICT_OFFICER") and payload.district != user.district_scope:
        raise HTTPException(status_code=403, detail="Incident district is outside your assigned scope")
    identifier = uuid4()
    item = Incident(
        id=identifier, reference=f"BRG-INC-{identifier.hex[:8].upper()}", hazard_type=payload.hazard_type.lower(),
        title=payload.title, description=payload.description, severity=payload.severity, status="reported",
        location_text=payload.location_text, state=payload.state, district=payload.district,
        latitude=payload.latitude, longitude=payload.longitude, geom=_point(payload.longitude, payload.latitude),
        reported_by=user.id, affected_population=payload.affected_population,
    )
    session.add(item)
    await record_audit(session, user, "incident.created", "incident", str(identifier), {"severity": payload.severity, "hazardType": payload.hazard_type})
    await session.commit()
    await session.refresh(item)
    result = _incident_json(item)
    await realtime_hub.broadcast("incident:created", result)
    return {"data": result, "status": "LIVE", "source": "BRG PostgreSQL"}


@router.patch("/incidents/{incident_id}")
async def update_incident(
    incident_id: UUID,
    payload: IncidentUpdate,
    user: Annotated[AuthenticatedUser, Depends(require_roles(*STAFF_ROLES))],
    session: Annotated[AsyncSession, Depends(get_db)],
):
    item = await session.get(Incident, incident_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Incident was not found")
    _ensure_record_scope(item, user)
    changes = payload.model_dump(exclude_unset=True)
    if "state" in changes and changes["state"] and not user.has_role("CENTRAL_AUTHORITY") and changes["state"] != user.state_scope:
        raise HTTPException(status_code=403, detail="Incident state is outside your assigned scope")
    if "status" in changes:
        transitions = {"reported": {"verified", "responding"}, "verified": {"responding", "contained"}, "responding": {"contained", "resolved"}, "contained": {"responding", "resolved"}, "resolved": set()}
        if changes["status"] != item.status and changes["status"] not in transitions.get(item.status, set()):
            raise HTTPException(status_code=409, detail="Invalid incident status transition")
    for key, value in changes.items():
        setattr(item, key, value)
    item.updated_at = datetime.now(timezone.utc)
    await record_audit(session, user, "incident.updated", "incident", str(item.id), {"fields": sorted(changes)})
    await session.commit()
    await session.refresh(item)
    result = _incident_json(item)
    await realtime_hub.broadcast("incident:updated", result)
    return {"data": result, "status": "LIVE", "source": "BRG PostgreSQL"}


@router.post("/incidents/{incident_id}/assign")
async def assign_incident(
    incident_id: UUID,
    payload: IncidentAssignment,
    user: Annotated[AuthenticatedUser, Depends(require_roles(*COMMAND_ROLES))],
    session: Annotated[AsyncSession, Depends(get_db)],
):
    incident = await session.get(Incident, incident_id)
    if incident is None:
        raise HTTPException(status_code=404, detail="Incident was not found")
    _ensure_record_scope(incident, user)
    assignee = await session.scalar(
        select(UserRoleAssignment.id)
        .join(UserProfile, UserProfile.id == UserRoleAssignment.user_id)
        .where(
            UserProfile.auth_user_id == payload.assigned_to,
            UserRoleAssignment.role_name == "EMERGENCY_OFFICER",
            or_(UserRoleAssignment.state_scope.is_(None), UserRoleAssignment.state_scope == incident.state),
            or_(UserRoleAssignment.district_scope.is_(None), UserRoleAssignment.district_scope == incident.district),
        )
    )
    if assignee is None:
        raise HTTPException(status_code=422, detail="Assignee is not an emergency officer in this incident scope")
    incident.assigned_to = payload.assigned_to
    incident.updated_at = datetime.now(timezone.utc)
    await record_audit(session, user, "incident.assigned", "incident", str(incident.id), {"assignee": payload.assigned_to})
    await session.commit()
    await session.refresh(incident)
    result = _incident_json(incident)
    await realtime_hub.broadcast("incident:updated", result)
    return {"data": result, "status": "LIVE", "source": "BRG PostgreSQL"}


@router.get("/shelters")
async def list_shelters(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
    shelter_status: str | None = Query(default=None, alias="status", max_length=24),
    state: str | None = Query(default=None, max_length=100),
    district: str | None = Query(default=None, max_length=100),
    limit: int = Query(default=200, ge=1, le=500),
):
    statement = select(Shelter).order_by(Shelter.name).limit(limit)
    if user.has_role("DISTRICT_OFFICER"):
        if not user.state_scope or not user.district_scope:
            raise HTTPException(status_code=403, detail="District scope has not been assigned")
        statement = statement.where(Shelter.state == user.state_scope, Shelter.district == user.district_scope)
    elif user.has_role("STATE_AUTHORITY"):
        if not user.state_scope:
            raise HTTPException(status_code=403, detail="State scope has not been assigned")
        statement = statement.where(Shelter.state == user.state_scope)
    elif state:
        statement = statement.where(Shelter.state == state)
    if district:
        statement = statement.where(Shelter.district == district)
    if shelter_status:
        statement = statement.where(Shelter.status == shelter_status)
    rows = (await session.scalars(statement)).all()
    return {"data": [_shelter_json(item, user) for item in rows], "status": "LIVE" if rows else "NO_DATA", "source": "BRG PostgreSQL/PostGIS"}


@router.post("/shelters", status_code=status.HTTP_201_CREATED)
async def create_shelter(
    payload: ShelterCreate,
    user: Annotated[AuthenticatedUser, Depends(require_roles(*COMMAND_ROLES))],
    session: Annotated[AsyncSession, Depends(get_db)],
):
    if not user.has_role("CENTRAL_AUTHORITY") and payload.state != user.state_scope:
        raise HTTPException(status_code=403, detail="Shelter state is outside your assigned scope")
    if user.has_role("DISTRICT_OFFICER") and payload.district != user.district_scope:
        raise HTTPException(status_code=403, detail="Shelter district is outside your assigned scope")
    item = Shelter(**payload.model_dump(), geom=_point(payload.longitude, payload.latitude), updated_by=user.id)
    session.add(item)
    await record_audit(session, user, "shelter.created", "shelter", None, {"state": payload.state})
    await session.commit()
    await session.refresh(item)
    result = _shelter_json(item, user)
    await realtime_hub.broadcast("shelter:updated", result)
    return {"data": result, "status": "LIVE", "source": "BRG PostgreSQL"}


@router.patch("/shelters/{shelter_id}")
async def update_shelter(
    shelter_id: UUID,
    payload: ShelterUpdate,
    user: Annotated[AuthenticatedUser, Depends(require_roles(*COMMAND_ROLES))],
    session: Annotated[AsyncSession, Depends(get_db)],
):
    item = await session.get(Shelter, shelter_id)
    if item is None:
        raise HTTPException(status_code=404, detail="Shelter was not found")
    _ensure_record_scope(item, user)
    changes = payload.model_dump(exclude_unset=True)
    next_capacity = changes.get("capacity", item.capacity)
    next_occupancy = changes.get("occupancy", item.occupancy)
    if next_capacity is not None and next_occupancy is not None and next_occupancy > next_capacity:
        raise HTTPException(status_code=422, detail="Shelter occupancy cannot exceed capacity")
    for key, value in changes.items():
        setattr(item, key, value)
    item.updated_by = user.id
    item.updated_at = datetime.now(timezone.utc)
    await record_audit(session, user, "shelter.updated", "shelter", str(item.id), {"fields": sorted(changes)})
    await session.commit()
    await session.refresh(item)
    result = _shelter_json(item, user)
    await realtime_hub.broadcast("shelter:updated", result)
    return {"data": result, "status": "LIVE", "source": "BRG PostgreSQL"}


@router.get("/resources")
async def list_resources(
    user: Annotated[AuthenticatedUser, Depends(require_roles(*STAFF_ROLES))],
    session: Annotated[AsyncSession, Depends(get_db)],
    limit: int = Query(default=200, ge=1, le=500),
):
    statement = select(Resource).order_by(Resource.name).limit(limit)
    scope = _scope_clause(Resource, user)
    if scope:
        statement = statement.where(*scope)
    rows = (await session.scalars(statement)).all()
    data = [{"id": str(row.id), "name": row.name, "category": row.category, "status": row.status, "quantity": row.quantity, "available": row.available, "state": row.state, "district": row.district, "latitude": row.latitude, "longitude": row.longitude, "assignedIncidentId": str(row.assigned_incident_id) if row.assigned_incident_id else None} for row in rows]
    return {"data": data, "status": "LIVE" if rows else "NO_DATA", "source": "BRG PostgreSQL"}


@router.post("/resources", status_code=status.HTTP_201_CREATED)
async def create_resource(
    payload: ResourceCreate,
    user: Annotated[AuthenticatedUser, Depends(require_roles(*COMMAND_ROLES))],
    session: Annotated[AsyncSession, Depends(get_db)],
):
    if not user.has_role("CENTRAL_AUTHORITY") and payload.state != user.state_scope:
        raise HTTPException(status_code=403, detail="Resource state is outside your assigned scope")
    item = Resource(**payload.model_dump(), status="available", geom=_point(payload.longitude, payload.latitude), updated_by=user.id)
    session.add(item)
    await record_audit(session, user, "resource.created", "resource", None, {"category": payload.category, "state": payload.state})
    await session.commit()
    await session.refresh(item)
    result = {"id": str(item.id), "name": item.name, "category": item.category, "status": item.status, "quantity": item.quantity, "available": item.available, "state": item.state, "district": item.district}
    await realtime_hub.broadcast("resource:updated", result)
    return {"data": result, "status": "LIVE", "source": "BRG PostgreSQL"}


@router.get("/alerts")
async def list_alerts(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
    limit: int = Query(default=100, ge=1, le=200),
):
    statement = select(Alert).where(Alert.status == "active").order_by(Alert.created_at.desc()).limit(limit)
    if user.has_role("CITIZEN"):
        statement = statement.where(Alert.audience == "public")
    elif not user.has_role("CENTRAL_AUTHORITY"):
        visible_audiences = [Alert.audience.in_(["public", "staff"])]
        if user.state_scope:
            visible_audiences.append(and_(Alert.audience == "state", Alert.state_scope == user.state_scope))
            if user.district_scope:
                visible_audiences.append(and_(Alert.audience == "district", Alert.state_scope == user.state_scope, Alert.district_scope == user.district_scope))
            elif user.has_role("STATE_AUTHORITY"):
                visible_audiences.append(and_(Alert.audience == "district", Alert.state_scope == user.state_scope))
        statement = statement.where(or_(*visible_audiences))
    rows = (await session.scalars(statement)).all()
    return {"data": [{"id": str(row.id), "title": row.title, "message": row.message, "severity": row.severity, "audience": row.audience, "state": row.state_scope, "district": row.district_scope, "createdAt": row.created_at} for row in rows], "status": "LIVE" if rows else "NO_DATA", "source": "BRG PostgreSQL"}


@router.post("/alerts", status_code=status.HTTP_201_CREATED)
async def create_alert(
    payload: AlertCreate,
    user: Annotated[AuthenticatedUser, Depends(require_roles(*COMMAND_ROLES))],
    session: Annotated[AsyncSession, Depends(get_db)],
):
    if payload.state_scope and not user.has_role("CENTRAL_AUTHORITY") and payload.state_scope != user.state_scope:
        raise HTTPException(status_code=403, detail="Alert state is outside your assigned scope")
    if payload.district_scope and user.has_role("DISTRICT_OFFICER") and payload.district_scope != user.district_scope:
        raise HTTPException(status_code=403, detail="Alert district is outside your assigned scope")
    item = Alert(**payload.model_dump(), created_by=user.id)
    session.add(item)
    await record_audit(session, user, "alert.created", "alert", None, {"severity": payload.severity, "audience": payload.audience})
    await session.commit()
    await session.refresh(item)
    result = {"id": str(item.id), "title": item.title, "message": item.message, "severity": item.severity, "audience": item.audience, "state": item.state_scope, "district": item.district_scope, "createdAt": item.created_at}
    await realtime_hub.broadcast("alert:created", result)
    return {"data": result, "status": "LIVE", "source": "BRG PostgreSQL"}


@router.post("/citizen-reports", status_code=status.HTTP_201_CREATED)
async def create_citizen_report(
    payload: CitizenReportCreate,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
):
    if not user.email_verified:
        raise HTTPException(status_code=403, detail="A verified Neon Auth email is required to submit a report")
    cutoff = datetime.now(timezone.utc) - timedelta(hours=1)
    recent_count = await session.scalar(select(func.count()).select_from(CitizenReport).where(CitizenReport.reported_by == user.id, CitizenReport.created_at >= cutoff))
    if int(recent_count or 0) >= 3:
        raise HTTPException(status_code=429, detail="Report limit reached. Try again later.")
    identifier = uuid4()
    item = CitizenReport(
        id=identifier, reference=f"BRG-RPT-{identifier.hex[:8].upper()}", report_type=payload.report_type.lower(),
        description=payload.description, location_text=payload.location_text, state=payload.state, district=payload.district,
        latitude=payload.latitude, longitude=payload.longitude, geom=_point(payload.longitude, payload.latitude),
        status="received", reported_by=user.id, email_verified=True,
    )
    session.add(item)
    await record_audit(session, user, "citizen_report.created", "citizen_report", str(identifier), {"reportType": item.report_type})
    await session.commit()
    await session.refresh(item)
    result = {"id": str(item.id), "reference": item.reference, "reportType": item.report_type, "description": item.description, "location": item.location_text, "state": item.state, "district": item.district, "latitude": item.latitude, "longitude": item.longitude, "status": item.status, "createdAt": item.created_at}
    await realtime_hub.broadcast("citizen-report:created", {"id": result["id"], "reference": result["reference"], "status": result["status"], "state": result["state"]})
    return {"data": result, "status": "LIVE", "source": "BRG PostgreSQL"}


@router.get("/citizen-reports/mine")
async def list_my_reports(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
    limit: int = Query(default=50, ge=1, le=100),
):
    rows = (await session.scalars(select(CitizenReport).where(CitizenReport.reported_by == user.id).order_by(CitizenReport.created_at.desc()).limit(limit))).all()
    data = [{"id": str(row.id), "reference": row.reference, "reportType": row.report_type, "location": row.location_text, "status": row.status, "createdAt": row.created_at} for row in rows]
    return {"data": data, "status": "LIVE" if rows else "NO_DATA", "source": "BRG PostgreSQL"}


@router.get("/admin/audit")
async def list_audit_logs(
    user: Annotated[AuthenticatedUser, Depends(require_roles(*ADMIN_ROLES))],
    session: Annotated[AsyncSession, Depends(get_db)],
    limit: int = Query(default=100, ge=1, le=500),
):
    rows = (await session.scalars(select(AuditLog).order_by(AuditLog.created_at.desc()).limit(limit))).all()
    data = [{"id": str(row.id), "userId": row.actor_user_id, "role": row.actor_role, "action": row.action, "entityType": row.entity_type, "entityId": row.entity_id, "timestamp": row.created_at, "details": jsonable_encoder(row.details)} for row in rows]
    return {"data": data, "status": "LIVE" if rows else "NO_DATA", "source": "BRG audit log"}


@router.get("/admin/users")
async def list_users(
    user: Annotated[AuthenticatedUser, Depends(require_roles(*ADMIN_ROLES))],
    session: Annotated[AsyncSession, Depends(get_db)],
    limit: int = Query(default=200, ge=1, le=500),
):
    rows = (await session.execute(
        select(UserProfile.auth_user_id, UserProfile.email, UserProfile.display_name, UserProfile.email_verified, UserProfile.created_at, Role.name.label("role_name"), UserRoleAssignment.state_scope, UserRoleAssignment.district_scope)
        .outerjoin(UserRoleAssignment, UserRoleAssignment.user_id == UserProfile.id)
        .outerjoin(Role, Role.name == UserRoleAssignment.role_name)
        .order_by(UserProfile.created_at.desc())
        .limit(limit)
    )).mappings().all()
    users: dict[str, dict[str, Any]] = {}
    for row in rows:
        item = users.setdefault(row["auth_user_id"], {"id": row["auth_user_id"], "email": row["email"], "name": row["display_name"], "emailVerified": row["email_verified"], "createdAt": row["created_at"], "roles": []})
        if row["role_name"]:
            item["roles"].append({"role": row["role_name"], "stateScope": row["state_scope"], "districtScope": row["district_scope"]})
    return {"data": list(users.values()), "status": "LIVE" if users else "NO_DATA", "source": "Neon Auth profiles + BRG role assignments"}


@router.post("/admin/users/{auth_user_id}/roles", status_code=status.HTTP_201_CREATED)
async def assign_user_role(
    auth_user_id: str,
    payload: RoleAssignmentCreate,
    user: Annotated[AuthenticatedUser, Depends(require_roles(*ADMIN_ROLES))],
    session: Annotated[AsyncSession, Depends(get_db)],
):
    if len(auth_user_id) > 255:
        raise HTTPException(status_code=422, detail="Invalid user identifier")
    profile = await session.scalar(select(UserProfile).where(UserProfile.auth_user_id == auth_user_id))
    if profile is None:
        profile = UserProfile(auth_user_id=auth_user_id)
        session.add(profile)
        await session.flush()
    if await session.get(Role, payload.role) is None:
        raise HTTPException(status_code=503, detail="Role catalogue has not been installed")
    conditions = [UserRoleAssignment.user_id == profile.id, UserRoleAssignment.role_name == payload.role]
    conditions.append(UserRoleAssignment.state_scope.is_(None) if payload.state_scope is None else UserRoleAssignment.state_scope == payload.state_scope)
    conditions.append(UserRoleAssignment.district_scope.is_(None) if payload.district_scope is None else UserRoleAssignment.district_scope == payload.district_scope)
    if await session.scalar(select(UserRoleAssignment.id).where(*conditions)):
        raise HTTPException(status_code=409, detail="That role and scope assignment already exists")
    if payload.role in {"STATE_AUTHORITY", "DISTRICT_OFFICER", "EMERGENCY_OFFICER"}:
        existing_scope = await session.scalar(
            select(UserRoleAssignment.id).where(
                UserRoleAssignment.user_id == profile.id,
                UserRoleAssignment.role_name.in_(["STATE_AUTHORITY", "DISTRICT_OFFICER", "EMERGENCY_OFFICER"]),
                or_(UserRoleAssignment.state_scope.is_not(None), UserRoleAssignment.district_scope.is_not(None)),
                or_(UserRoleAssignment.state_scope.is_distinct_from(payload.state_scope), UserRoleAssignment.district_scope.is_distinct_from(payload.district_scope)),
            )
        )
        if existing_scope:
            raise HTTPException(status_code=409, detail="Each account can have only one non-central command scope")
    assignment = UserRoleAssignment(user_id=profile.id, role_name=payload.role, state_scope=payload.state_scope, district_scope=payload.district_scope)
    session.add(assignment)
    await record_audit(session, user, "user.role_assigned", "user", auth_user_id, {"role": payload.role})
    await session.commit()
    return {"status": "LIVE", "userId": auth_user_id, "role": payload.role, "stateScope": assignment.state_scope, "districtScope": assignment.district_scope}

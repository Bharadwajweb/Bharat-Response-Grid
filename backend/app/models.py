from __future__ import annotations

from datetime import datetime, timezone
from uuid import UUID, uuid4

from geoalchemy2 import Geometry
from sqlalchemy import Boolean, DateTime, Float, ForeignKey, Index, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import JSONB, UUID as PGUUID
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class UserProfile(Base):
    __tablename__ = "brg_users"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    auth_user_id: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    email: Mapped[str | None] = mapped_column(String(320))
    display_name: Mapped[str | None] = mapped_column(String(160))
    email_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    last_seen_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    role_assignments: Mapped[list["UserRoleAssignment"]] = relationship(back_populates="user", cascade="all, delete-orphan")


class Role(Base):
    __tablename__ = "brg_roles"

    name: Mapped[str] = mapped_column(String(40), primary_key=True)
    description: Mapped[str] = mapped_column(String(180), nullable=False)
    assignments: Mapped[list["UserRoleAssignment"]] = relationship(back_populates="role")


class UserRoleAssignment(Base):
    __tablename__ = "brg_user_roles"
    __table_args__ = (UniqueConstraint("user_id", "role_name", "state_scope", "district_scope", name="uq_brg_user_role_scope"),)

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("brg_users.id", ondelete="CASCADE"), nullable=False, index=True)
    role_name: Mapped[str] = mapped_column(String(40), ForeignKey("brg_roles.name"), nullable=False)
    state_scope: Mapped[str | None] = mapped_column(String(100))
    district_scope: Mapped[str | None] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    user: Mapped[UserProfile] = relationship(back_populates="role_assignments")
    role: Mapped[Role] = relationship(back_populates="assignments")


class Incident(Base):
    __tablename__ = "incidents"
    __table_args__ = (Index("ix_incidents_geom", "geom", postgresql_using="gist"),)

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    reference: Mapped[str] = mapped_column(String(24), unique=True, nullable=False, index=True)
    hazard_type: Mapped[str] = mapped_column(String(40), nullable=False)
    title: Mapped[str] = mapped_column(String(180), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False, default="")
    severity: Mapped[str] = mapped_column(String(16), nullable=False)
    status: Mapped[str] = mapped_column(String(24), nullable=False, default="reported", index=True)
    location_text: Mapped[str] = mapped_column(String(240), nullable=False)
    state: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    district: Mapped[str | None] = mapped_column(String(100), index=True)
    latitude: Mapped[float | None] = mapped_column(Float)
    longitude: Mapped[float | None] = mapped_column(Float)
    geom: Mapped[object | None] = mapped_column(Geometry("POINT", srid=4326, spatial_index=False))
    reported_by: Mapped[str] = mapped_column(String(255), nullable=False)
    assigned_to: Mapped[str | None] = mapped_column(String(255), index=True)
    affected_population: Mapped[int | None] = mapped_column(Integer)
    resolution_minutes: Mapped[int | None] = mapped_column(Integer)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())
    reports: Mapped[list["CitizenReport"]] = relationship(back_populates="incident")
    missions: Mapped[list["Mission"]] = relationship(back_populates="incident")


class DisasterEvent(Base):
    __tablename__ = "disaster_events"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    incident_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("incidents.id", ondelete="SET NULL"), index=True)
    source: Mapped[str] = mapped_column(String(120), nullable=False)
    external_id: Mapped[str | None] = mapped_column(String(160), unique=True)
    event_type: Mapped[str] = mapped_column(String(40), nullable=False)
    title: Mapped[str] = mapped_column(String(180), nullable=False)
    magnitude: Mapped[float | None] = mapped_column(Float)
    depth_km: Mapped[float | None] = mapped_column(Float)
    latitude: Mapped[float | None] = mapped_column(Float)
    longitude: Mapped[float | None] = mapped_column(Float)
    geom: Mapped[object | None] = mapped_column(Geometry("POINT", srid=4326, spatial_index=False))
    observed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    raw_data: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    fetched_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())


class WeatherData(Base):
    __tablename__ = "weather_data"
    __table_args__ = (UniqueConstraint("location_key", name="uq_weather_location_key"),)

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    location_key: Mapped[str] = mapped_column(String(80), nullable=False)
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    current: Mapped[dict] = mapped_column(JSONB, nullable=False)
    hourly: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    daily: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    source: Mapped[str] = mapped_column(String(80), nullable=False)
    fetched_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)


class EarthquakeEvent(Base):
    __tablename__ = "earthquake_events"
    __table_args__ = (Index("ix_earthquake_events_geom", "geom", postgresql_using="gist"),)

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    external_id: Mapped[str] = mapped_column(String(160), unique=True, nullable=False)
    source: Mapped[str] = mapped_column(String(120), nullable=False)
    magnitude: Mapped[float | None] = mapped_column(Float)
    depth_km: Mapped[float | None] = mapped_column(Float)
    location_text: Mapped[str | None] = mapped_column(String(240))
    latitude: Mapped[float] = mapped_column(Float, nullable=False)
    longitude: Mapped[float] = mapped_column(Float, nullable=False)
    geom: Mapped[object | None] = mapped_column(Geometry("POINT", srid=4326, spatial_index=False))
    occurred_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), index=True)
    raw_data: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    fetched_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())


class RiskZone(Base):
    __tablename__ = "risk_zones"
    __table_args__ = (Index("ix_risk_zones_geom", "geom", postgresql_using="gist"),)

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    hazard_type: Mapped[str] = mapped_column(String(40), nullable=False)
    severity: Mapped[str] = mapped_column(String(16), nullable=False)
    state: Mapped[str | None] = mapped_column(String(100), index=True)
    district: Mapped[str | None] = mapped_column(String(100), index=True)
    geom: Mapped[object] = mapped_column(Geometry("POLYGON", srid=4326, spatial_index=False), nullable=False)
    source: Mapped[str] = mapped_column(String(120), nullable=False)
    properties: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())


class SafeZone(Base):
    __tablename__ = "safe_zones"
    __table_args__ = (Index("ix_safe_zones_geom", "geom", postgresql_using="gist"),)

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    state: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    district: Mapped[str | None] = mapped_column(String(100), index=True)
    status: Mapped[str] = mapped_column(String(24), nullable=False, default="open")
    capacity: Mapped[int | None] = mapped_column(Integer)
    occupancy: Mapped[int | None] = mapped_column(Integer)
    geom: Mapped[object | None] = mapped_column(Geometry("POLYGON", srid=4326, spatial_index=False))
    source: Mapped[str] = mapped_column(String(120), nullable=False)
    properties: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())


class Shelter(Base):
    __tablename__ = "shelters"
    __table_args__ = (Index("ix_shelters_geom", "geom", postgresql_using="gist"),)

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    address: Mapped[str] = mapped_column(String(240), nullable=False)
    state: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    district: Mapped[str | None] = mapped_column(String(100), index=True)
    latitude: Mapped[float | None] = mapped_column(Float)
    longitude: Mapped[float | None] = mapped_column(Float)
    geom: Mapped[object | None] = mapped_column(Geometry("POINT", srid=4326, spatial_index=False))
    capacity: Mapped[int | None] = mapped_column(Integer)
    occupancy: Mapped[int | None] = mapped_column(Integer)
    status: Mapped[str] = mapped_column(String(24), nullable=False, default="standby", index=True)
    contact_phone: Mapped[str | None] = mapped_column(String(40))
    medical_support: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    food_stock: Mapped[str | None] = mapped_column(String(24))
    water_stock: Mapped[str | None] = mapped_column(String(24))
    source: Mapped[str] = mapped_column(String(120), nullable=False, default="BRG")
    updated_by: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())


class Resource(Base):
    __tablename__ = "resources"
    __table_args__ = (Index("ix_resources_geom", "geom", postgresql_using="gist"),)

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    category: Mapped[str] = mapped_column(String(40), nullable=False)
    status: Mapped[str] = mapped_column(String(24), nullable=False, default="available", index=True)
    quantity: Mapped[int] = mapped_column(Integer, nullable=False)
    available: Mapped[int] = mapped_column(Integer, nullable=False)
    state: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    district: Mapped[str | None] = mapped_column(String(100), index=True)
    latitude: Mapped[float | None] = mapped_column(Float)
    longitude: Mapped[float | None] = mapped_column(Float)
    geom: Mapped[object | None] = mapped_column(Geometry("POINT", srid=4326, spatial_index=False))
    assigned_incident_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("incidents.id", ondelete="SET NULL"), index=True)
    updated_by: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), onupdate=func.now())


class CitizenReport(Base):
    __tablename__ = "citizen_reports"
    __table_args__ = (Index("ix_citizen_reports_geom", "geom", postgresql_using="gist"),)

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    reference: Mapped[str] = mapped_column(String(24), unique=True, nullable=False, index=True)
    report_type: Mapped[str] = mapped_column(String(40), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    location_text: Mapped[str] = mapped_column(String(240), nullable=False)
    state: Mapped[str | None] = mapped_column(String(100), index=True)
    district: Mapped[str | None] = mapped_column(String(100), index=True)
    latitude: Mapped[float | None] = mapped_column(Float)
    longitude: Mapped[float | None] = mapped_column(Float)
    geom: Mapped[object | None] = mapped_column(Geometry("POINT", srid=4326, spatial_index=False))
    status: Mapped[str] = mapped_column(String(24), nullable=False, default="received", index=True)
    reported_by: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    email_verified: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    incident_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("incidents.id", ondelete="SET NULL"), index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)
    incident: Mapped[Incident | None] = relationship(back_populates="reports")


class Mission(Base):
    __tablename__ = "missions"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    incident_id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), ForeignKey("incidents.id", ondelete="CASCADE"), index=True)
    name: Mapped[str] = mapped_column(String(160), nullable=False)
    objective: Mapped[str] = mapped_column(Text, nullable=False)
    assigned_team: Mapped[str | None] = mapped_column(String(160))
    assigned_user_id: Mapped[str | None] = mapped_column(String(255))
    status: Mapped[str] = mapped_column(String(24), nullable=False, default="planning", index=True)
    started_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_by: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())
    incident: Mapped[Incident] = relationship(back_populates="missions")


class EvacuationRoute(Base):
    __tablename__ = "evacuation_routes"
    __table_args__ = (Index("ix_evacuation_routes_geom", "geom", postgresql_using="gist"),)

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    incident_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("incidents.id", ondelete="SET NULL"), index=True)
    source_latitude: Mapped[float] = mapped_column(Float, nullable=False)
    source_longitude: Mapped[float] = mapped_column(Float, nullable=False)
    destination_latitude: Mapped[float] = mapped_column(Float, nullable=False)
    destination_longitude: Mapped[float] = mapped_column(Float, nullable=False)
    geometry: Mapped[dict] = mapped_column(JSONB, nullable=False)
    geom: Mapped[object | None] = mapped_column(Geometry("LINESTRING", srid=4326, spatial_index=False))
    distance_meters: Mapped[float] = mapped_column(Float, nullable=False)
    duration_seconds: Mapped[float] = mapped_column(Float, nullable=False)
    hazard_status: Mapped[str] = mapped_column(String(32), nullable=False)
    source: Mapped[str] = mapped_column(String(80), nullable=False)
    created_by: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now())


class Alert(Base):
    __tablename__ = "alerts"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    title: Mapped[str] = mapped_column(String(180), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    severity: Mapped[str] = mapped_column(String(16), nullable=False)
    audience: Mapped[str] = mapped_column(String(80), nullable=False)
    state_scope: Mapped[str | None] = mapped_column(String(100), index=True)
    district_scope: Mapped[str | None] = mapped_column(String(100), index=True)
    status: Mapped[str] = mapped_column(String(24), nullable=False, default="active", index=True)
    created_by: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    title: Mapped[str] = mapped_column(String(180), nullable=False)
    message: Mapped[str] = mapped_column(Text, nullable=False)
    severity: Mapped[str] = mapped_column(String(16), nullable=False)
    read_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    actor_user_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    actor_role: Mapped[str] = mapped_column(String(40), nullable=False)
    action: Mapped[str] = mapped_column(String(80), nullable=False, index=True)
    entity_type: Mapped[str] = mapped_column(String(80), nullable=False)
    entity_id: Mapped[str | None] = mapped_column(String(80), index=True)
    details: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)


class ModelPrediction(Base):
    __tablename__ = "model_predictions"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    incident_id: Mapped[UUID | None] = mapped_column(PGUUID(as_uuid=True), ForeignKey("incidents.id", ondelete="SET NULL"), index=True)
    model_name: Mapped[str] = mapped_column(String(120), nullable=False)
    model_version: Mapped[str | None] = mapped_column(String(80))
    prediction: Mapped[dict] = mapped_column(JSONB, nullable=False)
    ground_truth: Mapped[dict | None] = mapped_column(JSONB)
    metrics: Mapped[dict | None] = mapped_column(JSONB)
    status: Mapped[str] = mapped_column(String(24), nullable=False, default="recorded")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)


class SimulationRun(Base):
    __tablename__ = "simulation_runs"

    id: Mapped[UUID] = mapped_column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)
    user_id: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    scenario: Mapped[dict] = mapped_column(JSONB, nullable=False)
    result: Mapped[dict] = mapped_column(JSONB, nullable=False)
    status: Mapped[str] = mapped_column(String(24), nullable=False, default="SIMULATION")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False, server_default=func.now(), index=True)

from __future__ import annotations

from typing import Literal
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


SeverityValue = Literal["critical", "high", "medium", "low"]
IncidentState = Literal["reported", "verified", "responding", "contained", "resolved"]


def _clean_text(value: str) -> str:
    return " ".join(value.split())


class IncidentCreate(BaseModel):
    hazard_type: str = Field(min_length=2, max_length=40)
    title: str = Field(min_length=3, max_length=180)
    description: str = Field(default="", max_length=5000)
    severity: SeverityValue
    location_text: str = Field(min_length=2, max_length=240)
    state: str = Field(min_length=2, max_length=100)
    district: str | None = Field(default=None, max_length=100)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    affected_population: int | None = Field(default=None, ge=0, le=100_000_000)

    @field_validator("hazard_type", "title", "description", "location_text", "state", "district")
    @classmethod
    def normalize_text(cls, value: str | None) -> str | None:
        return _clean_text(value) if value is not None else None

    @model_validator(mode="after")
    def validate_coordinate_pair(self):
        if (self.latitude is None) != (self.longitude is None):
            raise ValueError("latitude and longitude must be provided together")
        return self


class IncidentUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str | None = Field(default=None, min_length=3, max_length=180)
    description: str | None = Field(default=None, max_length=5000)
    severity: SeverityValue | None = None
    status: IncidentState | None = None
    location_text: str | None = Field(default=None, min_length=2, max_length=240)
    state: str | None = Field(default=None, min_length=2, max_length=100)
    district: str | None = Field(default=None, max_length=100)
    affected_population: int | None = Field(default=None, ge=0, le=100_000_000)


class ShelterCreate(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    address: str = Field(min_length=3, max_length=240)
    state: str = Field(min_length=2, max_length=100)
    district: str | None = Field(default=None, max_length=100)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)
    capacity: int | None = Field(default=None, ge=0, le=1_000_000)
    occupancy: int | None = Field(default=None, ge=0, le=1_000_000)
    status: Literal["active", "full", "closed", "standby"] = "standby"
    contact_phone: str | None = Field(default=None, max_length=40)
    medical_support: bool = False
    food_stock: Literal["adequate", "low", "critical", "none"] | None = None
    water_stock: Literal["adequate", "low", "critical", "none"] | None = None

    @model_validator(mode="after")
    def validate_capacity(self):
        if self.capacity is not None and self.occupancy is not None and self.occupancy > self.capacity:
            raise ValueError("occupancy cannot exceed capacity")
        if (self.latitude is None) != (self.longitude is None):
            raise ValueError("latitude and longitude must be provided together")
        return self


class ShelterUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=160)
    address: str | None = Field(default=None, min_length=3, max_length=240)
    status: Literal["active", "full", "closed", "standby"] | None = None
    capacity: int | None = Field(default=None, ge=0, le=1_000_000)
    occupancy: int | None = Field(default=None, ge=0, le=1_000_000)
    contact_phone: str | None = Field(default=None, max_length=40)
    medical_support: bool | None = None
    food_stock: Literal["adequate", "low", "critical", "none"] | None = None
    water_stock: Literal["adequate", "low", "critical", "none"] | None = None


class ResourceCreate(BaseModel):
    name: str = Field(min_length=2, max_length=160)
    category: Literal["medical", "vehicle", "equipment", "personnel", "supply"]
    quantity: int = Field(ge=0, le=10_000_000)
    available: int = Field(ge=0, le=10_000_000)
    state: str = Field(min_length=2, max_length=100)
    district: str | None = Field(default=None, max_length=100)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)

    @model_validator(mode="after")
    def validate_resource(self):
        if self.available > self.quantity:
            raise ValueError("available quantity cannot exceed total quantity")
        if (self.latitude is None) != (self.longitude is None):
            raise ValueError("latitude and longitude must be provided together")
        return self


class AlertCreate(BaseModel):
    title: str = Field(min_length=3, max_length=180)
    message: str = Field(min_length=3, max_length=5000)
    severity: SeverityValue
    audience: Literal["public", "staff", "state", "district"] = "staff"
    state_scope: str | None = Field(default=None, max_length=100)
    district_scope: str | None = Field(default=None, max_length=100)

    @model_validator(mode="after")
    def validate_audience_scope(self):
        if self.audience in {"state", "district"} and not self.state_scope:
            raise ValueError("state and district alerts require a state scope")
        if self.audience == "district" and not self.district_scope:
            raise ValueError("district alerts require a district scope")
        if self.district_scope and not self.state_scope:
            raise ValueError("district scope requires a state scope")
        return self


class CitizenReportCreate(BaseModel):
    report_type: str = Field(min_length=2, max_length=40)
    description: str = Field(min_length=10, max_length=5000)
    location_text: str = Field(min_length=3, max_length=240)
    state: str | None = Field(default=None, max_length=100)
    district: str | None = Field(default=None, max_length=100)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)

    @field_validator("report_type", "description", "location_text", "state", "district")
    @classmethod
    def normalize_text(cls, value: str | None) -> str | None:
        return _clean_text(value) if value is not None else None

    @model_validator(mode="after")
    def validate_coordinate_pair(self):
        if (self.latitude is None) != (self.longitude is None):
            raise ValueError("latitude and longitude must be provided together")
        return self


class SimulationCreate(BaseModel):
    disaster_type: str = Field(min_length=2, max_length=40)
    location: str = Field(min_length=3, max_length=240)
    severity: SeverityValue
    wind_direction_degrees: float | None = Field(default=None, ge=0, le=360)
    wind_speed_kph: float | None = Field(default=None, ge=0, le=500)
    rainfall_mm: float | None = Field(default=None, ge=0, le=2000)
    population: int | None = Field(default=None, ge=0, le=100_000_000)
    latitude: float | None = Field(default=None, ge=-90, le=90)
    longitude: float | None = Field(default=None, ge=-180, le=180)

    @model_validator(mode="after")
    def validate_coordinate_pair(self):
        if (self.latitude is None) != (self.longitude is None):
            raise ValueError("latitude and longitude must be provided together")
        return self


class RiskAssessmentInput(BaseModel):
    rainfall_mm_24h: float | None = Field(default=None, ge=0, le=5000)
    wind_speed_kph: float | None = Field(default=None, ge=0, le=1000)
    earthquake_magnitude: float | None = Field(default=None, ge=0, le=10)
    flood_depth_m: float | None = Field(default=None, ge=0, le=100)
    population_exposure: int | None = Field(default=None, ge=0, le=100_000_000)
    source_timestamps: dict[str, str] = Field(default_factory=dict)


class RoleAssignmentCreate(BaseModel):
    role: Literal["CENTRAL_AUTHORITY", "STATE_AUTHORITY", "DISTRICT_OFFICER", "EMERGENCY_OFFICER", "CITIZEN"]
    state_scope: str | None = Field(default=None, max_length=100)
    district_scope: str | None = Field(default=None, max_length=100)

    @model_validator(mode="after")
    def validate_scope(self):
        if self.role == "STATE_AUTHORITY" and not self.state_scope:
            raise ValueError("state authority assignments require a state scope")
        if self.role == "DISTRICT_OFFICER" and (not self.state_scope or not self.district_scope):
            raise ValueError("district officer assignments require state and district scopes")
        if self.role == "EMERGENCY_OFFICER" and not self.state_scope:
            raise ValueError("emergency officer assignments require a state scope")
        if self.district_scope and not self.state_scope:
            raise ValueError("district scope requires a state scope")
        return self


class IncidentAssignment(BaseModel):
    assigned_to: str = Field(min_length=1, max_length=255)


class MissionCreate(BaseModel):
    incident_id: UUID
    name: str = Field(min_length=3, max_length=160)
    objective: str = Field(min_length=5, max_length=3000)
    assigned_team: str | None = Field(default=None, max_length=160)
    assigned_user_id: str | None = Field(default=None, max_length=255)


class RouteRequest(BaseModel):
    origin_latitude: float = Field(ge=-90, le=90)
    origin_longitude: float = Field(ge=-180, le=180)
    destination_latitude: float = Field(ge=-90, le=90)
    destination_longitude: float = Field(ge=-180, le=180)
    incident_id: UUID | None = None

from __future__ import annotations

import json
import math
import os
from datetime import datetime, timedelta, timezone
from typing import Annotated, Any
from uuid import uuid4

import httpx
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.encoders import jsonable_encoder
from geoalchemy2.elements import WKTElement
from sqlalchemy import func, select, text
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.ext.asyncio import AsyncSession

from .audit import record_audit
from .database import get_db, get_optional_db
from .models import EarthquakeEvent, EvacuationRoute, Incident, ModelPrediction, Resource, RiskZone, SafeZone, Shelter, SimulationRun, WeatherData
from .schemas import RiskAssessmentInput, RouteRequest, SimulationCreate
from .security import AuthenticatedUser, STAFF_ROLES, get_current_user, require_roles
from .services.earthquakes import get_latest_earthquakes
from .services.weather import get_current_weather
from .source_state import update_source

router = APIRouter(prefix="/api")
INDIA_BOUNDS = (5.5, 37.5, 67.0, 98.0)
OSRM_BASE_URL = os.getenv("OSRM_BASE_URL", "https://router.project-osrm.org").rstrip("/")


def calculate_risk_score(inputs: RiskAssessmentInput) -> dict[str, Any]:
    weights = {"rainfall_mm_24h": 0.30, "wind_speed_kph": 0.25, "earthquake_magnitude": 0.25, "flood_depth_m": 0.20}
    normalizers = {
        "rainfall_mm_24h": lambda value: min(value / 150 * 100, 100),
        "wind_speed_kph": lambda value: min(value / 120 * 100, 100),
        "earthquake_magnitude": lambda value: min(max(value - 2, 0) / 5 * 100, 100),
        "flood_depth_m": lambda value: min(value / 2 * 100, 100),
    }
    present = [key for key in weights if getattr(inputs, key) is not None]
    coverage = sum(weights[key] for key in present)
    if coverage < 0.5:
        return {
            "status": "INSUFFICIENT_DATA",
            "score": None,
            "classification": None,
            "confidenceCoveragePercent": round(coverage * 100),
            "availableFactors": present,
            "missingFactors": [key for key in weights if key not in present],
            "populationExposure": inputs.population_exposure,
            "sourceTimestamps": inputs.source_timestamps,
            "method": "Uncalibrated deterministic screening rule; not an official warning or dispatch command.",
        }
    score = sum(weights[key] * normalizers[key](getattr(inputs, key)) for key in present) / coverage
    classification = "critical" if score >= 80 else "high" if score >= 60 else "medium" if score >= 35 else "low"
    return {
        "status": "SIMULATION",
        "score": round(score, 1),
        "classification": classification,
        "confidenceCoveragePercent": round(coverage * 100),
        "availableFactors": present,
        "missingFactors": [key for key in weights if key not in present],
        "populationExposure": inputs.population_exposure,
        "sourceTimestamps": inputs.source_timestamps,
        "method": "Uncalibrated deterministic screening rule; not an official warning or dispatch command.",
    }


def _location_key(latitude: float, longitude: float) -> str:
    return f"{latitude:.2f}:{longitude:.2f}"


def _weather_payload(row: WeatherData, status: str, fallback_reason: str | None = None) -> dict[str, Any]:
    age_seconds = max(0, int((datetime.now(timezone.utc) - row.fetched_at).total_seconds()))
    data = {**row.current, "latitude": row.latitude, "longitude": row.longitude, "hourly": row.hourly, "daily": row.daily}
    return {
        "data": data,
        "status": status,
        "source": row.source,
        "updated_at": row.fetched_at.isoformat(),
        "cache_age_seconds": age_seconds,
        "fallback_reason": fallback_reason,
    }


@router.get("/weather/current")
async def weather_current(
    session: Annotated[AsyncSession | None, Depends(get_optional_db)],
    latitude: float = Query(default=20.5937, ge=-90, le=90),
    longitude: float = Query(default=78.9629, ge=-180, le=180),
):
    result = await get_current_weather(latitude, longitude)
    if result["status"] == "LIVE":
        update_source("weather", "ONLINE")
        if session is not None:
            try:
                key = _location_key(latitude, longitude)
                weather_data = result["data"]
                current = {key: value for key, value in weather_data.items() if key not in {"hourly", "daily"}}
                statement = insert(WeatherData).values(
                    location_key=key, latitude=weather_data["latitude"], longitude=weather_data["longitude"],
                    current=current, hourly=weather_data["hourly"], daily=weather_data["daily"],
                    source=result["source"], fetched_at=datetime.now(timezone.utc),
                ).on_conflict_do_update(
                    index_elements=[WeatherData.location_key],
                    set_={"latitude": weather_data["latitude"], "longitude": weather_data["longitude"], "current": current, "hourly": weather_data["hourly"], "daily": weather_data["daily"], "source": result["source"], "fetched_at": datetime.now(timezone.utc)},
                )
                await session.execute(statement)
                await session.commit()
            except SQLAlchemyError:
                await session.rollback()
        return result

    update_source("weather", "DEGRADED", result.get("fallback_reason"))
    if session is not None:
        try:
            cached = await session.scalar(select(WeatherData).where(WeatherData.location_key == _location_key(latitude, longitude)))
            if cached:
                return _weather_payload(cached, "CACHED", result.get("fallback_reason"))
        except SQLAlchemyError:
            await session.rollback()
    return {**result, "status": "OFFLINE", "data": None}


@router.get("/earthquakes")
async def earthquakes_latest(
    session: Annotated[AsyncSession | None, Depends(get_optional_db)],
    region: str = Query(default="india", max_length=40),
    min_magnitude: float = Query(default=0, ge=0, le=10),
    limit: int = Query(default=100, ge=1, le=500),
):
    result = await get_latest_earthquakes()
    if result["status"] == "LIVE":
        update_source("earthquakes", "ONLINE")
        features = [item for item in result["data"] if item.get("magnitude") is None or item["magnitude"] >= min_magnitude]
        if region.lower() == "india":
            south, north, west, east = INDIA_BOUNDS
            features = [item for item in features if south <= item["latitude"] <= north and west <= item["longitude"] <= east]
        features = features[:limit]
        if session is not None:
            try:
                for item in result["data"]:
                    latitude_value = item["latitude"]
                    longitude_value = item["longitude"]
                    statement = insert(EarthquakeEvent).values(
                        external_id=item["id"], source=result["source"], magnitude=item["magnitude"],
                        depth_km=item["depthKm"], location_text=item["place"], latitude=latitude_value,
                        longitude=longitude_value, geom=WKTElement(f"POINT({longitude_value} {latitude_value})", srid=4326),
                        occurred_at=datetime.fromisoformat(item["occurredAt"]) if item["occurredAt"] else None,
                        raw_data={"url": item.get("url")}, fetched_at=datetime.now(timezone.utc),
                    ).on_conflict_do_update(
                        index_elements=[EarthquakeEvent.external_id],
                        set_={"magnitude": item["magnitude"], "depth_km": item["depthKm"], "location_text": item["place"], "latitude": latitude_value, "longitude": longitude_value, "geom": WKTElement(f"POINT({longitude_value} {latitude_value})", srid=4326), "occurred_at": datetime.fromisoformat(item["occurredAt"]) if item["occurredAt"] else None, "fetched_at": datetime.now(timezone.utc)},
                    )
                    await session.execute(statement)
                await session.commit()
            except SQLAlchemyError:
                await session.rollback()
        return {**result, "data": features, "status": "LIVE" if features else "NO_DATA"}

    update_source("earthquakes", "DEGRADED", result.get("fallback_reason"))
    if session is not None:
        try:
            statement = select(EarthquakeEvent).order_by(EarthquakeEvent.occurred_at.desc()).limit(limit)
            if region.lower() == "india":
                south, north, west, east = INDIA_BOUNDS
                statement = statement.where(EarthquakeEvent.latitude.between(south, north), EarthquakeEvent.longitude.between(west, east))
            statement = statement.where((EarthquakeEvent.magnitude.is_(None)) | (EarthquakeEvent.magnitude >= min_magnitude))
            cached = (await session.scalars(statement)).all()
            if cached:
                rows = [{"id": item.external_id, "magnitude": item.magnitude, "depthKm": item.depth_km, "place": item.location_text, "occurredAt": item.occurred_at.isoformat() if item.occurred_at else None, "latitude": item.latitude, "longitude": item.longitude, "url": item.raw_data.get("url"), "source": item.source} for item in cached]
                return {"data": rows, "status": "CACHED", "source": "USGS Earthquake Hazards Program", "updated_at": cached[0].fetched_at.isoformat(), "fallback_reason": result.get("fallback_reason")}
        except SQLAlchemyError:
            await session.rollback()
    return {**result, "status": "OFFLINE", "data": []}


@router.post("/risk/score")
async def risk_score(payload: RiskAssessmentInput, user: Annotated[AuthenticatedUser, Depends(get_current_user)]):
    result = calculate_risk_score(payload)
    result["requestedBy"] = user.id
    return {"data": result, "status": result["status"], "source": "BRG uncalibrated rules"}


@router.post("/decisions/recommendation")
async def decision_recommendation(
    payload: RiskAssessmentInput,
    user: Annotated[AuthenticatedUser, Depends(require_roles(*STAFF_ROLES))],
    session: Annotated[AsyncSession | None, Depends(get_optional_db)],
):
    result = calculate_risk_score(payload)
    if result["score"] is None:
        return {"data": {"status": "INSUFFICIENT_DATA", "recommendation": None, "assessment": result}, "status": "INSUFFICIENT_DATA", "source": "BRG uncalibrated rules"}
    result["recommendation"] = "Review the current observations with the duty officer. This uncalibrated score does not authorize evacuation or dispatch."
    result["decisionStatus"] = "HUMAN_REVIEW_REQUIRED"
    if session is not None:
        try:
            await record_audit(session, user, "decision.generated", "risk_assessment", None, {"classification": result["classification"], "score": result["score"]})
            await session.commit()
        except SQLAlchemyError:
            await session.rollback()
    return {"data": result, "status": "SIMULATION", "source": "BRG uncalibrated rules"}


async def _route_risk(session: AsyncSession | None, geometry: dict[str, Any]) -> tuple[int | None, str | None]:
    if session is None:
        return None, None
    encoded = json.dumps(geometry, separators=(",", ":"))
    try:
        coverage = await session.scalar(select(func.count()).select_from(RiskZone))
        if not coverage:
            return 0, "NO_CONFIGURED_RISK_ZONES"
        result = await session.execute(
            text("SELECT count(*) AS intersections, "
                 "count(*) FILTER (WHERE severity = 'critical') AS critical "
                 "FROM risk_zones "
                 "WHERE ST_Intersects(geom, ST_SetSRID(ST_GeomFromGeoJSON(:route_geojson), 4326))"),
            {"route_geojson": encoded},
        )
        row = result.mappings().one()
        return int(row["intersections"]), "CRITICAL_ZONE_INTERSECTION" if row["critical"] else "CONFIGURED_ZONES_CHECKED"
    except SQLAlchemyError:
        await session.rollback()
        return None, None


@router.post("/routing/route")
async def create_route(
    payload: RouteRequest,
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession | None, Depends(get_optional_db)],
):
    for coordinate, lower, upper, label in (
        (payload.origin_latitude, -90, 90, "origin latitude"),
        (payload.destination_latitude, -90, 90, "destination latitude"),
        (payload.origin_longitude, -180, 180, "origin longitude"),
        (payload.destination_longitude, -180, 180, "destination longitude"),
    ):
        if not lower <= coordinate <= upper:
            raise HTTPException(status_code=422, detail=f"Invalid {label}")
    path = f"{OSRM_BASE_URL}/route/v1/driving/{payload.origin_longitude},{payload.origin_latitude};{payload.destination_longitude},{payload.destination_latitude}"
    try:
        async with httpx.AsyncClient(timeout=12, follow_redirects=False) as client:
            response = await client.get(path, params={"overview": "full", "geometries": "geojson", "alternatives": "true", "steps": "false"})
            response.raise_for_status()
            body = response.json()
        candidates = body.get("routes") or []
        if body.get("code") != "Ok" or not candidates:
            raise ValueError("No route returned")
        scored = []
        for candidate in candidates:
            geometry = candidate.get("geometry")
            if not isinstance(geometry, dict) or geometry.get("type") != "LineString":
                continue
            intersections, assessment = await _route_risk(session, geometry)
            exposure_penalty = intersections if intersections is not None else 0
            scored.append((exposure_penalty, candidate.get("distance", float("inf")), candidate, intersections, assessment))
        if not scored:
            raise ValueError("Provider returned no usable route geometry")
        _, _, chosen, intersections, hazard_status = min(scored, key=lambda value: (value[0], value[1]))
        update_source("routing", "ONLINE")
        route_id = uuid4()
        persistence_status = "OFFLINE"
        if session is not None:
            try:
                geometry = chosen["geometry"]
                coordinates = geometry["coordinates"]
                line = ",".join(f"{float(point[0])} {float(point[1])}" for point in coordinates)
                incident_id = None
                if payload.incident_id:
                    incident = await session.get(Incident, payload.incident_id)
                    if incident is None:
                        raise HTTPException(status_code=404, detail="Incident was not found")
                    if incident.state and user.state_scope and incident.state != user.state_scope and not user.has_role("CENTRAL_AUTHORITY"):
                        raise HTTPException(status_code=403, detail="Incident is outside your assigned scope")
                    incident_id = incident.id
                route = EvacuationRoute(
                    id=route_id, incident_id=incident_id,
                    source_latitude=payload.origin_latitude, source_longitude=payload.origin_longitude,
                    destination_latitude=payload.destination_latitude, destination_longitude=payload.destination_longitude,
                    geometry=geometry, geom=WKTElement(f"LINESTRING({line})", srid=4326),
                    distance_meters=chosen["distance"], duration_seconds=chosen["duration"],
                    hazard_status=hazard_status or "NOT_ASSESSED", source="OSRM / OpenStreetMap",
                    created_by=user.id,
                )
                session.add(route)
                await record_audit(session, user, "evacuation.route_generated", "evacuation_route", str(route_id), {"hazardStatus": hazard_status or "NOT_ASSESSED"})
                await session.commit()
                persistence_status = "LIVE"
            except HTTPException:
                raise
            except SQLAlchemyError:
                await session.rollback()
                persistence_status = "OFFLINE"
        return {
            "data": {
                "id": str(route_id), "geometry": chosen["geometry"],
                "distanceMeters": chosen["distance"], "durationSeconds": chosen["duration"],
                "riskZoneIntersections": intersections, "hazardAssessment": hazard_status or "NOT_ASSESSED",
                "hazardCoverage": "CONFIGURED_RISK_ZONES_ONLY" if hazard_status else "UNAVAILABLE",
                "source": "OSRM / OpenStreetMap", "persistence": persistence_status,
            },
            "status": "LIVE", "source": "OSRM / OpenStreetMap",
        }
    except (httpx.HTTPError, ValueError, KeyError, TypeError):
        update_source("routing", "DEGRADED", "OSRM did not return a usable route.")
        raise HTTPException(status_code=503, detail="Routing provider is unavailable or returned no route")


def _scope_filters(model: Any, user: AuthenticatedUser) -> list[Any]:
    if user.has_role("CENTRAL_AUTHORITY"):
        return []
    if user.has_role("DISTRICT_OFFICER"):
        if not user.state_scope or not user.district_scope:
            raise HTTPException(status_code=403, detail="District scope has not been assigned")
        return [model.state == user.state_scope, model.district == user.district_scope]
    if user.has_role("STATE_AUTHORITY", "EMERGENCY_OFFICER"):
        if not user.state_scope:
            raise HTTPException(status_code=403, detail="State scope has not been assigned")
        filters = [model.state == user.state_scope]
        if user.has_role("EMERGENCY_OFFICER") and hasattr(model, "assigned_to"):
            filters.append(model.assigned_to == user.id)
        return filters
    raise HTTPException(status_code=403, detail="Operational staff access is required")


@router.get("/map/features")
async def map_features(
    user: Annotated[AuthenticatedUser, Depends(require_roles(*STAFF_ROLES))],
    session: Annotated[AsyncSession, Depends(get_db)],
    limit: int = Query(default=500, ge=1, le=1000),
):
    features: list[dict[str, Any]] = []
    incident_filters = _scope_filters(Incident, user)
    incident_statement = select(Incident).where(Incident.latitude.is_not(None), Incident.longitude.is_not(None), *incident_filters).order_by(Incident.created_at.desc()).limit(limit)
    incidents = (await session.scalars(incident_statement)).all()
    for item in incidents:
        features.append({"type": "Feature", "id": str(item.id), "geometry": {"type": "Point", "coordinates": [item.longitude, item.latitude]}, "properties": {"kind": "incident", "reference": item.reference, "title": item.title, "severity": item.severity, "status": item.status, "state": item.state, "district": item.district, "assignedTo": item.assigned_to}})

    shelter_filters = _scope_filters(Shelter, user)
    shelters = (await session.scalars(select(Shelter).where(Shelter.latitude.is_not(None), Shelter.longitude.is_not(None), *shelter_filters).limit(limit))).all()
    for item in shelters:
        features.append({"type": "Feature", "id": str(item.id), "geometry": {"type": "Point", "coordinates": [item.longitude, item.latitude]}, "properties": {"kind": "shelter", "title": item.name, "status": item.status, "capacity": item.capacity, "occupancy": item.occupancy, "state": item.state, "district": item.district}})

    resource_filters = _scope_filters(Resource, user)
    resources = (await session.scalars(select(Resource).where(Resource.latitude.is_not(None), Resource.longitude.is_not(None), *resource_filters).limit(limit))).all()
    for item in resources:
        features.append({"type": "Feature", "id": str(item.id), "geometry": {"type": "Point", "coordinates": [item.longitude, item.latitude]}, "properties": {"kind": "resource", "title": item.name, "category": item.category, "status": item.status, "available": item.available, "state": item.state, "district": item.district}})

    risk_filters = _scope_filters(RiskZone, user)
    risk_rows = (await session.execute(select(RiskZone.id, RiskZone.name, RiskZone.hazard_type, RiskZone.severity, RiskZone.state, RiskZone.district, func.ST_AsGeoJSON(RiskZone.geom).label("geometry")).where(*risk_filters).limit(limit))).mappings().all()
    for item in risk_rows:
        if item["geometry"]:
            features.append({"type": "Feature", "id": str(item["id"]), "geometry": json.loads(item["geometry"]), "properties": {"kind": "risk_zone", "title": item["name"], "hazardType": item["hazard_type"], "severity": item["severity"], "state": item["state"], "district": item["district"]}})

    earthquakes = (await session.scalars(select(EarthquakeEvent).where(EarthquakeEvent.latitude.between(*INDIA_BOUNDS[:2]), EarthquakeEvent.longitude.between(*INDIA_BOUNDS[2:])).order_by(EarthquakeEvent.occurred_at.desc()).limit(100))).all()
    for item in earthquakes:
        features.append({"type": "Feature", "id": item.external_id, "geometry": {"type": "Point", "coordinates": [item.longitude, item.latitude]}, "properties": {"kind": "earthquake", "magnitude": item.magnitude, "depthKm": item.depth_km, "title": item.location_text, "occurredAt": item.occurred_at}})
    return {"data": {"type": "FeatureCollection", "features": features}, "status": "LIVE" if features else "NO_DATA", "source": "BRG PostgreSQL/PostGIS"}


@router.get("/analytics/summary")
async def analytics_summary(
    user: Annotated[AuthenticatedUser, Depends(require_roles(*STAFF_ROLES))],
    session: Annotated[AsyncSession, Depends(get_db)],
):
    incident_scope = _scope_filters(Incident, user)
    if user.has_role("EMERGENCY_OFFICER"):
        incident_scope.append(Incident.assigned_to == user.id)
    incident_counts = (await session.execute(select(Incident.hazard_type, func.count(Incident.id)).where(*incident_scope).group_by(Incident.hazard_type))).all()
    total = sum(int(count) for _, count in incident_counts)
    active = await session.scalar(select(func.count()).select_from(Incident).where(*incident_scope, Incident.status.in_(["reported", "verified", "responding", "contained"])))
    resolved = await session.scalar(select(func.count()).select_from(Incident).where(*incident_scope, Incident.status == "resolved"))
    avg_response = await session.scalar(select(func.avg(Incident.resolution_minutes)).where(*incident_scope, Incident.resolution_minutes.is_not(None)))
    shelter_scope = _scope_filters(Shelter, user)
    shelter_totals = (await session.execute(select(func.sum(Shelter.capacity), func.sum(Shelter.occupancy)).where(*shelter_scope, Shelter.status.in_(["active", "full"])))).one()
    capacity, occupancy = shelter_totals
    data = {
        "incidentCount": total,
        "activeIncidents": int(active or 0),
        "resolvedIncidents": int(resolved or 0),
        "disastersByType": [{"type": name, "count": int(count)} for name, count in incident_counts],
        "averageResolutionMinutes": round(float(avg_response), 1) if avg_response is not None else None,
        "shelterCapacity": int(capacity) if capacity is not None else None,
        "shelterOccupancy": int(occupancy) if occupancy is not None else None,
        "shelterUtilizationPercent": round(int(occupancy) / int(capacity) * 100, 1) if capacity and occupancy is not None else None,
        "populationAffected": None,
        "dataCompleteness": "INSUFFICIENT_DATA" if total == 0 else "PARTIAL",
    }
    return {"data": data, "status": "LIVE" if total else "INSUFFICIENT_DATA", "source": "BRG PostgreSQL"}


@router.get("/research/metrics")
async def research_metrics(
    user: Annotated[AuthenticatedUser, Depends(require_roles(*STAFF_ROLES))],
    session: Annotated[AsyncSession, Depends(get_db)],
):
    metric_rows = (await session.scalars(select(ModelPrediction.metrics).where(ModelPrediction.metrics.is_not(None)))).all()
    collected: dict[str, list[float]] = {}
    for row in metric_rows:
        if isinstance(row, dict):
            for key, value in row.items():
                if isinstance(value, (int, float)) and math.isfinite(float(value)):
                    collected.setdefault(key, []).append(float(value))
    if not collected:
        return {"data": {"experiments": 0, "metrics": {}}, "status": "NO_EXPERIMENT_DATA", "source": "BRG research records"}
    metrics = {key: {"mean": round(sum(values) / len(values), 4), "samples": len(values)} for key, values in collected.items()}
    return {"data": {"experiments": len(metric_rows), "metrics": metrics}, "status": "LIVE", "source": "BRG research records"}


def _haversine_km(latitude_a: float, longitude_a: float, latitude_b: float, longitude_b: float) -> float:
    latitude_delta = math.radians(latitude_b - latitude_a)
    longitude_delta = math.radians(longitude_b - longitude_a)
    value = math.sin(latitude_delta / 2) ** 2 + math.cos(math.radians(latitude_a)) * math.cos(math.radians(latitude_b)) * math.sin(longitude_delta / 2) ** 2
    return 6371 * 2 * math.atan2(math.sqrt(value), math.sqrt(max(0.0, 1 - value)))


@router.post("/simulation/runs")
async def create_simulation_run(
    payload: SimulationCreate,
    user: Annotated[AuthenticatedUser, Depends(require_roles(*STAFF_ROLES))],
    session: Annotated[AsyncSession, Depends(get_db)],
):
    nearby_shelters = []
    if payload.latitude is not None and payload.longitude is not None:
        shelter_scope = _scope_filters(Shelter, user)
        shelters = (await session.scalars(select(Shelter).where(*shelter_scope, Shelter.status.in_(["active", "standby"]), Shelter.latitude.is_not(None), Shelter.longitude.is_not(None)))).all()
        for item in shelters:
            distance_km = _haversine_km(payload.latitude, payload.longitude, item.latitude, item.longitude)
            nearby_shelters.append({"id": str(item.id), "name": item.name, "distanceKm": round(distance_km, 2), "capacity": item.capacity, "occupancy": item.occupancy})
        nearby_shelters.sort(key=lambda shelter: shelter["distanceKm"])
    scenario = payload.model_dump()
    result = {
        "status": "SIMULATION",
        "method": "Scenario record only; no validated hazard-propagation model is configured.",
        "impactZone": None,
        "hazardMovement": None,
        "populationAffected": payload.population,
        "populationSource": "User input only; no independent exposure model was run." if payload.population is not None else None,
        "recommendedDirection": None,
        "route": None,
        "nearbyShelters": nearby_shelters[:10],
    }
    run = SimulationRun(user_id=user.id, scenario=scenario, result=result, status="SIMULATION")
    session.add(run)
    await record_audit(session, user, "simulation.created", "simulation_run", None, {"disasterType": payload.disaster_type})
    await session.commit()
    await session.refresh(run)
    return {"data": {"id": str(run.id), "scenario": scenario, "result": result, "createdAt": run.created_at}, "status": "SIMULATION", "source": "BRG scenario runner"}


@router.get("/simulation/runs")
async def list_simulation_runs(
    user: Annotated[AuthenticatedUser, Depends(get_current_user)],
    session: Annotated[AsyncSession, Depends(get_db)],
    limit: int = Query(default=50, ge=1, le=100),
):
    rows = (await session.scalars(select(SimulationRun).where(SimulationRun.user_id == user.id).order_by(SimulationRun.created_at.desc()).limit(limit))).all()
    return {"data": [{"id": str(row.id), "scenario": row.scenario, "result": row.result, "status": "SIMULATION", "createdAt": row.created_at} for row in rows], "status": "SIMULATION" if rows else "NO_DATA", "source": "BRG scenario runner"}

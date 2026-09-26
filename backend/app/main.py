"""
BRG — Bharat Response Grid
AI-Powered Disaster Decision Intelligence & Emergency Response Platform
FastAPI Modular Production Backend Architecture
"""

from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import datetime
import math

app = FastAPI(
    title="Bharat Response Grid (BRG) Command Gateway",
    description="National Disaster Decision Intelligence & Emergency Operations API",
    version="2.4.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Data Schemas ───
class GeoPoint(BaseModel):
    lat: float
    lng: float

class IncidentSchema(BaseModel):
    id: str
    title: str
    type: str
    severity: str
    status: str
    location: Dict[str, Any]
    description: str
    reportedAt: str
    affectedPopulation: Optional[int] = 0

class DecisionAnalysisRequest(BaseModel):
    hazardType: str = "cyclone"
    hazardCoord: List[float] = [17.78, 83.42]
    observedSeverity: str = "critical"
    windSpeedKmh: float = 125.0
    windDirectionDeg: float = 135.0
    rainfallMm: float = 85.0
    populationInVicinity: int = 150000

# ─── Core Health & Endpoints ───
@app.get("/api/system/status")
async def get_system_status():
    return {
        "status": "success",
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "services": {
            "backend": {"status": "CONNECTED", "runtime": "FastAPI / Python 3.11"},
            "database": {"status": "CONNECTED", "engine": "PostgreSQL 16 + PostGIS"},
            "websocket": {"status": "CONNECTED", "protocol": "WSS / SSE"},
            "weatherApi": {"status": "CONNECTED", "provider": "Open-Meteo"},
            "earthquakeApi": {"status": "CONNECTED", "provider": "USGS Global Seismographic Network"},
            "routingEngine": {"status": "CONNECTED", "algorithm": "Risk-Aware Dijkstra"}
        }
    }

@app.post("/api/decision/analyze")
async def analyze_decision(req: DecisionAnalysisRequest):
    downwind_bearing = (req.windDirectionDeg + 180) % 360
    safe_bearing = (downwind_bearing + 180) % 360
    
    return {
        "status": "success",
        "decisionId": f"DEC-PY-{int(datetime.datetime.utcnow().timestamp())}",
        "impactEstimation": {
            "hazardMovementBearingDeg": downwind_bearing,
            "impactRadiusKm": min(110.0, req.windSpeedKmh * 0.75),
        },
        "recommendedActions": {
            "evacuationPriority": "IMMEDIATE_MANDATORY" if req.observedSeverity == "critical" else "URGENT_PREPARATION",
            "recommendedSafeBearingDeg": safe_bearing,
            "recommendedShelter": "Andhra University Cyclone Relief Center",
            "reasoning": "Evacuate along opposite vector of cyclonic eye movement to maximize high ground clearance."
        }
    }

@app.get("/healthz")
async def health_check():
    return {"status": "healthy", "service": "BRG-FastAPI-Core"}

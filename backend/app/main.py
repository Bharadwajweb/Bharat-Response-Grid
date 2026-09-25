from datetime import datetime, timezone
from fastapi import FastAPI, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from .services.weather import get_current_weather
from .services.earthquakes import get_latest_earthquakes
from .services.decisions import build_decision

app = FastAPI(title="BRG Decision Support API", version="1.0.0")
app.add_middleware(CORSMiddleware, allow_origins=["http://localhost:5173"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.get("/api/health")
def health():
    return {"status": "ONLINE", "service": "BRG API", "updated_at": datetime.now(timezone.utc).isoformat()}

@app.get("/api/system/status")
def system_status():
    return {"backend": "ONLINE", "database": "CONFIGURATION_REQUIRED", "weather": "LIVE_OR_OFFLINE", "earthquake": "LIVE_OR_OFFLINE", "websocket": "READY", "updated_at": datetime.now(timezone.utc).isoformat()}

@app.get("/api/weather/current")
async def weather_current(latitude: float = 20.5937, longitude: float = 78.9629):
    return await get_current_weather(latitude, longitude)

@app.get("/api/earthquakes/latest")
async def earthquakes_latest():
    return await get_latest_earthquakes()

@app.get("/api/decisions/demo")
def decision_demo():
    return build_decision()

@app.websocket("/api/events")
async def events(websocket: WebSocket):
    await websocket.accept()
    await websocket.send_json({"type": "connected", "source": "BRG", "status": "LIVE"})
    try:
        while True:
            await websocket.receive_text()
    except Exception:
        await websocket.close()

@app.get("/api/incidents")
def incidents():
    return {"data": [], "status": "OFFLINE", "source": "BRG PostgreSQL/PostGIS", "message": "Database integration is not configured."}

@app.get("/api/shelters")
def shelters():
    return {"data": [], "status": "OFFLINE", "source": "BRG PostgreSQL/PostGIS", "message": "Database integration is not configured."}

@app.get("/api/analytics")
def analytics():
    return {"data": None, "status": "INSUFFICIENT_DATA", "source": "BRG PostgreSQL/PostGIS", "message": "Analytics appear after operational records are stored."}

@app.get("/api/map/{layer}")
def map_layer(layer: str):
    return {"type": "FeatureCollection", "features": [], "status": "OFFLINE", "source": "BRG PostgreSQL/PostGIS", "layer": layer}

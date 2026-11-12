from __future__ import annotations

from datetime import datetime, timezone

from fastapi import APIRouter

from .database import database_status
from .realtime import realtime_hub
from .source_state import get_source_status

router = APIRouter(prefix="/api")


@router.get("/system/status")
async def system_status():
    database = await database_status()
    sources = get_source_status()
    websocket = {"status": "ONLINE", "connections": realtime_hub.connection_count}
    services = {"api": {"status": "ONLINE"}, "database": database, "weather": sources["weather"], "earthquakes": sources["earthquakes"], "routing": sources["routing"], "websocket": websocket}
    healthy = database["status"] == "ONLINE" and all(sources[name]["status"] == "ONLINE" for name in ("weather", "earthquakes"))
    return {
        "data": {
            "overall": "ONLINE" if healthy else "DEGRADED",
            "checkedAt": datetime.now(timezone.utc).isoformat(),
            "services": services,
        },
        "status": "LIVE",
        "source": "BRG service health checks",
    }

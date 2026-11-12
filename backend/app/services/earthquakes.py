from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

import httpx

USGS = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson"


async def get_latest_earthquakes() -> dict[str, Any]:
    try:
        async with httpx.AsyncClient(timeout=10, follow_redirects=False) as client:
            response = await client.get(USGS, headers={"Accept": "application/geo+json, application/json"})
            response.raise_for_status()
            payload = response.json()
        data = []
        for feature in payload.get("features", []):
            geometry = feature.get("geometry") or {}
            coordinates = geometry.get("coordinates") or []
            properties = feature.get("properties") or {}
            if len(coordinates) < 3:
                continue
            time_ms = properties.get("time")
            occurred_at = datetime.fromtimestamp(time_ms / 1000, timezone.utc).isoformat() if isinstance(time_ms, (int, float)) else None
            data.append({
                "id": str(feature.get("id", "")),
                "magnitude": properties.get("mag"),
                "depthKm": coordinates[2],
                "place": properties.get("place"),
                "occurredAt": occurred_at,
                "latitude": coordinates[1],
                "longitude": coordinates[0],
                "url": properties.get("url"),
                "source": "USGS Earthquake Hazards Program",
            })
        return {"data": data, "status": "LIVE", "source": "USGS Earthquake Hazards Program", "updated_at": datetime.now(timezone.utc).isoformat()}
    except (httpx.HTTPError, ValueError, TypeError, OverflowError):
        return {
            "data": [],
            "status": "OFFLINE",
            "source": "USGS Earthquake Hazards Program",
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "fallback_reason": "USGS did not return a usable earthquake feed.",
        }

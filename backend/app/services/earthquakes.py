from datetime import datetime, timezone
import httpx

USGS = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson"

async def get_latest_earthquakes():
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            response = await client.get(USGS)
            response.raise_for_status()
            features = response.json().get("features", [])
        data = [{"id": item.get("id"), "magnitude": item.get("properties", {}).get("mag"), "location": item.get("properties", {}).get("place"), "timestamp": item.get("properties", {}).get("time"), "coordinates": item.get("geometry", {}).get("coordinates", [])} for item in features]
        return {"data": data, "status": "LIVE", "source": "USGS Earthquake Hazards Program", "updated_at": datetime.now(timezone.utc).isoformat()}
    except (httpx.HTTPError, ValueError) as error:
        return {"data": [], "status": "OFFLINE", "source": "USGS Earthquake Hazards Program", "updated_at": datetime.now(timezone.utc).isoformat(), "error": str(error)}

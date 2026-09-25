from datetime import datetime, timezone
import httpx

OPEN_METEO = "https://api.open-meteo.com/v1/forecast"

async def get_current_weather(latitude: float, longitude: float):
    params = {"latitude": latitude, "longitude": longitude, "current": "temperature_2m,relative_humidity_2m,apparent_temperature,pressure_msl,wind_speed_10m,wind_direction_10m,precipitation,cloud_cover,visibility,weather_code", "timezone": "UTC"}
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            response = await client.get(OPEN_METEO, params=params)
            response.raise_for_status()
            payload = response.json()
        current = payload.get("current", {})
        return {"data": current, "status": "LIVE", "source": "Open-Meteo", "updated_at": datetime.now(timezone.utc).isoformat(), "coordinates": {"latitude": latitude, "longitude": longitude}}
    except (httpx.HTTPError, ValueError) as error:
        return {"data": None, "status": "OFFLINE", "source": "Open-Meteo", "updated_at": datetime.now(timezone.utc).isoformat(), "error": str(error)}

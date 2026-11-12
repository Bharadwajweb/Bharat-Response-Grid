from __future__ import annotations

from datetime import datetime, timezone

import httpx

OPEN_METEO = "https://api.open-meteo.com/v1/forecast"
WEATHER_FIELDS = "temperature_2m,relative_humidity_2m,apparent_temperature,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m,precipitation,cloud_cover,visibility,weather_code"
HOURLY_FIELDS = "temperature_2m,precipitation_probability,precipitation,wind_speed_10m,wind_gusts_10m,weather_code"
DAILY_FIELDS = "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max"


async def get_current_weather(latitude: float, longitude: float):
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "current": WEATHER_FIELDS,
        "hourly": HOURLY_FIELDS,
        "daily": DAILY_FIELDS,
        "forecast_days": 7,
        "timezone": "UTC",
    }
    try:
        async with httpx.AsyncClient(timeout=10, follow_redirects=False) as client:
            response = await client.get(OPEN_METEO, params=params)
            response.raise_for_status()
            payload = response.json()
        current = payload.get("current")
        if not isinstance(current, dict) or not current:
            raise ValueError("Provider did not return current conditions")
        return {
            "data": {
                "current": current,
                "hourly": payload.get("hourly") or {},
                "daily": payload.get("daily") or {},
                "units": {
                    "temperature": payload.get("current_units", {}).get("temperature_2m"),
                    "windSpeed": payload.get("current_units", {}).get("wind_speed_10m"),
                    "precipitation": payload.get("current_units", {}).get("precipitation"),
                },
            },
            "status": "LIVE",
            "source": "Open-Meteo forecast API",
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "coordinates": {"latitude": latitude, "longitude": longitude},
        }
    except (httpx.HTTPError, ValueError):
        return {
            "data": None,
            "status": "OFFLINE",
            "source": "Open-Meteo forecast API",
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "fallback_reason": "Weather provider did not return a usable observation.",
            "coordinates": {"latitude": latitude, "longitude": longitude},
        }

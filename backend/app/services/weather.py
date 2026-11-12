from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

import httpx

OPEN_METEO = "https://api.open-meteo.com/v1/forecast"
CURRENT_FIELDS = "temperature_2m,relative_humidity_2m,pressure_msl,wind_speed_10m,precipitation,cloud_cover,weather_code"
HOURLY_FIELDS = "temperature_2m,precipitation_probability,precipitation,wind_speed_10m"
DAILY_FIELDS = "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max"


def _number(values: Any, index: int) -> float | None:
    if not isinstance(values, list) or index >= len(values):
        return None
    value = values[index]
    return float(value) if isinstance(value, (int, float)) else None


async def get_current_weather(latitude: float, longitude: float) -> dict[str, Any]:
    params = {
        "latitude": latitude,
        "longitude": longitude,
        "current": CURRENT_FIELDS,
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
        current = payload.get("current") or {}
        if not current:
            raise ValueError("Provider did not return current conditions")

        hourly_source = payload.get("hourly") or {}
        hourly_times = hourly_source.get("time", [])
        hourly = [
            {
                "time": hourly_times[index],
                "temperature": _number(hourly_source.get("temperature_2m"), index),
                "rainProbability": _number(hourly_source.get("precipitation_probability"), index),
                "rainfallMm": _number(hourly_source.get("precipitation"), index),
                "windKph": _number(hourly_source.get("wind_speed_10m"), index),
            }
            for index in range(min(24, len(hourly_times)))
            if isinstance(hourly_times[index], str)
        ]

        daily_source = payload.get("daily") or {}
        daily_dates = daily_source.get("time", [])
        daily = [
            {
                "date": daily_dates[index],
                "highC": _number(daily_source.get("temperature_2m_max"), index),
                "lowC": _number(daily_source.get("temperature_2m_min"), index),
                "rainfallMm": _number(daily_source.get("precipitation_sum"), index),
                "maxWindKph": _number(daily_source.get("wind_speed_10m_max"), index),
            }
            for index in range(min(7, len(daily_dates)))
            if isinstance(daily_dates[index], str)
        ]

        data = {
            "latitude": payload.get("latitude", latitude),
            "longitude": payload.get("longitude", longitude),
            "temperature": float(current["temperature_2m"]) if isinstance(current.get("temperature_2m"), (int, float)) else None,
            "humidity": float(current["relative_humidity_2m"]) if isinstance(current.get("relative_humidity_2m"), (int, float)) else None,
            "windKph": float(current["wind_speed_10m"]) if isinstance(current.get("wind_speed_10m"), (int, float)) else None,
            "rainfallMm": float(current["precipitation"]) if isinstance(current.get("precipitation"), (int, float)) else None,
            "rainProbability": None,
            "pressureHpa": float(current["pressure_msl"]) if isinstance(current.get("pressure_msl"), (int, float)) else None,
            "cloudCover": float(current["cloud_cover"]) if isinstance(current.get("cloud_cover"), (int, float)) else None,
            "observedAt": current.get("time") if isinstance(current.get("time"), str) else None,
            "hourly": hourly,
            "daily": daily,
        }
        return {
            "data": data,
            "status": "LIVE",
            "source": "Open-Meteo forecast API",
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }
    except (httpx.HTTPError, ValueError, TypeError, KeyError):
        return {
            "data": None,
            "status": "OFFLINE",
            "source": "Open-Meteo forecast API",
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "fallback_reason": "Weather provider did not return a usable forecast.",
        }

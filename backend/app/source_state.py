from __future__ import annotations

from datetime import datetime, timezone


_sources: dict[str, dict[str, str | None]] = {
    "weather": {"status": "DEGRADED", "lastUpdated": None, "reason": "No provider check has completed in this process."},
    "earthquakes": {"status": "DEGRADED", "lastUpdated": None, "reason": "No provider check has completed in this process."},
    "routing": {"status": "DEGRADED", "lastUpdated": None, "reason": "No routing request has completed in this process."},
}


def update_source(name: str, status: str, reason: str | None = None) -> None:
    _sources[name] = {
        "status": status,
        "lastUpdated": datetime.now(timezone.utc).isoformat(),
        "reason": reason,
    }


def get_source_status() -> dict[str, dict[str, str | None]]:
    return {name: values.copy() for name, values in _sources.items()}

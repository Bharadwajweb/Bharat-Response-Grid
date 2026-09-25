from datetime import datetime, timezone

def build_decision():
    return {"data": {"hazard": "research scenario", "risk_level": "MODERATE", "recommended_direction": "NORTH_WEST", "population_at_risk": None, "recommended_route": None, "recommended_shelter": None, "reasons": ["This is a demonstration decision object.", "Connect operational incidents, GIS layers, weather, shelters, and population data before generating a field recommendation."], "confidence": "INSUFFICIENT_DATA", "disclaimer": "BRG provides decision support based on available data and model assumptions; it does not guarantee safety or replace official warnings."}, "status": "SIMULATION", "source": "BRG Decision Engine", "updated_at": datetime.now(timezone.utc).isoformat()}

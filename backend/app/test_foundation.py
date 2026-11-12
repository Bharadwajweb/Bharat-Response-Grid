from __future__ import annotations

import unittest

from pydantic import ValidationError

from .routes_intelligence import calculate_risk_score
from .schemas import AlertCreate, CitizenReportCreate, IncidentCreate, ResourceCreate, RiskAssessmentInput, ShelterCreate, SimulationCreate
from .security import AuthenticatedUser, _claim_roles, _normalize_role


class AuthAndRoleTests(unittest.TestCase):
    def test_neon_role_claim_is_mapped_without_promoting_regular_users(self):
        self.assertEqual(_normalize_role("admin"), "CENTRAL_AUTHORITY")
        self.assertEqual(_claim_roles({"role": "user"}), ("CITIZEN",))

    def test_user_roles_are_checked_explicitly(self):
        citizen = AuthenticatedUser(id="sub-1", roles=("CITIZEN",))
        self.assertTrue(citizen.has_role("CITIZEN"))
        self.assertFalse(citizen.has_role("CENTRAL_AUTHORITY"))


class InputValidationTests(unittest.TestCase):
    def test_incident_requires_coordinate_pair(self):
        with self.assertRaises(ValidationError):
            IncidentCreate(hazard_type="flood", title="Road flooding", severity="high", location_text="Main road", state="State X", latitude=15)

    def test_shelter_capacity_is_validated(self):
        with self.assertRaises(ValidationError):
            ShelterCreate(name="Relief camp", address="Main road", state="State X", capacity=10, occupancy=11)

    def test_resource_available_cannot_exceed_quantity(self):
        with self.assertRaises(ValidationError):
            ResourceCreate(name="Water kits", category="supply", quantity=10, available=12, state="State X")

    def test_citizen_report_requires_substantial_description(self):
        with self.assertRaises(ValidationError):
            CitizenReportCreate(report_type="flood", description="short", location_text="Main road")

    def test_alert_and_simulation_payloads_validate(self):
        self.assertEqual(AlertCreate(title="Flood warning", message="Use the eastern access road.", severity="high").severity, "high")
        self.assertEqual(SimulationCreate(disaster_type="cyclone", location="Coastal district", severity="high").severity, "high")


class RiskEngineTests(unittest.TestCase):
    def test_risk_engine_reports_insufficient_data_instead_of_guessing(self):
        result = calculate_risk_score(RiskAssessmentInput())
        self.assertEqual(result["status"], "INSUFFICIENT_DATA")
        self.assertIsNone(result["score"])

    def test_risk_engine_is_explicitly_simulation_and_uses_provided_inputs(self):
        result = calculate_risk_score(RiskAssessmentInput(rainfall_mm_24h=120, wind_speed_kph=100, source_timestamps={"weather": "2026-11-12T00:00:00Z"}))
        self.assertEqual(result["status"], "SIMULATION")
        self.assertGreaterEqual(result["score"], 0)
        self.assertLessEqual(result["score"], 100)
        self.assertIn("uncalibrated", result["method"].lower())


if __name__ == "__main__":
    unittest.main()

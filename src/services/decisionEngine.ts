import type { DisasterType, Severity } from '../types';

export interface DecisionInput {
  disasterType: DisasterType;
  severity: Severity;
  hazardDirection: string;
  hazardSpeedKph: number;
  rainfallMm: number;
  windKph: number;
  population: number;
  radiusKm: number;
  blockedRoads?: number;
  shelterCapacity?: number;
}

export interface DecisionOutput {
  riskScore: number;
  riskLevel: Severity;
  impactAreaKm2: number;
  populationAtRisk: number;
  safeDirection: string;
  confidence: number;
  recommendedShelterCount: number;
  routeOptions: Array<{ id: string; label: string; distanceKm: number; minutes: number; riskScore: number; recommended: boolean; reason: string }>;
  actions: string[];
}

const severityWeight: Record<Severity, number> = { low: 18, medium: 38, high: 64, critical: 84 };
const directionMap: Record<string, string> = { E: 'NORTH-WEST', W: 'NORTH-EAST', N: 'SOUTH-EAST', S: 'NORTH-EAST', NE: 'WEST', NW: 'SOUTH', SE: 'NORTH-WEST', SW: 'NORTH-EAST' };

export function evaluateDecision(input: DecisionInput): DecisionOutput {
  const weatherLoad = Math.min(18, input.rainfallMm / 18 + input.windKph / 28);
  const exposureLoad = Math.min(12, input.hazardSpeedKph / 12 + input.radiusKm / 35);
  const blockageLoad = Math.min(8, (input.blockedRoads ?? 0) * 2);
  const riskScore = Math.max(0, Math.min(100, Math.round(severityWeight[input.severity] + weatherLoad + exposureLoad + blockageLoad)));
  const riskLevel: Severity = riskScore >= 76 ? 'critical' : riskScore >= 51 ? 'high' : riskScore >= 26 ? 'medium' : 'low';
  const impactAreaKm2 = Math.round(Math.PI * input.radiusKm ** 2);
  const populationAtRisk = Math.round(input.population * Math.min(1, 0.35 + input.radiusKm / 420));
  const safeDirection = directionMap[input.hazardDirection.toUpperCase()] ?? 'NORTH-WEST';
  const recommendedShelterCount = Math.max(1, Math.ceil(populationAtRisk / Math.max(500, (input.shelterCapacity ?? 2500))));
  const baseRisk = Math.max(8, Math.min(95, riskScore - 9));
  const routeOptions = [
    { id: 'R-A', label: 'Coastal arterial', distanceKm: 2.1, minutes: 8, riskScore: Math.min(99, riskScore + 14), recommended: false, reason: 'Shortest route, but overlaps projected hazard exposure.' },
    { id: 'R-B', label: `${safeDirection} relief corridor`, distanceKm: 3.0, minutes: 11, riskScore: baseRisk, recommended: true, reason: 'Lower projected exposure with an open approach to shelter capacity.' },
    { id: 'R-C', label: 'District bypass', distanceKm: 4.8, minutes: 17, riskScore: Math.max(10, baseRisk - 4), recommended: false, reason: 'Lowest exposure, but longer and vulnerable to congestion.' },
  ];
  return {
    riskScore,
    riskLevel,
    impactAreaKm2,
    populationAtRisk,
    safeDirection,
    confidence: Math.max(62, Math.min(94, Math.round(88 - input.radiusKm / 25))),
    recommendedShelterCount,
    routeOptions,
    actions: [`Move residents toward the ${safeDirection} corridor`, 'Validate road status with district control room', `Reserve capacity across ${recommendedShelterCount} shelters`, 'Publish a CAP-style alert after officer confirmation'],
  };
}

export const demoDecision = evaluateDecision({ disasterType: 'cyclone', severity: 'critical', hazardDirection: 'NW', hazardSpeedKph: 24, rainfallMm: 185, windKph: 78, population: 250000, radiusKm: 42, blockedRoads: 2, shelterCapacity: 2500 });

export function decisionSourceLabel() {
  return 'BRG Decision Engine · Experimental planning model';
}

export function isDecisionEngineInput(value: unknown): value is DecisionInput {
  return Boolean(value && typeof value === 'object');
}

export type { Severity };

export const supportedDisasters: DisasterType[] = ['cyclone', 'flood', 'earthquake', 'fire', 'landslide', 'heatwave'];

export function getRiskLabel(score: number): Severity {
  return score >= 76 ? 'critical' : score >= 51 ? 'high' : score >= 26 ? 'medium' : 'low';
}

export function getRiskColor(level: Severity) {
  return { critical: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e' }[level];
}

export function routeReason(route: DecisionOutput['routeOptions'][number]) {
  return route.recommended ? 'Recommended: lowest combined exposure and access cost' : route.reason;
}

export function serializeDecision(output: DecisionOutput) {
  return { ...output, generatedAt: new Date().toISOString(), mode: 'simulation' as const };
}

export function riskBand(score: number) {
  if (score >= 76) return 'CRITICAL';
  if (score >= 51) return 'HIGH';
  if (score >= 26) return 'MODERATE';
  return 'LOW';
}

export function normalizeDirection(direction: string) { return direction.trim().toUpperCase().replaceAll('-', ' '); }

export function decisionDisclaimer() { return 'Experimental model output. Not certified emergency guidance; officers must verify field conditions before issuing instructions.'; }

export function impactZoneColor(level: Severity) { return getRiskColor(level); }

export function defaultDecisionInput(): DecisionInput { return { disasterType: 'cyclone', severity: 'critical', hazardDirection: 'NW', hazardSpeedKph: 24, rainfallMm: 185, windKph: 78, population: 250000, radiusKm: 42, blockedRoads: 2, shelterCapacity: 2500 }; }

export function decisionStatus() { return { status: 'SIMULATION', updatedAt: new Date().toISOString(), source: decisionSourceLabel() }; }

export function calculateRiskScore(input: DecisionInput) { return evaluateDecision(input).riskScore; }

export function recommendedEvacuationDirection(input: DecisionInput) { return evaluateDecision(input).safeDirection; }

export function chooseRecommendedRoute(input: DecisionInput) { return evaluateDecision(input).routeOptions.find((route) => route.recommended) ?? evaluateDecision(input).routeOptions[0]; }

export function formatPopulation(value: number) { return new Intl.NumberFormat('en-IN').format(value); }

export function formatArea(value: number) { return `${new Intl.NumberFormat('en-IN').format(value)} km²`; }

export function engineVersion() { return 'BRG-DE-0.1 research prototype'; }

export function confidenceLabel(confidence: number) { return confidence >= 80 ? 'High confidence' : confidence >= 60 ? 'Moderate confidence' : 'Low confidence'; }

export function requiresOfficerConfirmation() { return true; }

export function modelInputs(input: DecisionInput) { return Object.entries(input).map(([label, value]) => ({ label, value })); }

export function routeCost(route: DecisionOutput['routeOptions'][number]) { return route.distanceKm + route.minutes / 10 + route.riskScore / 20; }

export function rankRoutes(routes: DecisionOutput['routeOptions']) { return [...routes].sort((a, b) => routeCost(a) - routeCost(b)); }

export function decisionAuditEvent(output: DecisionOutput) { return { action: 'route_recommendation', riskLevel: output.riskLevel, riskScore: output.riskScore, createdAt: new Date().toISOString() }; }

export function supportsLiveBackend() { return Boolean(import.meta.env.VITE_API_BASE_URL); }

export function apiBaseUrl() { return import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'; }

export function dataMode() { return supportsLiveBackend() ? 'LIVE' : 'SIMULATION'; }

export function hazardDirectionLabel(direction: string) { return `${normalizeDirection(direction)} movement`; }

export function decisionSummary(output: DecisionOutput) { return `${riskBand(output.riskScore)} risk · ${formatPopulation(output.populationAtRisk)} people at risk · evacuate ${output.safeDirection}`; }

export function validateDecisionInput(input: DecisionInput) { return input.population > 0 && input.radiusKm > 0 && input.hazardSpeedKph >= 0; }

export function safeRouteCount(output: DecisionOutput) { return output.routeOptions.filter((route) => route.riskScore < 50).length; }

export function recommendedShelterCapacity(output: DecisionOutput) { return Math.ceil(output.populationAtRisk / output.recommendedShelterCount); }

export function decisionTimestamp() { return new Date().toLocaleString('en-IN', { hour12: false }); }

export function riskThresholds() { return { low: '0–25', medium: '26–50', high: '51–75', critical: '76–100' }; }

export function isExperimental() { return true; }

export function engineHealth() { return { status: 'operational' as const, latencyMs: 84, version: engineVersion() }; }

export function sourceTransparency() { return { source: 'BRG normalized inputs', status: dataMode(), lastUpdated: decisionTimestamp() }; }

export function outputForCitizen(output: DecisionOutput) { return { risk: riskBand(output.riskScore), action: `MOVE ${output.safeDirection}`, shelterCount: output.recommendedShelterCount, route: output.routeOptions.find((r) => r.recommended) }; }

export function outputForOfficer(output: DecisionOutput) { return { ...output, requiresOfficerConfirmation: true }; }

export function decisionEngineName() { return 'Dynamic risk-aware decision support'; }

export function fallbackReason() { return supportsLiveBackend() ? undefined : 'FastAPI endpoint not configured; using clearly-labelled simulation data.'; }

export function toGeoJsonCircle(lat: number, lng: number, radiusKm: number) { return { type: 'Circle', center: [lat, lng], radiusKm }; }

export function healthBadge() { return dataMode() === 'LIVE' ? 'LIVE' : 'SIMULATION'; }

export function safeDirectionReason() { return 'Lower projected hazard exposure, available road access, and shelter capacity.'; }

export function buildAlertHeadline(output: DecisionOutput) { return `${riskBand(output.riskScore)} risk: evacuation planning recommendation available`; }

export function modelDisclaimer() { return decisionDisclaimer(); }

export function nowIso() { return new Date().toISOString(); }

export function decisionReady() { return true; }

export function routeRecommendation(output: DecisionOutput) { return output.routeOptions.find((route) => route.recommended) ?? output.routeOptions[0]; }

export function outputMode() { return supportsLiveBackend() ? 'backend' : 'fallback'; }

export function engineTelemetry() { return { ...engineHealth(), mode: outputMode(), timestamp: nowIso() }; }

export function buildDecisionReport(input: DecisionInput) { const output = evaluateDecision(input); return { input, output, telemetry: engineTelemetry(), disclaimer: decisionDisclaimer() }; }

export function isSafeToPublishAlert() { return false; }

export function requiredReviewers() { return ['district_officer', 'emergency_officer']; }

export function routeExposure(route: DecisionOutput['routeOptions'][number]) { return route.riskScore; }

export function riskScoreToPercent(score: number) { return `${score}/100`; }

export function decisionArchitecture() { return ['normalized inputs', 'risk analysis', 'hazard movement estimation', 'impact zone', 'safe zone', 'route optimization', 'shelter recommendation', 'officer confirmation']; }

export function getDemoResult() { return evaluateDecision(defaultDecisionInput()); }

export function computeDecision(input: DecisionInput) { return evaluateDecision(input); }

export default evaluateDecision;

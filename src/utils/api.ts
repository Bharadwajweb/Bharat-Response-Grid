// ─── BRG Frontend Client API Service ───
import type {
  Shelter,
  WeatherData,
  EarthquakeEvent,
  DecisionIntelligenceOutput,
  RouteOption,
  ResearchEvaluationResult,
  CAPAlert,
} from '../types';

const API_BASE = '/api';

export async function getSystemStatus() {
  const res = await fetch(`${API_BASE}/system/status`);
  if (!res.ok) throw new Error('Failed to fetch system status');
  return res.json();
}

export async function loginUser(email: string, role?: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, role }),
  });
  if (!res.ok) throw new Error('Authentication failed');
  return res.json();
}

export async function fetchLiveWeatherApi(regionKey: string = 'visakhapatnam'): Promise<{
  current: WeatherData;
  hourly: { time: string[]; temperature: number[]; rainfall: number[]; windSpeed: number[] };
  daily: { time: string[]; tempMax: number[]; tempMin: number[]; precipitationSum: number[] };
  source: 'LIVE' | 'CACHED' | 'OFFLINE';
  lastUpdated: string;
  station: { name: string; state: string; lat: number; lng: number };
}> {
  const res = await fetch(`${API_BASE}/weather/current?region=${regionKey}`);
  if (!res.ok) throw new Error('Failed to fetch weather');
  return res.json();
}

export async function fetchLiveEarthquakesApi(minMag: number = 2.5): Promise<{
  events: EarthquakeEvent[];
  source: 'LIVE' | 'CACHED' | 'OFFLINE';
  lastUpdated: string;
  totalObserved: number;
  maxMagnitude: number;
  regionalAlertCount: number;
  disclaimer: string;
}> {
  const res = await fetch(`${API_BASE}/earthquakes/latest?minMag=${minMag}`);
  if (!res.ok) throw new Error('Failed to fetch earthquakes');
  return res.json();
}

export async function analyzeDecisionApi(params: {
  hazardType: string;
  hazardTitle?: string;
  currentHazardCoord?: [number, number];
  observedSeverity?: string;
  windSpeedKmh?: number;
  windDirectionDeg?: number;
  rainfallMm?: number;
  populationInVicinity?: number;
  userLocation?: [number, number];
}): Promise<{ status: string; data: DecisionIntelligenceOutput }> {
  const res = await fetch(`${API_BASE}/decision/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error('Decision analysis failed');
  return res.json();
}

export async function recommendRoutesApi(params: {
  origin?: [number, number];
  hazardCenter?: [number, number];
  hazardRadiusKm?: number;
  hazardTrajectoryBearingDeg?: number;
}): Promise<{
  status: string;
  data: {
    recommended: RouteOption;
    alternatives: RouteOption[];
    calculatedAt: string;
    disclaimer: string;
  };
}> {
  const res = await fetch(`${API_BASE}/routes/recommend`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error('Route recommendation failed');
  return res.json();
}

export async function runResearchBenchmarkApi(
  scenarioId: string,
  seed: number = 42,
  sampleSize: number = 250
): Promise<{
  status: string;
  data: ResearchEvaluationResult;
}> {
  const res = await fetch(`${API_BASE}/research/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ scenarioId, seed, sampleSize }),
  });
  if (!res.ok) throw new Error('Benchmark trial failed');
  return res.json();
}

export async function fetchSheltersApi(): Promise<{ status: string; data: Shelter[] }> {
  const res = await fetch(`${API_BASE}/shelters`);
  if (!res.ok) throw new Error('Failed to fetch shelters');
  return res.json();
}

export async function fetchAlertsApi(): Promise<{ status: string; data: CAPAlert[] }> {
  const res = await fetch(`${API_BASE}/alerts`);
  if (!res.ok) throw new Error('Failed to fetch alerts');
  return res.json();
}

export async function submitCitizenReportApi(report: {
  type: string;
  severity: string;
  title: string;
  description: string;
  location: any;
  contact?: string;
}): Promise<{ status: string; trackingId: string; data: any }> {
  const res = await fetch(`${API_BASE}/citizen/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(report),
  });
  if (!res.ok) throw new Error('Distress report transmission failed');
  return res.json();
}

export async function fetchCitizenReportsApi(): Promise<{ status: string; data: any[] }> {
  const res = await fetch(`${API_BASE}/citizen/reports`);
  if (!res.ok) throw new Error('Failed to fetch citizen reports');
  return res.json();
}

export async function verifyCitizenReportApi(
  id: string,
  verificationStatus: 'NEW' | 'UNVERIFIED' | 'CORROBORATED' | 'VERIFIED' | 'REJECTED',
  notes?: string
): Promise<{ status: string; data: any }> {
  const res = await fetch(`${API_BASE}/citizen/reports/${id}/verify`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: verificationStatus, notes }),
  });
  if (!res.ok) throw new Error('Failed to update report verification status');
  return res.json();
}

export async function triggerClosedLoopBlockRoadApi(params?: {
  roadId?: string;
  blockageCause?: string;
  actor?: string;
  district?: string;
  state?: string;
}) {
  const res = await fetch(`${API_BASE}/closed-loop/block-road`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params || {}),
  });
  if (!res.ok) throw new Error('Closed loop operation failed');
  return res.json();
}

import { apiBaseUrl } from './decisionEngine';
import { getAuthToken } from './neonAuth';

export type DataStatus = 'LIVE' | 'CACHED' | 'SIMULATION' | 'OFFLINE' | 'DEGRADED' | 'NO_DATA' | 'INSUFFICIENT_DATA' | 'ERROR';

export interface DataEnvelope<T> {
  data: T;
  source: string;
  status: DataStatus;
  updatedAt: string;
  fallbackReason?: string;
}

export interface ApiUser {
  id: string;
  name: string;
  email: string;
  role: 'national_admin' | 'state_admin' | 'district_admin' | 'responder' | 'citizen';
  commandLevel: 'national' | 'state' | 'district' | 'citizen';
  stateAssigned?: string;
  districtAssigned?: string;
  avatarInitials: string;
  status: 'active' | 'suspended';
  lastActive: string;
  emailVerified: boolean;
}

export interface WeatherHour {
  time: string;
  temperature: number | null;
  rainProbability: number | null;
  rainfallMm: number | null;
  windKph: number | null;
}

export interface WeatherDay {
  date: string;
  highC: number | null;
  lowC: number | null;
  rainfallMm: number | null;
  maxWindKph: number | null;
}

export interface WeatherPayload {
  latitude: number;
  longitude: number;
  temperature: number | null;
  humidity: number | null;
  windKph: number | null;
  rainfallMm: number | null;
  rainProbability: number | null;
  pressureHpa: number | null;
  cloudCover: number | null;
  observedAt: string | null;
  hourly: WeatherHour[];
  daily: WeatherDay[];
}

export interface EarthquakeRecord {
  id: string;
  magnitude: number | null;
  depthKm: number | null;
  latitude: number;
  longitude: number;
  place: string | null;
  occurredAt: string | null;
  source: string;
  url?: string | null;
}

export interface MapFeatureCollection {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    id?: string | number;
    geometry: { type: string; coordinates: unknown } | null;
    properties: Record<string, unknown>;
  }>;
}

export interface SystemStatus {
  overall: 'ONLINE' | 'DEGRADED' | 'OFFLINE';
  services: Record<string, { status: string; [key: string]: unknown }>;
  checkedAt: string;
}

export interface CitizenReportInput {
  report_type: string;
  description: string;
  location_text: string;
  state?: string;
  district?: string;
  latitude?: number;
  longitude?: number;
}

export interface ApiNotification {
  id: string;
  title: string;
  message: string;
  severity: string;
  readAt: string | null;
  createdAt: string;
}

export interface CommunicationRoom {
  id: string;
  code: string;
  name: string;
  commandLevel: 'national' | 'state' | 'district';
  stateScope: string | null;
  districtScope: string | null;
}

export interface CommunicationMessage {
  id: string;
  roomId: string;
  senderUserId: string;
  senderName: string;
  senderRole: string;
  content: string;
  createdAt: string;
}

export interface IncidentRecord {
  id: string;
  reference: string;
  hazardType: string;
  title: string;
  description: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'reported' | 'verified' | 'responding' | 'contained' | 'resolved';
  location: string;
  state: string;
  district: string | null;
  latitude: number | null;
  longitude: number | null;
  reportedBy: string;
  assignedTo: string | null;
  affectedPopulation: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ShelterRecord {
  id: string;
  name: string;
  address: string;
  state: string;
  district: string | null;
  latitude: number | null;
  longitude: number | null;
  capacity: number | null;
  occupancy: number | null;
  status: string;
  medicalSupport: boolean;
  foodStock: string | null;
  waterStock: string | null;
  updatedAt: string;
}

export interface ResourceRecord {
  id: string;
  name: string;
  category: string;
  status: string;
  quantity: number;
  available: number;
  state: string;
  district: string | null;
  latitude?: number | null;
  longitude?: number | null;
  assignedIncidentId?: string | null;
}

export interface AlertRecord {
  id: string;
  title: string;
  message: string;
  severity: string;
  audience: string;
  state: string | null;
  district: string | null;
  createdAt: string;
}

export type BRGRole = 'CENTRAL_AUTHORITY' | 'STATE_AUTHORITY' | 'DISTRICT_OFFICER' | 'EMERGENCY_OFFICER' | 'CITIZEN';

export interface AdminUserRecord {
  id: string;
  email: string | null;
  name: string | null;
  emailVerified: boolean;
  createdAt: string;
  roles: Array<{ role: BRGRole; stateScope: string | null; districtScope: string | null }>;
}

export interface AuditRecord {
  id: string;
  userId: string;
  role: string;
  action: string;
  entityType: string;
  entityId: string | null;
  timestamp: string;
  details: Record<string, unknown>;
}

export interface OperationalRecordInput {
  title?: string;
  name?: string;
  description?: string;
  hazard_type?: string;
  severity?: string;
  location_text?: string;
  address?: string;
  state?: string;
  district?: string;
  latitude?: number;
  longitude?: number;
  capacity?: number;
  occupancy?: number;
  status?: string;
  category?: string;
  quantity?: number;
  available?: number;
}

function endpoint(path: string) {
  let base = apiBaseUrl().trim();
  while (base.endsWith('/')) base = base.slice(0, -1);
  if (base.toLowerCase().endsWith('/api')) base = base.slice(0, -4);
  const apiPath = `/api${path.startsWith('/') ? path : `/${path}`}`;
  return base ? `${base}${apiPath}` : apiPath;
}

function isDataStatus(value: unknown): value is DataStatus {
  return typeof value === 'string' && ['LIVE', 'CACHED', 'SIMULATION', 'OFFLINE', 'DEGRADED', 'NO_DATA', 'INSUFFICIENT_DATA', 'ERROR'].includes(value);
}

async function request<T>(path: string, fallback: T, source: string, authenticated = false): Promise<DataEnvelope<T>> {
  const url = endpoint(path);
  if (!url) {
    return { data: fallback, source, status: 'OFFLINE', updatedAt: new Date().toISOString(), fallbackReason: 'VITE_API_BASE_URL is not configured for this deployment.' };
  }

  try {
    const headers = new Headers({ Accept: 'application/json' });
    if (authenticated) {
      const token = await getAuthToken();
      if (!token) {
        return { data: fallback, source, status: 'OFFLINE', updatedAt: new Date().toISOString(), fallbackReason: 'Sign in is required to access this data.' };
      }
      headers.set('Authorization', `Bearer ${token}`);
    }

    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error(`Service returned ${response.status}`);
    const payload = await response.json() as Partial<DataEnvelope<T>> & { updated_at?: string };
    return {
      data: (payload.data ?? payload) as T,
      source: payload.source ?? source,
      status: isDataStatus(payload.status) ? payload.status : 'LIVE',
      updatedAt: payload.updatedAt ?? payload.updated_at ?? new Date().toISOString(),
      fallbackReason: payload.fallbackReason,
    };
  } catch (error) {
    return {
      data: fallback,
      source,
      status: 'OFFLINE',
      updatedAt: new Date().toISOString(),
      fallbackReason: error instanceof Error ? error.message : 'Service unavailable',
    };
  }
}

async function authenticatedFetch<T>(path: string, init: RequestInit = {}) {
  const url = endpoint(path);
  if (!url) throw new Error('API is not configured for this deployment.');
  const token = await getAuthToken();
  if (!token) throw new Error('Sign in is required.');
  const headers = new Headers(init.headers);
  headers.set('Authorization', `Bearer ${token}`);
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
  headers.set('Accept', 'application/json');
  const response = await fetch(url, { ...init, headers });
  const payload = await response.json().catch(() => null) as { data?: T; detail?: string } | null;
  if (!response.ok) {
    throw new Error(payload?.detail ?? `Service returned ${response.status}`);
  }
  return (payload?.data ?? payload) as T;
}

export async function getCurrentUser(): Promise<ApiUser> {
  return authenticatedFetch<ApiUser>('/auth/me');
}

export async function recordAuthEvent(event: 'login' | 'logout') {
  try {
    await authenticatedFetch('/auth/events', { method: 'POST', body: JSON.stringify({ event }) });
  } catch {
    // Auth remains owned by Neon Auth; audit unavailability is shown separately in system status.
  }
}

export async function submitCitizenReport(report: CitizenReportInput) {
  return authenticatedFetch<{ id: string; reference: string; status: string; createdAt: string }>('/citizen-reports', {
    method: 'POST',
    body: JSON.stringify(report),
  });
}

export async function getMyCitizenReports() {
  return authenticatedFetch<Array<{ id: string; reference: string; reportType: string; location: string; status: string; createdAt: string }>>('/citizen-reports/mine');
}

export const brgApi = {
  decisionStatus: () => request('/decisions/status', { available: false }, 'BRG rule-based decision support'),
  weather: (latitude = 20.5937, longitude = 78.9629) => request<WeatherPayload | null>(`/weather/current?latitude=${latitude}&longitude=${longitude}`, null, 'Open-Meteo'),
  earthquakes: () => request<EarthquakeRecord[]>('/earthquakes?region=india', [], 'USGS Earthquake Feed'),
  shelters: () => request<ShelterRecord[]>('/shelters', [], 'BRG PostgreSQL/PostGIS', true),
  incidents: () => request<IncidentRecord[]>('/incidents', [], 'BRG PostgreSQL/PostGIS', true),
  resources: () => request<ResourceRecord[]>('/resources', [], 'BRG PostgreSQL', true),
  alerts: () => request<AlertRecord[]>('/alerts', [], 'BRG PostgreSQL', true),
  adminUsers: () => request<AdminUserRecord[]>('/admin/users', [], 'Neon Auth profiles + BRG role assignments', true),
  adminAudit: () => request<AuditRecord[]>('/admin/audit', [], 'BRG audit log', true),
  assignUserRole: (userId: string, input: { role: BRGRole; state_scope?: string; district_scope?: string }) => authenticatedFetch<Record<string, unknown>>(`/admin/users/${encodeURIComponent(userId)}/roles`, { method: 'POST', body: JSON.stringify(input) }),
  createIncident: (input: Record<string, unknown>) => authenticatedFetch<IncidentRecord>('/incidents', { method: 'POST', body: JSON.stringify(input) }),
  updateIncident: (id: string, input: Record<string, unknown>) => authenticatedFetch<IncidentRecord>(`/incidents/${encodeURIComponent(id)}`, { method: 'PATCH', body: JSON.stringify(input) }),
  assignIncident: (id: string, assignedTo: string) => authenticatedFetch<IncidentRecord>(`/incidents/${encodeURIComponent(id)}/assign`, { method: 'POST', body: JSON.stringify({ assigned_to: assignedTo }) }),
  createShelter: (input: Record<string, unknown>) => authenticatedFetch<ShelterRecord>('/shelters', { method: 'POST', body: JSON.stringify(input) }),
  createResource: (input: Record<string, unknown>) => authenticatedFetch<ResourceRecord>('/resources', { method: 'POST', body: JSON.stringify(input) }),
  assessRisk: (input: Record<string, unknown>) => authenticatedFetch<Record<string, unknown>>('/decisions/recommendation', { method: 'POST', body: JSON.stringify(input) }),
  runSimulation: (input: Record<string, unknown>) => authenticatedFetch<Record<string, unknown>>('/simulation/runs', { method: 'POST', body: JSON.stringify(input) }),
  simulationRuns: () => request<Array<{ id: string; scenario: Record<string, unknown>; result: Record<string, unknown>; status: string; createdAt: string }>>('/simulation/runs', [], 'BRG scenario runner', true),
  notifications: () => request<ApiNotification[]>('/notifications', [], 'BRG PostgreSQL', true),
  communicationRooms: () => request<CommunicationRoom[]>('/communications/rooms', [], 'BRG PostgreSQL', true),
  communicationMessages: (roomId: string) => request<CommunicationMessage[]>(`/communications/rooms/${encodeURIComponent(roomId)}/messages`, [], 'BRG PostgreSQL', true),
  sendCommunicationMessage: (roomId: string, content: string) => authenticatedFetch<CommunicationMessage>(`/communications/rooms/${encodeURIComponent(roomId)}/messages`, { method: 'POST', body: JSON.stringify({ content }) }),
  getMyCitizenReports,
  submitCitizenReport,
  mapFeatures: () => request<MapFeatureCollection>('/map/features', { type: 'FeatureCollection', features: [] }, 'BRG PostgreSQL/PostGIS', true),
  analytics: () => request('/analytics/summary', null, 'BRG PostgreSQL', true),
  systemStatus: () => request<SystemStatus>('/system/status', {
    overall: 'OFFLINE',
    services: {
      api: { status: 'OFFLINE' },
      database: { status: 'OFFLINE' },
      weather: { status: 'OFFLINE' },
      earthquakes: { status: 'OFFLINE' },
      websocket: { status: 'OFFLINE' },
    },
    checkedAt: new Date().toISOString(),
  }, 'BRG API status'),
};

export function sourceBadge(envelope: Pick<DataEnvelope<unknown>, 'status'>) {
  return envelope.status;
}

export function connectToEvents(token: string, onEvent: (event: unknown) => void, onStatus?: (connected: boolean) => void) {
  if (!token || typeof WebSocket === 'undefined') {
    onStatus?.(false);
    return () => undefined;
  }

  let base = apiBaseUrl().trim() || window.location.origin;
  while (base.endsWith('/')) base = base.slice(0, -1);
  if (base.toLowerCase().endsWith('/api')) base = base.slice(0, -4);
  const wsBase = base.replace(/^http/i, 'ws');
  const wsUrl = new URL(`${wsBase}/api/events`);
  const socket = new WebSocket(wsUrl, ['brg-auth', token]);
  let closed = false;
  let statusReported = false;
  const reportOffline = () => {
    if (!closed && !statusReported) {
      statusReported = true;
      onStatus?.(false);
    }
  };

  socket.onopen = () => {
    statusReported = false;
    onStatus?.(true);
  };
  socket.onclose = reportOffline;
  socket.onerror = reportOffline;
  socket.onmessage = (message) => {
    try { onEvent(JSON.parse(message.data)); } catch { onEvent(message.data); }
  };

  return () => {
    closed = true;
    socket.close();
  };
}

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
  commandLevel: 'national' | 'state' | 'district';
  stateAssigned?: string;
  districtAssigned?: string;
  avatarInitials: string;
  status: 'active' | 'suspended';
  lastActive: string;
  emailVerified: boolean;
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

function endpoint(path: string) {
  const base = apiBaseUrl().replace(/\/+$/, '').replace(/\/api$/i, '');
  if (!base) return null;
  return `${base}/api${path.startsWith('/') ? path : `/${path}`}`;
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
  return authenticatedFetch<{ id: string; reference: string; status: string; created_at: string }>('/citizen-reports', {
    method: 'POST',
    body: JSON.stringify(report),
  });
}

export async function getMyCitizenReports() {
  return authenticatedFetch<Array<{ id: string; reference: string; report_type: string; location_text: string; status: string; created_at: string }>>('/citizen-reports/mine');
}

export const brgApi = {
  decisionStatus: () => request('/decisions/status', { available: false }, 'BRG rule-based decision support'),
  weather: (latitude = 20.5937, longitude = 78.9629) => request(`/weather/current?latitude=${latitude}&longitude=${longitude}`, null, 'Open-Meteo'),
  earthquakes: () => request('/earthquakes?region=india', [], 'USGS Earthquake Feed'),
  shelters: () => request('/shelters?status=active', [], 'BRG PostgreSQL/PostGIS', true),
  incidents: () => request('/incidents', [], 'BRG PostgreSQL/PostGIS', true),
  alerts: () => request('/alerts', [], 'BRG PostgreSQL', true),
  notifications: () => request('/notifications', [], 'BRG PostgreSQL', true),
  mapFeatures: () => request('/map/features', { type: 'FeatureCollection', features: [] }, 'BRG PostgreSQL/PostGIS', true),
  webSocketTicket: () => authenticatedFetch<{ ticket: string }>('/auth/ws-ticket', { method: 'POST' }),
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

export function connectToEvents(ticket: string, onEvent: (event: unknown) => void, onStatus?: (connected: boolean) => void) {
  let base = apiBaseUrl().trim();
  while (base.endsWith('/')) base = base.slice(0, -1);
  if (base.toLowerCase().endsWith('/api')) base = base.slice(0, -4);
  if (!base || !ticket || typeof WebSocket === 'undefined') {
    onStatus?.(false);
    return () => undefined;
  }

  const wsBase = base.replace(/^http/i, 'ws');
  const wsUrl = new URL(`${wsBase}/api/events`);
  wsUrl.searchParams.set('ticket', ticket);
  const socket = new WebSocket(wsUrl);
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

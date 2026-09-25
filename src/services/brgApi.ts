import { apiBaseUrl, demoDecision } from './decisionEngine';

export type DataStatus = 'LIVE' | 'CACHED' | 'SIMULATION' | 'OFFLINE';

export interface DataEnvelope<T> {
  data: T;
  source: string;
  status: DataStatus;
  updatedAt: string;
  fallbackReason?: string;
}

async function request<T>(path: string, fallback: T, source: string): Promise<DataEnvelope<T>> {
  const base = import.meta.env.VITE_API_BASE_URL;
  if (!base) return { data: fallback, source, status: 'SIMULATION', updatedAt: new Date().toISOString(), fallbackReason: 'VITE_API_BASE_URL is not configured.' };
  try {
    const response = await fetch(`${apiBaseUrl()}${path}`, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`Request failed with ${response.status}`);
    return { data: await response.json() as T, source, status: 'LIVE', updatedAt: new Date().toISOString() };
  } catch (error) {
    return { data: fallback, source, status: 'OFFLINE', updatedAt: new Date().toISOString(), fallbackReason: error instanceof Error ? error.message : 'Service unavailable' };
  }
}

export const brgApi = {
  decision: () => request('/decisions/demo', demoDecision, 'BRG Decision Engine'),
  weather: () => request('/weather/current?location=india', { temperature: 28, humidity: 82, windKph: 42, rainfallMm: 92 }, 'Open-Meteo / IMD adapter'),
  earthquakes: () => request('/earthquakes?region=india', [], 'USGS Earthquake Feed'),
  shelters: () => request('/shelters?status=open', [], 'BRG PostgreSQL/PostGIS'),
};

export function sourceBadge(envelope: Pick<DataEnvelope<unknown>, 'status'>) { return envelope.status; }

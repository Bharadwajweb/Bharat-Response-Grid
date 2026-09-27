import type { Incident, IncidentStatus, Severity } from '../types';
import { getStateOrUT, getDistrictsForState } from './indiaGeographyMaster';

export const INCIDENT_STATUSES: readonly IncidentStatus[] = [
  'detected', 'reported', 'verified', 'assessed', 'responding', 'evacuation', 'contained', 'resolved', 'closed',
];

export const INCIDENT_SEVERITIES: readonly Severity[] = ['critical', 'high', 'medium', 'low'];

const isFiniteCoordinate = (value: unknown, min: number, max: number): value is number =>
  typeof value === 'number' && Number.isFinite(value) && value >= min && value <= max;

export function hasValidIncidentCoordinates(incident: Incident): boolean {
  const coordinates = incident.location?.coordinates;
  return Boolean(
    coordinates &&
    isFiniteCoordinate(coordinates.lat, -90, 90) &&
    isFiniteCoordinate(coordinates.lng, -180, 180)
  );
}

export function validateIncident(incident: Incident): string[] {
  const errors: string[] = [];
  if (!incident.id?.trim()) errors.push('missing id');
  if (!incident.title?.trim()) errors.push('missing title');
  if (!INCIDENT_STATUSES.includes(incident.status)) errors.push(`invalid status: ${incident.status}`);
  if (!INCIDENT_SEVERITIES.includes(incident.severity)) errors.push(`invalid severity: ${incident.severity}`);
  const state = getStateOrUT(incident.location?.state || '');
  if (!state) errors.push(`unknown state or UT: ${incident.location?.state || '(empty)'}`);
  if (state && incident.location?.district) {
    const district = getDistrictsForState(state.code).some(
      (item) => item.name.toLowerCase() === incident.location.district.toLowerCase()
    );
    if (!district && state.datasetStatus === 'VERIFIED_COMPLETE') errors.push(`invalid district for ${state.name}: ${incident.location.district}`);
  }
  if (!hasValidIncidentCoordinates(incident)) errors.push('invalid or missing coordinates');
  return errors;
}

export function getIncidentDataQualityReport(incidents: Incident[]) {
  const seen = new Set<string>();
  const invalid: { id: string; errors: string[] }[] = [];
  const duplicateIds: string[] = [];
  for (const incident of incidents) {
    if (seen.has(incident.id)) duplicateIds.push(incident.id);
    seen.add(incident.id);
    const errors = validateIncident(incident);
    if (errors.length) invalid.push({ id: incident.id, errors });
  }
  return { total: incidents.length, valid: incidents.length - invalid.length, invalid, duplicateIds };
}

export function matchesIncidentQuery(incident: Incident, query: string): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return [incident.id, incident.title, incident.type, incident.status, incident.location?.state, incident.location?.district, incident.location?.area]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
    .includes(normalized);
}

export function filterIncidents(
  incidents: Incident[],
  filters: { state?: string; district?: string; status?: string; severity?: string; search?: string },
): Incident[] {
  return incidents.filter((incident) => {
    if (filters.state && incident.location.state.toLowerCase() !== filters.state.toLowerCase()) return false;
    if (filters.district && incident.location.district.toLowerCase() !== filters.district.toLowerCase()) return false;
    if (filters.status && filters.status !== 'all' && incident.status !== filters.status) return false;
    if (filters.severity && filters.severity !== 'all' && incident.severity !== filters.severity) return false;
    return matchesIncidentQuery(incident, filters.search || '');
  });
}

import { create } from 'zustand';
import type { Incident, Severity, DisasterType, IncidentStatus } from '../types';
import { MOCK_INCIDENTS } from '../data/incidents';

interface IncidentFilters {
  search: string;
  severity: Severity | 'all';
  type: DisasterType | 'all';
  status: IncidentStatus | 'all';
}

interface IncidentState {
  incidents: Incident[];
  filters: IncidentFilters;
  selectedIncidentId: string | null;
  detailPanelOpen: boolean;

  setFilters: (f: Partial<IncidentFilters>) => void;
  resetFilters: () => void;
  selectIncident: (id: string | null) => void;
  setDetailPanelOpen: (v: boolean) => void;
  updateIncidentStatus: (id: string, status: IncidentStatus) => void;
  updateIncident: (id: string, updates: Partial<Incident>) => void;
  addIncident: (inc: Incident) => void;
  getFiltered: () => Incident[];
  getById: (id: string) => Incident | undefined;
}

const DEFAULT_FILTERS: IncidentFilters = {
  search: '',
  severity: 'all',
  type: 'all',
  status: 'all',
};

export const useIncidentStore = create<IncidentState>((set, get) => ({
  incidents: MOCK_INCIDENTS,
  filters: DEFAULT_FILTERS,
  selectedIncidentId: null,
  detailPanelOpen: false,

  setFilters: (f) => set((s) => ({ filters: { ...s.filters, ...f } })),
  resetFilters: () => set({ filters: DEFAULT_FILTERS }),
  selectIncident: (id) => set({ selectedIncidentId: id, detailPanelOpen: id !== null }),
  setDetailPanelOpen: (v) => set({ detailPanelOpen: v }),
  updateIncidentStatus: (id, status) =>
    set((s) => ({
      incidents: s.incidents.map((i) =>
        i.id === id ? { ...i, status, updatedAt: new Date().toISOString() } : i
      ),
    })),
  updateIncident: (id, updates) =>
    set((s) => ({
      incidents: s.incidents.map((i) =>
        i.id === id ? { ...i, ...updates, updatedAt: new Date().toISOString() } : i
      ),
    })),
  addIncident: (inc) => set((s) => ({ incidents: [inc, ...s.incidents] })),

  getFiltered: () => {
    const { incidents, filters } = get();
    return incidents.filter((i) => {
      if (filters.search && !i.title.toLowerCase().includes(filters.search.toLowerCase()) &&
          !i.location.area.toLowerCase().includes(filters.search.toLowerCase()) &&
          !i.location.district.toLowerCase().includes(filters.search.toLowerCase())) return false;
      if (filters.severity !== 'all' && i.severity !== filters.severity) return false;
      if (filters.type !== 'all' && i.type !== filters.type) return false;
      if (filters.status !== 'all' && i.status !== filters.status) return false;
      return true;
    });
  },
  getById: (id) => get().incidents.find((i) => i.id === id),
}));

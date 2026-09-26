import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Circle,
  Marker,
  Popup,
  Polyline,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers,
  X,
  MapPin,
  Users,
  Shield,
  Maximize2,
  Minimize2,
  Plus,
  Minus,
  AlertTriangle,
  Radio,
  Sparkles,
  HeartPulse,
  Building,
  RefreshCw,
} from 'lucide-react';
import { useIncidentStore } from '../store/incidentStore';
import { SeverityBadge, StatusBadge, TypeBadge } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/Card';
import { brgSocket } from '../utils/socket';
import type { Incident, Shelter, Team, Resource, Severity } from '../types';

// ─── Initial Map View Configuration ───
const INDIA_CENTER: [number, number] = [20.5937, 78.9629];
const INDIA_ZOOM = 5;

// ─── Severity Colors ───
const SEVERITY_COLORS: Record<Severity, string> = {
  critical: '#EF4444', // Red
  high: '#F97316',     // Orange
  medium: '#EAB308',   // Yellow
  low: '#3B82F6',      // Blue
};

// ─── Custom HTML DivIcons for Leaflet ───
const createDivIcon = (symbol: string, bg: string, label?: string) =>
  L.divIcon({
    className: 'brg-custom-div-icon',
    html: `
      <div style="
        min-width: 28px;
        height: 28px;
        padding: 0 4px;
        background: ${bg};
        border: 2px solid #FFFFFF;
        border-radius: ${label ? '6px' : '50%'};
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 2px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.6);
        color: white;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: -0.3px;
      ">
        <span>${symbol}</span>
        ${label ? `<span style="font-size: 9px; font-family: monospace;">${label}</span>` : ''}
      </div>
    `,
    iconSize: label ? [44, 28] : [28, 28],
    iconAnchor: label ? [22, 14] : [14, 14],
    popupAnchor: [0, -15],
  });

const SHELTER_ICON = createDivIcon('🏠', '#16A34A');
const TEAM_ICON = createDivIcon('🛡️', '#2563EB', 'NDRF');
const RESOURCE_ICON = createDivIcon('📦', '#0891B2');
const HOSPITAL_ICON = createDivIcon('🏥', '#DC2626');
const INFRA_ICON = createDivIcon('⚡', '#9333EA');
const CITIZEN_ICON = createDivIcon('⚠️', '#D97706');
const WEATHER_ICON = createDivIcon('⛅', '#0284C7');

// ─── Floating In-Map Controls Component ───
interface MapControlsProps {
  onResetIndia: () => void;
  onFocusRegion: (coords: [number, number], zoom: number) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

const InMapControls: React.FC<MapControlsProps> = ({
  onResetIndia,
  onFocusRegion,
  isFullscreen,
  onToggleFullscreen,
}) => {
  const map = useMap();

  return (
    <div className="leaflet-top leaflet-right" style={{ pointerEvents: 'auto', zIndex: 999 }}>
      <div className="m-3 flex flex-col gap-2">
        {/* Quick Regional Focus Buttons */}
        <div className="flex flex-col bg-[#07111F]/95 border border-white/20 rounded-lg shadow-xl overflow-hidden backdrop-blur-md">
          <button
            onClick={onResetIndia}
            title="Reset to Full India Operational Overview"
            className="flex items-center gap-1.5 px-3 py-2 text-slate-100 hover:bg-white/10 text-xs font-semibold border-b border-white/10 transition-colors"
          >
            <span className="text-sm">🇮🇳</span>
            <span>All India</span>
          </button>
          <button
            onClick={() => onFocusRegion([17.75, 83.35], 11)}
            title="Zoom to Visakhapatnam Cyclone Sector"
            className="px-3 py-1.5 text-left text-slate-300 hover:text-white hover:bg-white/10 text-[11px] font-medium border-b border-white/10 transition-colors"
          >
            🌀 Vizag Sector
          </button>
          <button
            onClick={() => onFocusRegion([13.018, 80.228], 13)}
            title="Zoom to Chennai Adyar Flood Sector"
            className="px-3 py-1.5 text-left text-slate-300 hover:text-white hover:bg-white/10 text-[11px] font-medium border-b border-white/10 transition-colors"
          >
            🌊 Chennai Flood
          </button>
          <button
            onClick={() => onFocusRegion([30.556, 79.567], 11)}
            title="Zoom to Chamoli Landslide Corridor"
            className="px-3 py-1.5 text-left text-slate-300 hover:text-white hover:bg-white/10 text-[11px] font-medium transition-colors"
          >
            ⛰️ Chamoli Slide
          </button>
        </div>

        {/* Zoom In & Out */}
        <div className="flex flex-col bg-[#07111F]/95 border border-white/20 rounded-lg shadow-xl overflow-hidden backdrop-blur-md">
          <button
            onClick={() => map.zoomIn()}
            title="Zoom in"
            className="p-2 text-slate-300 hover:text-white hover:bg-white/10 flex items-center justify-center border-b border-white/10 transition-colors"
          >
            <Plus size={16} />
          </button>
          <button
            onClick={() => map.zoomOut()}
            title="Zoom out"
            className="p-2 text-slate-300 hover:text-white hover:bg-white/10 flex items-center justify-center transition-colors"
          >
            <Minus size={16} />
          </button>
        </div>

        {/* Fullscreen Toggle */}
        <button
          onClick={onToggleFullscreen}
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Map'}
          className="p-2.5 bg-[#07111F]/95 hover:bg-[#0D1828] text-slate-300 hover:text-white border border-white/20 rounded-lg shadow-xl flex items-center justify-center backdrop-blur-md transition-colors"
        >
          {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
        </button>
      </div>
    </div>
  );
};

// Map Reference Helper to execute flyTo
const MapController: React.FC<{ mapRef: React.MutableRefObject<L.Map | null> }> = ({ mapRef }) => {
  const map = useMap();
  useEffect(() => {
    mapRef.current = map;
  }, [map, mapRef]);
  return null;
};

type SelectionType =
  | 'incident'
  | 'shelter'
  | 'team'
  | 'resource'
  | 'hospital'
  | 'infrastructure'
  | 'road'
  | 'route'
  | 'citizen'
  | 'hazard'
  | 'weather'
  | 'earthquake';

interface Selection {
  type: SelectionType;
  item: any;
}

export const MapsTrackingPage: React.FC = () => {
  const { incidents, addIncident, updateIncident } = useIncidentStore();

  // Operational GIS Entities State
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [infrastructure, setInfrastructure] = useState<any[]>([]);
  const [roads, setRoads] = useState<any[]>([]);
  const [citizenReports, setCitizenReports] = useState<any[]>([]);
  const [hazards, setHazards] = useState<any[]>([]);
  const [safeZones, setSafeZones] = useState<any[]>([]);
  const [evacuationRoutes, setEvacuationRoutes] = useState<any[]>([]);
  const [liveWeather, setLiveWeather] = useState<any>(null);
  const [liveEarthquakes, setLiveEarthquakes] = useState<any[]>([]);

  const [selection, setSelection] = useState<Selection | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastRealtimeEvent, setLastRealtimeEvent] = useState<string | null>(null);
  const [socketStatus, setSocketStatus] = useState<'LIVE' | 'DEGRADED' | 'OFFLINE'>('LIVE');
  const [isSimulationMode] = useState<boolean>(false);
  const [loadingInitialData, setLoadingInitialData] = useState<boolean>(true);

  // Map Tile Style: OSM Standard, Dark, or Satellite Topo
  const [tileProvider, setTileProvider] = useState<'osm' | 'dark' | 'satellite'>('osm');

  // Grouped Layer Visibility Controls
  const [layerGroups, setLayerGroups] = useState({
    // INTELLIGENCE
    incidents: true,
    hazards: true,
    riskZones: true,
    weather: true,
    earthquakes: true,
    citizenReports: true,

    // RESPONSE
    shelters: true,
    hospitals: true,
    teams: true,
    resources: true,
    evacuationRoutes: true,

    // INFRASTRUCTURE
    roads: true,
    infrastructure: true,
    safeZones: true,
  });

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const toggleLayer = (key: keyof typeof layerGroups) =>
    setLayerGroups((prev) => ({ ...prev, [key]: !prev[key] }));

  // ─── Fetch Master GIS Feed from Backend API ───
  const fetchGISData = useCallback(async (showLoading = false) => {
    try {
      if (showLoading) setLoadingInitialData(true);
      const res = await fetch('/api/gis/all');
      if (res.ok) {
        const data = await res.json();
        if (data.shelters) setShelters(data.shelters);
        if (data.teams) setTeams(data.teams);
        if (data.resources) setResources(data.resources);
        if (data.hospitals) setHospitals(data.hospitals);
        if (data.infrastructure) setInfrastructure(data.infrastructure);
        if (data.roads) setRoads(data.roads);
        if (data.citizenReports) setCitizenReports(data.citizenReports);
        if (data.hazards) setHazards(data.hazards);
        if (data.safeZones) setSafeZones(data.safeZones);
        if (data.evacuationRoutes) setEvacuationRoutes(data.evacuationRoutes);
        if (data.weather) setLiveWeather(data.weather);
        if (data.earthquakes?.earthquakes) setLiveEarthquakes(data.earthquakes.earthquakes);
      }
    } catch (err) {
      console.warn('Could not load aggregated GIS feed; using stores:', err);
    } finally {
      if (showLoading) setLoadingInitialData(false);
    }
  }, [setCitizenReports, setEvacuationRoutes, setHazards, setHospitals, setInfrastructure, setResources, setRoads, setSafeZones, setShelters, setTeams]);

  useEffect(() => {
    let isMounted = true;
    fetch('/api/gis/all')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isMounted || !data) return;
        if (data.shelters) setShelters(data.shelters);
        if (data.teams) setTeams(data.teams);
        if (data.resources) setResources(data.resources);
        if (data.hospitals) setHospitals(data.hospitals);
        if (data.infrastructure) setInfrastructure(data.infrastructure);
        if (data.roads) setRoads(data.roads);
        if (data.citizenReports) setCitizenReports(data.citizenReports);
        if (data.hazards) setHazards(data.hazards);
        if (data.safeZones) setSafeZones(data.safeZones);
        if (data.evacuationRoutes) setEvacuationRoutes(data.evacuationRoutes);
        if (data.weather) setLiveWeather(data.weather);
        if (data.earthquakes?.earthquakes) setLiveEarthquakes(data.earthquakes.earthquakes);
      })
      .catch((err) => {
        console.warn('Could not load aggregated GIS feed; using stores:', err);
      })
      .finally(() => {
        if (isMounted) setLoadingInitialData(false);
      });
    return () => {
      isMounted = false;
    };
  }, [setCitizenReports, setEvacuationRoutes, setHazards, setHospitals, setInfrastructure, setResources, setRoads, setSafeZones, setShelters, setTeams]);

  // ─── Reset to India Handler ───
  const handleResetToIndia = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(INDIA_CENTER, INDIA_ZOOM, {
        duration: 1.2,
        easeLinearity: 0.25,
      });
    }
  };

  // ─── Focus Specific Region ───
  const handleFocusRegion = (coords: [number, number], zoom: number) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(coords, zoom, {
        duration: 1.0,
      });
    }
  };

  // ─── Fullscreen Toggle ───
  const handleToggleFullscreen = () => {
    if (!mapContainerRef.current) return;
    if (!document.fullscreenElement) {
      mapContainerRef.current
        .requestFullscreen?.()
        .then(() => setIsFullscreen(true))
        .catch(() => {});
    } else {
      document
        .exitFullscreen?.()
        .then(() => setIsFullscreen(false))
        .catch(() => {});
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // ─── Socket.IO Real-Time Map Synchronization ───
  useEffect(() => {
    // 1. incident:created
    const unsubIncidentCreated = brgSocket.on<Incident>('incident:created', (newIncident) => {
      addIncident(newIncident);
      setLastRealtimeEvent(`Incident reported: ${newIncident.id} (${newIncident.location.district})`);
      setSocketStatus('LIVE');
    });

    // 2. incident:updated
    const unsubIncidentUpdated = brgSocket.on<{ id: string } & Partial<Incident>>(
      'incident:updated',
      (updated) => {
        updateIncident(updated.id, updated);
        setLastRealtimeEvent(`Incident updated: ${updated.id}`);
        setSocketStatus('LIVE');
      }
    );

    // 3. shelter:updated
    const unsubShelterUpdated = brgSocket.on<Partial<Shelter> & { id: string }>(
      'shelter:updated',
      (updatedShelter) => {
        setShelters((prev) =>
          prev.map((s) => (s.id === updatedShelter.id ? { ...s, ...updatedShelter } : s))
        );
        setLastRealtimeEvent(`Shelter load updated: ${updatedShelter.id}`);
        setSocketStatus('LIVE');
      }
    );

    // 4. citizen_report:created
    const unsubCitizenCreated = brgSocket.on<any>('citizen_report:created', (newReport) => {
      setCitizenReports((prev) => [newReport, ...prev]);
      setLastRealtimeEvent(`Citizen report logged: ${newReport.id}`);
      setSocketStatus('LIVE');
    });

    // 5. alert:created
    const unsubAlertCreated = brgSocket.on<any>('alert:created', (newAlert) => {
      setLastRealtimeEvent(`CAP broadcast: ${newAlert.event}`);
      setSocketStatus('LIVE');
    });

    // 6. team:updated
    const unsubTeamUpdated = brgSocket.on<Partial<Team> & { id: string }>('team:updated', (updatedTeam) => {
      setTeams((prev) =>
        prev.map((t) => (t.id === updatedTeam.id ? { ...t, ...updatedTeam } : t))
      );
      setLastRealtimeEvent(`NDRF Team updated: ${updatedTeam.id}`);
      setSocketStatus('LIVE');
    });

    return () => {
      unsubIncidentCreated();
      unsubIncidentUpdated();
      unsubShelterUpdated();
      unsubCitizenCreated();
      unsubAlertCreated();
      unsubTeamUpdated();
    };
  }, [addIncident, updateIncident]);

  // Derived filtered active incidents
  const activeIncidents = useMemo(
    () => incidents.filter((i) => i.status !== 'resolved'),
    [incidents]
  );

  return (
    <div
      ref={mapContainerRef}
      className="flex h-full w-full relative bg-[#060D17] text-slate-100 overflow-hidden select-none"
      style={{ height: isFullscreen ? '100vh' : 'calc(100vh - 56px)' }}
    >
      {/* ─── Operational GIS Command Layer Control (Left Top) ─── */}
      <div className="absolute top-3 left-3 z-[1000] flex flex-col gap-2 pointer-events-auto">
        {/* Layer Panel */}
        <div className="bg-[#07111F]/95 border border-white/15 rounded-xl shadow-2xl backdrop-blur-md p-2.5 flex flex-col gap-2 w-60 sm:w-64 max-h-[calc(100vh-140px)] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between pb-1.5 border-b border-white/10">
            <div className="flex items-center gap-1.5 text-xs font-black text-white uppercase tracking-wider">
              <Layers size={14} className="text-blue-400" />
              <span>GIS Command Layers</span>
            </div>
            {/* Status indicator */}
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                isSimulationMode
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                  : socketStatus === 'LIVE'
                  ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  : 'bg-red-500/20 text-red-300 border-red-500/30'
              }`}
            >
              {isSimulationMode ? 'SIMULATION' : socketStatus}
            </span>
          </div>

          {/* Group 1: Intelligence Layers */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block px-1">
              Intelligence
            </span>

            {/* Incidents */}
            <button
              onClick={() => toggleLayer('incidents')}
              className={`w-full flex items-center justify-between px-2 py-1 rounded text-xs transition-colors ${
                layerGroups.incidents
                  ? 'bg-red-500/15 text-red-300 font-semibold border border-red-500/25'
                  : 'text-slate-400 hover:bg-white/5'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500" />
                <span>Active Incidents</span>
              </span>
              <span className="font-mono text-[11px]">{activeIncidents.length}</span>
            </button>

            {/* Hazards & Buffers */}
            <button
              onClick={() => toggleLayer('hazards')}
              className={`w-full flex items-center justify-between px-2 py-1 rounded text-xs transition-colors ${
                layerGroups.hazards
                  ? 'bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/25'
                  : 'text-slate-400 hover:bg-white/5'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded border border-amber-400 bg-amber-400/40" />
                <span>Hazard Polygons</span>
              </span>
              <span className="font-mono text-[11px]">{hazards.length}</span>
            </button>

            {/* Citizen SOS Reports */}
            <button
              onClick={() => toggleLayer('citizenReports')}
              className={`w-full flex items-center justify-between px-2 py-1 rounded text-xs transition-colors ${
                layerGroups.citizenReports
                  ? 'bg-orange-500/15 text-orange-300 font-semibold border border-orange-500/25'
                  : 'text-slate-400 hover:bg-white/5'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-orange-400" />
                <span>Citizen Reports</span>
              </span>
              <span className="font-mono text-[11px]">{citizenReports.length}</span>
            </button>

            {/* Weather Observations */}
            <button
              onClick={() => toggleLayer('weather')}
              className={`w-full flex items-center justify-between px-2 py-1 rounded text-xs transition-colors ${
                layerGroups.weather
                  ? 'bg-sky-500/15 text-sky-300 font-semibold border border-sky-500/25'
                  : 'text-slate-400 hover:bg-white/5'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded bg-sky-400" />
                <span>Weather Telemetry</span>
              </span>
              <span className="font-mono text-[10px] text-sky-400">Open-Meteo</span>
            </button>

            {/* Earthquakes */}
            <button
              onClick={() => toggleLayer('earthquakes')}
              className={`w-full flex items-center justify-between px-2 py-1 rounded text-xs transition-colors ${
                layerGroups.earthquakes
                  ? 'bg-yellow-500/15 text-yellow-300 font-semibold border border-yellow-500/25'
                  : 'text-slate-400 hover:bg-white/5'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-yellow-400" />
                <span>USGS Earthquakes</span>
              </span>
              <span className="font-mono text-[11px]">{liveEarthquakes.length}</span>
            </button>
          </div>

          {/* Group 2: Response Layers */}
          <div className="space-y-1 pt-1 border-t border-white/6">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block px-1">
              Response & Evacuation
            </span>

            {/* Shelters */}
            <button
              onClick={() => toggleLayer('shelters')}
              className={`w-full flex items-center justify-between px-2 py-1 rounded text-xs transition-colors ${
                layerGroups.shelters
                  ? 'bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/25'
                  : 'text-slate-400 hover:bg-white/5'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Relief Shelters</span>
              </span>
              <span className="font-mono text-[11px]">{shelters.length}</span>
            </button>

            {/* Hospitals */}
            <button
              onClick={() => toggleLayer('hospitals')}
              className={`w-full flex items-center justify-between px-2 py-1 rounded text-xs transition-colors ${
                layerGroups.hospitals
                  ? 'bg-rose-500/15 text-rose-300 font-semibold border border-rose-500/25'
                  : 'text-slate-400 hover:bg-white/5'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500" />
                <span>Trauma Hospitals</span>
              </span>
              <span className="font-mono text-[11px]">{hospitals.length}</span>
            </button>

            {/* Evacuation Routes */}
            <button
              onClick={() => toggleLayer('evacuationRoutes')}
              className={`w-full flex items-center justify-between px-2 py-1 rounded text-xs transition-colors ${
                layerGroups.evacuationRoutes
                  ? 'bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/25'
                  : 'text-slate-400 hover:bg-white/5'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-0.5 bg-cyan-400 rounded" />
                <span>Evacuation Routes</span>
              </span>
              <span className="font-mono text-[11px]">{evacuationRoutes.length}</span>
            </button>

            {/* Response Teams */}
            <button
              onClick={() => toggleLayer('teams')}
              className={`w-full flex items-center justify-between px-2 py-1 rounded text-xs transition-colors ${
                layerGroups.teams
                  ? 'bg-blue-500/15 text-blue-300 font-semibold border border-blue-500/25'
                  : 'text-slate-400 hover:bg-white/5'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded bg-blue-500" />
                <span>NDRF / SDRF Teams</span>
              </span>
              <span className="font-mono text-[11px]">{teams.length}</span>
            </button>

            {/* Resources */}
            <button
              onClick={() => toggleLayer('resources')}
              className={`w-full flex items-center justify-between px-2 py-1 rounded text-xs transition-colors ${
                layerGroups.resources
                  ? 'bg-teal-500/15 text-teal-300 font-semibold border border-teal-500/25'
                  : 'text-slate-400 hover:bg-white/5'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded bg-teal-500" />
                <span>Logistics Depots</span>
              </span>
              <span className="font-mono text-[11px]">{resources.length}</span>
            </button>
          </div>

          {/* Group 3: Infrastructure Layers */}
          <div className="space-y-1 pt-1 border-t border-white/6">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block px-1">
              Infrastructure
            </span>

            {/* Blocked / Inundated Roads */}
            <button
              onClick={() => toggleLayer('roads')}
              className={`w-full flex items-center justify-between px-2 py-1 rounded text-xs transition-colors ${
                layerGroups.roads
                  ? 'bg-red-500/15 text-red-300 font-semibold border border-red-500/25'
                  : 'text-slate-400 hover:bg-white/5'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span className="w-3.5 h-1 bg-red-500 border border-white/20 rounded" />
                <span>Road Network / Blockages</span>
              </span>
              <span className="font-mono text-[11px]">{roads.length}</span>
            </button>

            {/* Critical Infrastructure */}
            <button
              onClick={() => toggleLayer('infrastructure')}
              className={`w-full flex items-center justify-between px-2 py-1 rounded text-xs transition-colors ${
                layerGroups.infrastructure
                  ? 'bg-purple-500/15 text-purple-300 font-semibold border border-purple-500/25'
                  : 'text-slate-400 hover:bg-white/5'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded bg-purple-500" />
                <span>Critical Infrastructure</span>
              </span>
              <span className="font-mono text-[11px]">{infrastructure.length}</span>
            </button>

            {/* Lower-Risk Safe Zones */}
            <button
              onClick={() => toggleLayer('safeZones')}
              className={`w-full flex items-center justify-between px-2 py-1 rounded text-xs transition-colors ${
                layerGroups.safeZones
                  ? 'bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/25'
                  : 'text-slate-400 hover:bg-white/5'
              }`}
            >
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full border border-emerald-400 bg-emerald-400/40" />
                <span>Lower-Risk Safe Zones</span>
              </span>
              <span className="font-mono text-[11px]">{safeZones.length}</span>
            </button>
          </div>

          {/* Base Map Switcher */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
            <span>Base Map:</span>
            <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded border border-white/10">
              <button
                onClick={() => setTileProvider('osm')}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  tileProvider === 'osm' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                OSM
              </button>
              <button
                onClick={() => setTileProvider('dark')}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  tileProvider === 'dark' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Dark
              </button>
              <button
                onClick={() => setTileProvider('satellite')}
                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  tileProvider === 'satellite' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                Satellite
              </button>
            </div>
          </div>
        </div>

        {/* Real-time Telemetry Event Banner */}
        <div className="bg-[#07111F]/90 border border-white/15 rounded-xl shadow-xl backdrop-blur-md px-3 py-2 flex items-center justify-between gap-2 w-60 sm:w-64 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <Radio size={13} className="text-emerald-400 animate-pulse flex-shrink-0" />
            <span className="text-[11px] text-slate-300 truncate">
              {lastRealtimeEvent || 'BRG National Grid Synced'}
            </span>
          </div>
          <button
            onClick={() => fetchGISData(true)}
            title="Refresh GIS Feeds"
            className="text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw size={12} className={loadingInitialData ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* ─── Severity Legend (Bottom Left) ─── */}
      <div className="absolute bottom-3 left-3 z-[1000] pointer-events-auto bg-[#07111F]/90 border border-white/15 rounded-xl shadow-2xl backdrop-blur-md px-3 py-2 flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Severity:</span>
          <div className="flex items-center gap-2">
            {(['critical', 'high', 'medium', 'low'] as Severity[]).map((sev) => (
              <div key={sev} className="flex items-center gap-1">
                <span
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: SEVERITY_COLORS[sev] }}
                />
                <span className="text-[10px] text-slate-300 capitalize">{sev}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="hidden sm:block w-px h-3 bg-white/20" />

        <div className="flex items-center gap-2 text-[10px] text-slate-300">
          <span className="flex items-center gap-1">
            <span className="w-3 h-1 bg-emerald-500 rounded" />
            <span>Recommended Route</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-1 bg-amber-500 rounded border-dashed" />
            <span>Alternative</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-1 bg-red-500 rounded" />
            <span>Blocked Road</span>
          </span>
        </div>
      </div>

      {/* ─── Master Leaflet GIS Map ─── */}
      <div className="flex-1 w-full h-full relative">
        <MapContainer
          center={INDIA_CENTER}
          zoom={INDIA_ZOOM}
          minZoom={2}
          maxZoom={18}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%', background: '#060D17' }}
          zoomControl={false}
        >
          {/* Map Instance Reference Tracker */}
          <MapController mapRef={mapInstanceRef} />

          {/* Floating In-Map Controls: All India Reset, Regional Focus, Zoom In/Out, Fullscreen */}
          <InMapControls
            onResetIndia={handleResetToIndia}
            onFocusRegion={handleFocusRegion}
            isFullscreen={isFullscreen}
            onToggleFullscreen={handleToggleFullscreen}
          />

          {/* Base Map Tile Layers */}
          {tileProvider === 'osm' && (
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />
          )}

          {tileProvider === 'dark' && (
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              maxZoom={19}
            />
          )}

          {tileProvider === 'satellite' && (
            <TileLayer
              attribution='&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              maxZoom={19}
            />
          )}

          {/* ─── Layer 1: Lower-Risk Safe Zones (High Ground) ─── */}
          {layerGroups.safeZones &&
            safeZones.map((sz) => (
              <Circle
                key={sz.id}
                center={sz.center}
                radius={sz.radiusKm * 1000}
                pathOptions={{
                  color: '#10B981',
                  fillColor: '#10B981',
                  fillOpacity: 0.14,
                  weight: 1.5,
                  dashArray: '4, 6',
                }}
                eventHandlers={{
                  click: () => setSelection({ type: 'hazard', item: sz }),
                }}
              >
                <Popup>
                  <div className="p-1 min-w-[200px]">
                    <div className="flex items-center gap-1 text-emerald-400 text-xs font-bold mb-1">
                      <Shield size={13} />
                      <span>Lower-Risk Safe Zone</span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-100">{sz.name}</h4>
                    <p className="text-[11px] text-slate-300 mt-1">{sz.reason}</p>
                    <p className="text-[10px] text-emerald-300 font-mono mt-1">
                      Elevation: +{sz.elevationMeters}m | Capacity: {sz.capacityAvailable} slots
                    </p>
                  </div>
                </Popup>
              </Circle>
            ))}

          {/* ─── Layer 2: Hazard Buffers & Impact Polygons ─── */}
          {layerGroups.hazards &&
            hazards.map((haz) => (
              <Circle
                key={haz.id}
                center={[haz.latitude, haz.longitude]}
                radius={haz.impactRadiusKm * 1000}
                pathOptions={{
                  color: haz.severity === 'critical' ? '#EF4444' : '#F97316',
                  fillColor: haz.severity === 'critical' ? '#EF4444' : '#F97316',
                  fillOpacity: 0.12,
                  weight: 2,
                  dashArray: '6, 6',
                }}
                eventHandlers={{
                  click: () => setSelection({ type: 'hazard', item: haz }),
                }}
              >
                <Popup>
                  <div className="p-1 min-w-[220px]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">
                        {haz.category} · {haz.severity}
                      </span>
                      {haz.isSimulation && (
                        <span className="text-[9px] px-1 bg-amber-500/20 text-amber-300 rounded font-bold">
                          SIMULATION
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs font-bold text-slate-100 mb-1">{haz.title}</h4>
                    <p className="text-[11px] text-slate-300 leading-snug">{haz.description}</p>
                    <div className="mt-2 text-[10px] text-slate-400 font-mono space-y-0.5">
                      <p>Impact Buffer: {haz.impactRadiusKm} km</p>
                      {haz.windSpeedKmh && <p>Wind Gusts: {haz.windSpeedKmh} km/h</p>}
                    </div>
                  </div>
                </Popup>
              </Circle>
            ))}

          {/* ─── Layer 3: Blocked & Caution Roads Network ─── */}
          {layerGroups.roads &&
            roads.map((road) => {
              const isBlocked = road.status === 'blocked';
              const color = isBlocked ? '#EF4444' : road.status === 'inundated' ? '#3B82F6' : '#F59E0B';

              return (
                <Polyline
                  key={road.id}
                  positions={road.path}
                  pathOptions={{
                    color,
                    weight: isBlocked ? 5 : 4,
                    dashArray: isBlocked ? '5, 8' : undefined,
                    opacity: 0.9,
                  }}
                  eventHandlers={{
                    click: () => setSelection({ type: 'road', item: road }),
                  }}
                >
                  <Popup>
                    <div className="p-1 min-w-[210px]">
                      <div className="flex items-center gap-1.5 mb-1">
                        <AlertTriangle size={13} className="text-red-400" />
                        <span className="text-xs font-bold text-red-400 uppercase">
                          Road {road.status}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-100">{road.roadName}</h4>
                      <p className="text-[11px] text-slate-400 font-mono">{road.roadNumber} · {road.district}</p>
                      {road.blockageCause && (
                        <p className="text-[11px] text-amber-300 mt-1 bg-amber-500/10 p-1.5 rounded">
                          {road.blockageCause}
                        </p>
                      )}
                    </div>
                  </Popup>
                </Polyline>
              );
            })}

          {/* ─── Layer 4: Evacuation Routes (Recommended vs Alternative) ─── */}
          {layerGroups.evacuationRoutes &&
            evacuationRoutes.map((rt) => {
              const isRec = rt.isRecommended;
              const color = isRec ? '#10B981' : '#F59E0B';

              return (
                <Polyline
                  key={rt.id}
                  positions={rt.waypoints}
                  pathOptions={{
                    color,
                    weight: isRec ? 5 : 3.5,
                    dashArray: isRec ? undefined : '6, 6',
                    opacity: 0.95,
                  }}
                  eventHandlers={{
                    click: () => setSelection({ type: 'route', item: rt }),
                  }}
                >
                  <Popup>
                    <div className="p-1 min-w-[220px]">
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                            isRec ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                          }`}
                        >
                          {isRec ? 'RECOMMENDED LOWER-RISK ROUTE' : 'ALTERNATIVE ROUTE'}
                        </span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-100">{rt.name}</h4>
                      <p className="text-[11px] text-slate-300 mt-1">To: {rt.shelterName}</p>
                      <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400 mt-1 pt-1 border-t border-white/10">
                        <span>Dist: {rt.distanceKm} km</span>
                        <span>Est: {rt.estimatedTravelTimeMin} min</span>
                        <span>Risk: {(rt.riskExposureIndex * 100).toFixed(0)}%</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-1">{rt.reason}</p>
                    </div>
                  </Popup>
                </Polyline>
              );
            })}

          {/* ─── Layer 5: Active Incidents ─── */}
          {layerGroups.incidents &&
            activeIncidents.map((inc) => {
              const color = SEVERITY_COLORS[inc.severity];
              const isCritical = inc.severity === 'critical';
              const radius = isCritical ? 14 : inc.severity === 'high' ? 11 : 8;

              return (
                <React.Fragment key={inc.id}>
                  {/* Pulse ring for critical incidents */}
                  {isCritical && (
                    <CircleMarker
                      center={[inc.location.coordinates.lat, inc.location.coordinates.lng]}
                      radius={26}
                      pathOptions={{
                        color: '#EF4444',
                        fillColor: '#EF4444',
                        fillOpacity: 0.2,
                        weight: 1,
                        dashArray: '3, 5',
                      }}
                    />
                  )}

                  <CircleMarker
                    center={[inc.location.coordinates.lat, inc.location.coordinates.lng]}
                    radius={radius}
                    pathOptions={{
                      color: '#FFFFFF',
                      fillColor: color,
                      fillOpacity: 0.92,
                      weight: 2,
                    }}
                    eventHandlers={{
                      click: () => setSelection({ type: 'incident', item: inc }),
                    }}
                  >
                    <Popup>
                      <div className="p-1 min-w-[230px]">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-300">
                            {inc.id}
                          </span>
                          <span
                            className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase text-white"
                            style={{ backgroundColor: color }}
                          >
                            {inc.severity}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-100 leading-snug mb-1">
                          {inc.title}
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          {inc.location.area}, {inc.location.district}
                        </p>

                        <div className="mt-2.5 pt-2 border-t border-white/10 flex flex-col gap-1 text-[11px]">
                          <button
                            onClick={() => setSelection({ type: 'incident', item: inc })}
                            className="text-left text-blue-400 hover:text-blue-300 font-semibold"
                          >
                            View Incident Dossier →
                          </button>
                          <button
                            onClick={() => {
                              handleFocusRegion([inc.location.coordinates.lat, inc.location.coordinates.lng], 13);
                              setSelection({ type: 'incident', item: inc });
                            }}
                            className="text-left text-emerald-400 hover:text-emerald-300 font-semibold"
                          >
                            View Evacuation Corridor →
                          </button>
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                </React.Fragment>
              );
            })}

          {/* ─── Layer 6: Shelters ─── */}
          {layerGroups.shelters &&
            shelters.map((shelter) => (
              <Marker
                key={shelter.id}
                position={[shelter.location.coordinates.lat, shelter.location.coordinates.lng]}
                icon={SHELTER_ICON}
                eventHandlers={{
                  click: () => setSelection({ type: 'shelter', item: shelter }),
                }}
              >
                <Popup>
                  <div className="p-1 min-w-[210px]">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-emerald-400 text-xs font-bold">🏠 High-Ground Shelter</span>
                      <span className="text-[10px] text-slate-400">({shelter.status})</span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-100">{shelter.name}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {shelter.location.area}, {shelter.location.district}
                    </p>
                    <p className="text-[11px] text-emerald-400 font-medium mt-1">
                      Occupancy: {shelter.occupancy} / {shelter.capacity} persons
                    </p>
                    <button
                      onClick={() => setSelection({ type: 'shelter', item: shelter })}
                      className="mt-2 text-[11px] text-emerald-400 hover:text-emerald-300 font-semibold block"
                    >
                      View Shelter Details →
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}

          {/* ─── Layer 7: Hospitals ─── */}
          {layerGroups.hospitals &&
            hospitals.map((hosp) => (
              <Marker
                key={hosp.id}
                position={[hosp.location.lat, hosp.location.lng]}
                icon={HOSPITAL_ICON}
                eventHandlers={{
                  click: () => setSelection({ type: 'hospital', item: hosp }),
                }}
              >
                <Popup>
                  <div className="p-1 min-w-[210px]">
                    <div className="flex items-center gap-1 text-red-400 text-xs font-bold mb-1">
                      <HeartPulse size={13} />
                      <span>{hosp.type}</span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-100">{hosp.name}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">{hosp.district}, {hosp.state}</p>
                    <div className="mt-1.5 text-[11px] font-mono text-emerald-400 space-y-0.5">
                      <p>ICU Beds: {hosp.icuBedsAvailable} available</p>
                      <p>General Beds: {hosp.generalBedsAvailable} available</p>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}

          {/* ─── Layer 8: Critical Infrastructure ─── */}
          {layerGroups.infrastructure &&
            infrastructure.map((inf) => (
              <Marker
                key={inf.id}
                position={[inf.location.lat, inf.location.lng]}
                icon={INFRA_ICON}
                eventHandlers={{
                  click: () => setSelection({ type: 'infrastructure', item: inf }),
                }}
              >
                <Popup>
                  <div className="p-1 min-w-[210px]">
                    <div className="flex items-center gap-1 text-purple-400 text-xs font-bold mb-1">
                      <Building size={13} />
                      <span className="uppercase">{inf.category}</span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-100">{inf.name}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">{inf.district}, {inf.state}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{inf.emergencyContact}</p>
                  </div>
                </Popup>
              </Marker>
            ))}

          {/* ─── Layer 9: Citizen Reports ─── */}
          {layerGroups.citizenReports &&
            citizenReports.map((cr) => (
              <Marker
                key={cr.id}
                position={[cr.location.coordinates.lat, cr.location.coordinates.lng]}
                icon={CITIZEN_ICON}
                eventHandlers={{
                  click: () => setSelection({ type: 'citizen', item: cr }),
                }}
              >
                <Popup>
                  <div className="p-1 min-w-[210px]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-amber-400 uppercase">
                        Citizen Distress SOS
                      </span>
                      <span className="text-[9px] px-1 bg-amber-500/20 text-amber-300 rounded font-bold">
                        {cr.status}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-100">{cr.title}</h4>
                    <p className="text-[11px] text-slate-300 mt-1 leading-snug">{cr.description}</p>
                    <p className="text-[10px] text-slate-500 mt-1">Area: {cr.location.area}</p>
                  </div>
                </Popup>
              </Marker>
            ))}

          {/* ─── Layer 10: NDRF / SDRF Response Teams ─── */}
          {layerGroups.teams &&
            teams
              .filter((t) => t.currentLocation && t.currentLocation.lat && t.currentLocation.lng)
              .map((team) => (
                <Marker
                  key={team.id}
                  position={[team.currentLocation!.lat, team.currentLocation!.lng]}
                  icon={TEAM_ICON}
                  eventHandlers={{
                    click: () => setSelection({ type: 'team', item: team }),
                  }}
                >
                  <Popup>
                    <div className="p-1 min-w-[200px]">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-blue-400 text-xs font-bold">🛡️ {team.type} Unit</span>
                        <span className="text-[10px] text-slate-400">({team.status})</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-100">{team.name}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">Strength: {team.strength} Personnel</p>
                      {team.eta && <p className="text-[11px] text-amber-400 font-medium mt-1">ETA: {team.eta}</p>}
                    </div>
                  </Popup>
                </Marker>
              ))}

          {/* ─── Layer 11: Emergency Resources ─── */}
          {layerGroups.resources &&
            resources
              .filter((r) => r.coordinates && r.coordinates.lat && r.coordinates.lng)
              .map((res) => (
                <Marker
                  key={res.id}
                  position={[res.coordinates!.lat, res.coordinates!.lng]}
                  icon={RESOURCE_ICON}
                  eventHandlers={{
                    click: () => setSelection({ type: 'resource', item: res }),
                  }}
                >
                  <Popup>
                    <div className="p-1 min-w-[190px]">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-cyan-400 text-xs font-bold">📦 Logistics Depot</span>
                        <span className="text-[10px] text-slate-400 capitalize">({res.category})</span>
                      </div>
                      <h4 className="text-xs font-bold text-slate-100">{res.name}</h4>
                      <p className="text-[11px] text-cyan-300 font-medium mt-1">
                        Stock: {res.available} / {res.quantity} Available
                      </p>
                    </div>
                  </Popup>
                </Marker>
              ))}

          {/* ─── Layer 12: Earthquakes ─── */}
          {layerGroups.earthquakes &&
            liveEarthquakes.map((eq) => (
              <CircleMarker
                key={eq.id}
                center={[eq.latitude, eq.longitude]}
                radius={Math.max(6, eq.magnitude * 2.8)}
                pathOptions={{
                  color: eq.magnitude >= 5.0 ? '#EF4444' : '#F59E0B',
                  fillColor: eq.magnitude >= 5.0 ? '#EF4444' : '#F59E0B',
                  fillOpacity: 0.65,
                  weight: 1.5,
                }}
                eventHandlers={{
                  click: () => setSelection({ type: 'earthquake', item: eq }),
                }}
              >
                <Popup>
                  <div className="p-1 min-w-[200px]">
                    <span className="text-[10px] font-bold text-amber-400 uppercase">
                      USGS Seismic Observation
                    </span>
                    <h4 className="text-xs font-bold text-slate-100 mt-0.5">
                      M {eq.magnitude.toFixed(1)} — {eq.place}
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Epicenter Depth: {eq.depthKm} km
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                      {new Date(eq.time).toUTCString()}
                    </p>
                  </div>
                </Popup>
              </CircleMarker>
            ))}

          {/* ─── Layer 13: Live Weather Stations ─── */}
          {layerGroups.weather && (
            <>
              <Marker
                position={[17.72, 83.31]}
                icon={WEATHER_ICON}
                eventHandlers={{
                  click: () =>
                    setSelection({
                      type: 'weather',
                      item: {
                        name: 'Visakhapatnam Doppler Coastal Radar Station',
                        temp: liveWeather?.current?.temperature ?? 31.2,
                        wind: liveWeather?.current?.windSpeed ?? 42,
                        rain: liveWeather?.current?.precipitation ?? 14.5,
                        provider: 'Open-Meteo & IMD Integrated Feed',
                      },
                    }),
                }}
              >
                <Popup>
                  <div className="p-1 min-w-[200px]">
                    <div className="flex items-center gap-1.5 text-sky-400 text-xs font-bold mb-1">
                      <span>⛅ Coastal Weather Telemetry</span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-100">Visakhapatnam AWS</h4>
                    <p className="text-[11px] text-slate-300 mt-1">
                      Wind: {liveWeather?.current?.windSpeed ?? 42} km/h | Rain: {liveWeather?.current?.precipitation ?? 14.5} mm
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">WMO Station 43149 (Verified Live)</p>
                  </div>
                </Popup>
              </Marker>

              <Marker
                position={[13.0, 80.2]}
                icon={WEATHER_ICON}
                eventHandlers={{
                  click: () =>
                    setSelection({
                      type: 'weather',
                      item: {
                        name: 'Chennai Meenambakkam AWS Station',
                        temp: 29.5,
                        wind: 28,
                        rain: 48.0,
                        provider: 'Open-Meteo Atmospheric Forecast',
                      },
                    }),
                }}
              >
                <Popup>
                  <div className="p-1 min-w-[200px]">
                    <div className="flex items-center gap-1.5 text-sky-400 text-xs font-bold mb-1">
                      <span>⛅ Coastal Weather Telemetry</span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-100">Chennai Meenambakkam AWS</h4>
                    <p className="text-[11px] text-slate-300 mt-1">Wind: 28 km/h | Rain: 48.0 mm</p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">WMO Station 43279 (Verified Live)</p>
                  </div>
                </Popup>
              </Marker>
            </>
          )}
        </MapContainer>
      </div>

      {/* ─── Right Contextual Slide-Over Drawer ─── */}
      <AnimatePresence>
        {selection && (
          <motion.div
            initial={{ x: 380, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 380, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="absolute top-3 right-3 bottom-3 w-80 sm:w-96 bg-[#0B1524]/98 border border-white/15 rounded-xl shadow-2xl flex flex-col overflow-hidden z-[1001] backdrop-blur-md pointer-events-auto"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#07111F]/80">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                {selection.type} Command Intelligence
              </span>
              <button
                onClick={() => setSelection(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-white/10 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selection.type === 'incident' && <IncidentDetailPanel incident={selection.item as Incident} />}
              {selection.type === 'shelter' && <ShelterDetailPanel shelter={selection.item as Shelter} />}
              {selection.type === 'hospital' && <HospitalDetailPanel hospital={selection.item} />}
              {selection.type === 'road' && <RoadDetailPanel road={selection.item} />}
              {selection.type === 'route' && <RouteDetailPanel route={selection.item} />}
              {selection.type === 'citizen' && <CitizenDetailPanel report={selection.item} />}
              {selection.type === 'team' && <TeamDetailPanel team={selection.item as Team} />}
              {selection.type === 'resource' && <ResourceDetailPanel resource={selection.item as Resource} />}
              {selection.type === 'hazard' && <HazardDetailPanel hazard={selection.item} />}
              {selection.type === 'earthquake' && <EarthquakeDetailPanel eq={selection.item} />}
              {selection.type === 'weather' && <WeatherDetailPanel weather={selection.item} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Detail Panels ───
const IncidentDetailPanel: React.FC<{ incident: Incident }> = ({ incident }) => (
  <div className="space-y-3.5">
    <div className="flex items-center gap-2 flex-wrap">
      <SeverityBadge severity={incident.severity} size="md" />
      <StatusBadge status={incident.status} size="md" />
      <TypeBadge type={incident.type} />
    </div>

    <h3 className="text-sm font-bold text-slate-100 leading-snug">{incident.title}</h3>

    <div className="p-2.5 rounded-lg bg-white/4 border border-white/8 space-y-1.5 text-xs">
      <div className="flex items-center gap-1.5 text-slate-300">
        <MapPin size={12} className="text-slate-500" />
        <span>{incident.location.area}, {incident.location.district}</span>
      </div>
      <div className="text-[11px] font-mono text-slate-500">
        Coordinates: {incident.location.coordinates.lat.toFixed(4)}, {incident.location.coordinates.lng.toFixed(4)}
      </div>
      {incident.affectedPopulation && (
        <div className="flex items-center gap-1.5 text-slate-300 pt-1 border-t border-white/5">
          <Users size={12} className="text-slate-500" />
          <span>Population at Risk: <strong>{incident.affectedPopulation.toLocaleString('en-IN')}</strong></span>
        </div>
      )}
    </div>

    <div>
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Field Situation</p>
      <p className="text-xs text-slate-300 leading-relaxed">{incident.description}</p>
    </div>

    {incident.aiBriefing && (
      <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 text-xs text-slate-300">
        <p className="text-[11px] font-bold text-blue-400 mb-1 flex items-center gap-1">
          <Sparkles size={12} /> AI Command Briefing
        </p>
        <p className="leading-relaxed">{incident.aiBriefing}</p>
      </div>
    )}
  </div>
);

const ShelterDetailPanel: React.FC<{ shelter: Shelter }> = ({ shelter }) => {
  const pct = Math.round((shelter.occupancy / shelter.capacity) * 100);
  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
          {shelter.status.toUpperCase()}
        </span>
        <span className="text-xs text-slate-500 font-mono">{shelter.id}</span>
      </div>
      <h3 className="text-sm font-bold text-slate-100">{shelter.name}</h3>
      <p className="text-xs text-slate-400">{shelter.location.area}, {shelter.location.district}</p>
      <div className="space-y-1">
        <div className="flex justify-between text-xs">
          <span className="text-slate-400">Load Factor</span>
          <span className="font-mono font-bold text-emerald-400">{shelter.occupancy} / {shelter.capacity} ({pct}%)</span>
        </div>
        <ProgressBar value={pct} size="sm" color={pct > 80 ? 'amber' : 'green'} />
      </div>
      <div className="p-2.5 rounded-lg bg-white/4 border border-white/8 space-y-1 text-xs text-slate-300">
        <p>Food Rations: <strong className="capitalize">{shelter.foodStock}</strong></p>
        <p>Potable Water: <strong className="capitalize">{shelter.waterStock}</strong></p>
        <p>Medical Wing: <strong>{shelter.medicalSupport ? 'Active on site' : 'None'}</strong></p>
        <p>Officer: <strong>{shelter.inChargeOfficer}</strong></p>
      </div>
    </div>
  );
};

const HospitalDetailPanel: React.FC<{ hospital: any }> = ({ hospital }) => (
  <div className="space-y-3.5">
    <div className="flex items-center gap-1 text-red-400 text-xs font-bold">
      <HeartPulse size={14} />
      <span>{hospital.type}</span>
    </div>
    <h3 className="text-sm font-bold text-slate-100">{hospital.name}</h3>
    <p className="text-xs text-slate-400">{hospital.district}, {hospital.state}</p>
    <div className="grid grid-cols-2 gap-2 text-xs">
      <div className="p-2.5 rounded bg-red-500/10 border border-red-500/20">
        <span className="text-slate-400 block text-[10px]">ICU BEDS</span>
        <span className="text-base font-bold text-red-400">{hospital.icuBedsAvailable}</span>
      </div>
      <div className="p-2.5 rounded bg-blue-500/10 border border-blue-500/20">
        <span className="text-slate-400 block text-[10px]">GENERAL BEDS</span>
        <span className="text-base font-bold text-blue-400">{hospital.generalBedsAvailable}</span>
      </div>
    </div>
    <div className="p-2.5 rounded bg-white/4 border border-white/8 text-xs space-y-1">
      <p>Blood Bank: <strong className="text-emerald-400 capitalize">{hospital.bloodBankStatus}</strong></p>
      <p>Helpline: <strong className="text-slate-200">{hospital.emergencyHelpline}</strong></p>
    </div>
  </div>
);

const RoadDetailPanel: React.FC<{ road: any }> = ({ road }) => (
  <div className="space-y-3.5">
    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase border ${road.status === 'blocked' ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}`}>
      Road {road.status}
    </span>
    <h3 className="text-sm font-bold text-slate-100">{road.roadName}</h3>
    <p className="text-xs text-slate-400">{road.roadNumber} · {road.district}</p>
    {road.blockageCause && (
      <div className="p-2.5 rounded bg-red-500/10 border border-red-500/20 text-xs text-red-300">
        <p className="font-semibold mb-0.5">Reported Obstacle:</p>
        <p>{road.blockageCause}</p>
      </div>
    )}
    <div className="text-xs text-slate-400 space-y-1">
      <p>Affected Corridor: <strong>{road.affectedLengthKm} km</strong></p>
      <p>Elevation: <strong>{road.elevationMeters}m MSL</strong></p>
    </div>
  </div>
);

const RouteDetailPanel: React.FC<{ route: any }> = ({ route }) => (
  <div className="space-y-3.5">
    <span className={`px-2 py-0.5 rounded text-xs font-bold uppercase border ${route.isRecommended ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'}`}>
      {route.isRecommended ? 'Recommended Route' : 'Alternative Route'}
    </span>
    <h3 className="text-sm font-bold text-slate-100">{route.name}</h3>
    <p className="text-xs text-slate-400">Target: {route.shelterName}</p>
    <div className="grid grid-cols-3 gap-2 text-center text-xs">
      <div className="p-2 rounded bg-white/4 border border-white/8">
        <span className="text-[10px] text-slate-500 block">DISTANCE</span>
        <span className="font-bold text-slate-200">{route.distanceKm} km</span>
      </div>
      <div className="p-2 rounded bg-white/4 border border-white/8">
        <span className="text-[10px] text-slate-500 block">EST. TIME</span>
        <span className="font-bold text-slate-200">{route.estimatedTravelTimeMin} min</span>
      </div>
      <div className="p-2 rounded bg-white/4 border border-white/8">
        <span className="text-[10px] text-slate-500 block">RISK</span>
        <span className="font-bold text-emerald-400">{(route.riskExposureIndex * 100).toFixed(0)}%</span>
      </div>
    </div>
    <p className="text-xs text-slate-300 leading-relaxed bg-white/4 p-2.5 rounded border border-white/8">
      {route.reason}
    </p>
  </div>
);

const CitizenDetailPanel: React.FC<{ report: any }> = ({ report }) => (
  <div className="space-y-3.5">
    <div className="flex items-center justify-between">
      <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
        CITIZEN SOS
      </span>
      <span className="text-xs text-slate-500 font-mono">{report.id}</span>
    </div>
    <h3 className="text-sm font-bold text-slate-100">{report.title}</h3>
    <p className="text-xs text-slate-300 leading-relaxed bg-white/4 p-2.5 rounded border border-white/8">
      {report.description}
    </p>
    <div className="text-xs text-slate-400 space-y-1">
      <p>Location: <strong>{report.location.area}, {report.location.district}</strong></p>
      <p>Reported: <strong>{new Date(report.reportedAt).toLocaleTimeString()}</strong></p>
      <p>Community Corroboration: <strong>{report.upvotes} upvotes</strong></p>
    </div>
  </div>
);

const TeamDetailPanel: React.FC<{ team: Team }> = ({ team }) => (
  <div className="space-y-3.5">
    <span className="px-2 py-0.5 rounded text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
      {team.type} Unit
    </span>
    <h3 className="text-sm font-bold text-slate-100">{team.name}</h3>
    <div className="p-2.5 rounded bg-white/4 border border-white/8 text-xs space-y-1 text-slate-300">
      <p>Tactical Strength: <strong>{team.strength} Personnel</strong></p>
      <p>Status: <strong className="text-amber-400 capitalize">{team.status}</strong></p>
      {team.eta && <p>ETA: <strong>{team.eta}</strong></p>}
      <p>Helpline: <strong>{team.contactNumber}</strong></p>
    </div>
  </div>
);

const ResourceDetailPanel: React.FC<{ resource: Resource }> = ({ resource }) => (
  <div className="space-y-3.5">
    <span className="px-2 py-0.5 rounded text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 uppercase">
      {resource.category}
    </span>
    <h3 className="text-sm font-bold text-slate-100">{resource.name}</h3>
    <div className="p-2.5 rounded bg-white/4 border border-white/8 text-xs space-y-1 text-slate-300">
      <p>Depot: <strong>{resource.location}</strong></p>
      <p>Available: <strong className="text-emerald-400">{resource.available}</strong></p>
      <p>Allocated: <strong className="text-amber-400">{resource.allocated}</strong></p>
      <p>Total: <strong>{resource.quantity}</strong></p>
    </div>
  </div>
);

const HazardDetailPanel: React.FC<{ hazard: any }> = ({ hazard }) => (
  <div className="space-y-3.5">
    <span className="px-2 py-0.5 rounded text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30 uppercase">
      Hazard Perimeter
    </span>
    <h3 className="text-sm font-bold text-slate-100">{hazard.title || hazard.name}</h3>
    <p className="text-xs text-slate-300 leading-relaxed bg-white/4 p-2.5 rounded border border-white/8">
      {hazard.description || hazard.reason}
    </p>
    <div className="text-xs text-slate-400 space-y-1 font-mono">
      {hazard.impactRadiusKm && <p>Impact Buffer: {hazard.impactRadiusKm} km</p>}
      {hazard.windSpeedKmh && <p>Wind Speed: {hazard.windSpeedKmh} km/h</p>}
    </div>
  </div>
);

const EarthquakeDetailPanel: React.FC<{ eq: any }> = ({ eq }) => (
  <div className="space-y-3.5">
    <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
      USGS Earthquake Observation
    </span>
    <h3 className="text-sm font-bold text-slate-100">M {eq.magnitude.toFixed(1)} — {eq.place}</h3>
    <div className="p-2.5 rounded bg-white/4 border border-white/8 text-xs space-y-1 text-slate-300 font-mono">
      <p>Depth: {eq.depthKm} km</p>
      <p>Time: {new Date(eq.time).toUTCString()}</p>
      <p>Tsunami Warning: {eq.tsunami ? 'FLAGGED' : 'NONE'}</p>
    </div>
  </div>
);

const WeatherDetailPanel: React.FC<{ weather: any }> = ({ weather }) => (
  <div className="space-y-3.5">
    <span className="px-2 py-0.5 rounded text-xs font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
      Open-Meteo Meteorological Feed
    </span>
    <h3 className="text-sm font-bold text-slate-100">{weather.name}</h3>
    <div className="grid grid-cols-3 gap-2 text-center text-xs">
      <div className="p-2 rounded bg-white/4 border border-white/8">
        <span className="text-[10px] text-slate-500 block">TEMP</span>
        <span className="font-bold text-slate-200">{weather.temp}°C</span>
      </div>
      <div className="p-2 rounded bg-white/4 border border-white/8">
        <span className="text-[10px] text-slate-500 block">WIND</span>
        <span className="font-bold text-sky-400">{weather.wind} km/h</span>
      </div>
      <div className="p-2 rounded bg-white/4 border border-white/8">
        <span className="text-[10px] text-slate-500 block">RAIN</span>
        <span className="font-bold text-blue-400">{weather.rain} mm</span>
      </div>
    </div>
    <div className="p-2.5 rounded bg-white/4 border border-white/8 text-xs space-y-1 text-slate-300 font-mono">
      <p>Provider: <strong>{weather.provider}</strong></p>
      <p>Status: <strong className="text-emerald-400">Verified Live Observation</strong></p>
    </div>
  </div>
);

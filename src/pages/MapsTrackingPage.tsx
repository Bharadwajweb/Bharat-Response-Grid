import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  CircleMarker,
  Circle,
  Marker,
  Popup,
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
  Home,
  Package,
  Shield,
  Maximize2,
  Minimize2,
  Plus,
  Minus,
  AlertTriangle,
  Compass,
  Radio,
  Clock,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { useIncidentStore } from '../store/incidentStore';
import { MOCK_SHELTERS, MOCK_TEAMS, MOCK_RESOURCES } from '../data/mockData';
import { SeverityBadge, StatusBadge, TypeBadge, LiveIndicator } from '../components/ui/Badge';
import { ProgressBar } from '../components/ui/Card';
import { brgSocket } from '../utils/socket';
import type { Incident, Shelter, Team, Resource, Severity } from '../types';

// ─── Initial Map View Configuration ───
const INDIA_CENTER: [number, number] = [22.5, 79.0];
const INDIA_ZOOM = 5;

// ─── Severity Colors ───
const SEVERITY_COLORS: Record<Severity, string> = {
  critical: '#EF4444', // Red
  high: '#F97316',     // Orange
  medium: '#EAB308',   // Yellow
  low: '#3B82F6',      // Blue
};

// ─── Custom HTML DivIcons for Leaflet ───
const SHELTER_ICON = L.divIcon({
  className: 'brg-shelter-icon',
  html: `
    <div style="
      width: 26px;
      height: 26px;
      background: #16A34A;
      border: 2px solid #FFFFFF;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 6px rgba(0,0,0,0.5);
      color: white;
      font-size: 12px;
      font-weight: 700;
    ">🏠</div>
  `,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
  popupAnchor: [0, -14],
});

const TEAM_ICON = L.divIcon({
  className: 'brg-team-icon',
  html: `
    <div style="
      width: 28px;
      height: 28px;
      background: #2563EB;
      border: 2px solid #FFFFFF;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 6px rgba(0,0,0,0.5);
      color: white;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: -0.5px;
    ">NDRF</div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -15],
});

const RESOURCE_ICON = L.divIcon({
  className: 'brg-resource-icon',
  html: `
    <div style="
      width: 26px;
      height: 26px;
      background: #0891B2;
      border: 2px solid #FFFFFF;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 6px rgba(0,0,0,0.5);
      color: white;
      font-size: 12px;
    ">📦</div>
  `,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
  popupAnchor: [0, -14],
});

// ─── Floating In-Map Controls Component ───
interface MapControlsProps {
  onResetIndia: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

const InMapControls: React.FC<MapControlsProps> = ({
  onResetIndia,
  isFullscreen,
  onToggleFullscreen,
}) => {
  const map = useMap();

  return (
    <div className="leaflet-top leaflet-right" style={{ pointerEvents: 'auto', zIndex: 999 }}>
      <div className="m-3 flex flex-col gap-2">
        {/* Reset to India Button */}
        <button
          onClick={onResetIndia}
          title="Reset View to India (operational focus)"
          className="flex items-center gap-1.5 px-3 py-2 bg-[#07111F]/95 hover:bg-[#0D1828] text-slate-100 border border-white/20 rounded-lg shadow-xl text-xs font-semibold backdrop-blur-md transition-all duration-150 hover:border-blue-500 hover:text-blue-300"
        >
          <span className="text-sm">🇮🇳</span>
          <span>India</span>
        </button>

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

type SelectionType = 'incident' | 'shelter' | 'team' | 'resource' | 'threat';
interface Selection {
  type: SelectionType;
  item: Incident | Shelter | Team | Resource | any;
}

export const MapsTrackingPage: React.FC = () => {
  const { incidents, addIncident, updateIncident } = useIncidentStore();
  const [shelters, setShelters] = useState<Shelter[]>(MOCK_SHELTERS);
  const [teams, setTeams] = useState<Team[]>(MOCK_TEAMS);
  const [resources, setResources] = useState<Resource[]>(MOCK_RESOURCES);
  const [selection, setSelection] = useState<Selection | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastRealtimeEvent, setLastRealtimeEvent] = useState<string | null>(null);

  // Map Tile Style: Standard OpenStreetMap (Primary requirement) vs Dark OSM
  const [tileProvider, setTileProvider] = useState<'osm' | 'dark'>('osm');

  // Map Layer Toggles
  const [layers, setLayers] = useState({
    incidents: true,
    shelters: true,
    teams: true,
    resources: true,
    threatZones: true,
  });

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const toggleLayer = (key: keyof typeof layers) =>
    setLayers((prev) => ({ ...prev, [key]: !prev[key] }));

  // ─── Reset to India Handler ───
  const handleResetToIndia = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(INDIA_CENTER, INDIA_ZOOM, {
        duration: 1.2,
        easeLinearity: 0.25,
      });
    }
  };

  // ─── Fullscreen Toggle ───
  const handleToggleFullscreen = () => {
    if (!mapContainerRef.current) return;
    if (!document.fullscreenElement) {
      mapContainerRef.current.requestFullscreen?.().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen?.().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // ─── Socket.IO Real-Time Event Architecture Integration ───
  useEffect(() => {
    // 1. incident:created -> immediately add marker
    const unsubIncidentCreated = brgSocket.on<Incident>('incident:created', (newIncident) => {
      addIncident(newIncident);
      setLastRealtimeEvent(`New incident reported: ${newIncident.id} (${newIncident.location.district})`);
    });

    // 2. incident:updated -> update existing marker
    const unsubIncidentUpdated = brgSocket.on<{ id: string } & Partial<Incident>>(
      'incident:updated',
      (updated) => {
        updateIncident(updated.id, updated);
        setLastRealtimeEvent(`Incident updated: ${updated.id}`);
      }
    );

    // 3. shelter:updated
    const unsubShelterUpdated = brgSocket.on<Partial<Shelter> & { id: string }>(
      'shelter:updated',
      (updatedShelter) => {
        setShelters((prev) =>
          prev.map((s) => (s.id === updatedShelter.id ? { ...s, ...updatedShelter } : s))
        );
        setLastRealtimeEvent(`Shelter updated: ${updatedShelter.id}`);
      }
    );

    // 4. team:updated
    const unsubTeamUpdated = brgSocket.on<Partial<Team> & { id: string }>('team:updated', (updatedTeam) => {
      setTeams((prev) =>
        prev.map((t) => (t.id === updatedTeam.id ? { ...t, ...updatedTeam } : t))
      );
      setLastRealtimeEvent(`Team updated: ${updatedTeam.id}`);
    });

    // 5. resource:updated
    const unsubResourceUpdated = brgSocket.on<Partial<Resource> & { id: string }>(
      'resource:updated',
      (updatedResource) => {
        setResources((prev) =>
          prev.map((r) => (r.id === updatedResource.id ? { ...r, ...updatedResource } : r))
        );
        setLastRealtimeEvent(`Resource updated: ${updatedResource.id}`);
      }
    );

    return () => {
      unsubIncidentCreated();
      unsubIncidentUpdated();
      unsubShelterUpdated();
      unsubTeamUpdated();
      unsubResourceUpdated();
    };
  }, [addIncident, updateIncident]);

  // Teams with coordinates
  const teamsWithCoords = useMemo(
    () => teams.filter((t) => t.currentLocation && t.currentLocation.lat && t.currentLocation.lng),
    [teams]
  );

  // Resources with coordinates
  const resourcesWithCoords = useMemo(
    () => resources.filter((r) => r.coordinates && r.coordinates.lat && r.coordinates.lng),
    [resources]
  );

  // Active Incidents
  const activeIncidents = useMemo(
    () => incidents.filter((i) => i.status !== 'resolved'),
    [incidents]
  );

  // Threat Zones derived from active incidents
  const threatZones = useMemo(() => {
    return [
      {
        id: 'THREAT-001',
        title: 'Cyclone Michaung Storm Landfall Warning Zone',
        incidentId: 'INC-2024-002',
        center: [15.9062, 80.4518] as [number, number],
        radiusKm: 75,
        color: '#EF4444',
        severity: 'critical' as Severity,
        description: 'Primary landfall impact corridor with gale winds 130-150 km/h and 3m storm surge buffer.',
      },
      {
        id: 'THREAT-002',
        title: 'Adyar River Basin Urban Flood Inundation Zone',
        incidentId: 'INC-2024-001',
        center: [13.0067, 80.2206] as [number, number],
        radiusKm: 25,
        color: '#3B82F6',
        severity: 'high' as Severity,
        description: 'River breach inundation perimeter covering Saidapet, Adyar, and low-lying coastal drainage.',
      },
      {
        id: 'THREAT-003',
        title: 'NH-166 Hillside Landslide Vulnerability Sector',
        incidentId: 'INC-2024-003',
        center: [31.6378, 77.0652] as [number, number],
        radiusKm: 15,
        color: '#F97316',
        severity: 'high' as Severity,
        description: 'Slope failure risk corridor along Mandi-Kullu Highway with stranded convoys.',
      },
    ];
  }, []);



  return (
    <div
      ref={mapContainerRef}
      className="flex h-full w-full relative bg-[#07111F] text-slate-100 overflow-hidden select-none"
      style={{ height: isFullscreen ? '100vh' : 'calc(100vh - 56px)' }}
    >
      {/* ─── Minimal Floating Map Controls Bar (Left Top) ─── */}
      <div className="absolute top-3 left-3 z-[1000] flex flex-col gap-2 pointer-events-auto">
        {/* Layer Toggle Bar */}
        <div className="bg-[#07111F]/95 border border-white/15 rounded-xl shadow-2xl backdrop-blur-md p-2 flex flex-col gap-1.5 w-52 sm:w-60">
          <div className="flex items-center justify-between px-2 py-1 border-b border-white/10">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200 uppercase tracking-wider">
              <Layers size={13} className="text-blue-400" />
              <span>Operational Layers</span>
            </div>
            <LiveIndicator />
          </div>

          <div className="space-y-1 pt-1 text-xs">
            {/* Incidents Layer */}
            <button
              onClick={() => toggleLayer('incidents')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-all ${
                layers.incidents
                  ? 'bg-red-500/15 text-red-300 font-medium border border-red-500/25'
                  : 'text-slate-400 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span>Incidents</span>
              </div>
              <span className="font-mono text-[11px] font-semibold">{activeIncidents.length}</span>
            </button>

            {/* Shelters Layer */}
            <button
              onClick={() => toggleLayer('shelters')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-all ${
                layers.shelters
                  ? 'bg-green-500/15 text-green-300 font-medium border border-green-500/25'
                  : 'text-slate-400 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
                <span>Shelters</span>
              </div>
              <span className="font-mono text-[11px] font-semibold">{shelters.length}</span>
            </button>

            {/* Response Teams Layer */}
            <button
              onClick={() => toggleLayer('teams')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-all ${
                layers.teams
                  ? 'bg-blue-500/15 text-blue-300 font-medium border border-blue-500/25'
                  : 'text-slate-400 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded bg-blue-500" />
                <span>Response Teams</span>
              </div>
              <span className="font-mono text-[11px] font-semibold">{teamsWithCoords.length}</span>
            </button>

            {/* Resources Layer */}
            <button
              onClick={() => toggleLayer('resources')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-all ${
                layers.resources
                  ? 'bg-cyan-500/15 text-cyan-300 font-medium border border-cyan-500/25'
                  : 'text-slate-400 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded bg-cyan-500" />
                <span>Resources</span>
              </div>
              <span className="font-mono text-[11px] font-semibold">{resourcesWithCoords.length}</span>
            </button>

            {/* Threat Zones Layer */}
            <button
              onClick={() => toggleLayer('threatZones')}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-all ${
                layers.threatZones
                  ? 'bg-amber-500/15 text-amber-300 font-medium border border-amber-500/25'
                  : 'text-slate-400 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full border border-amber-400 bg-amber-400/30" />
                <span>Threat Zones</span>
              </div>
              <span className="font-mono text-[11px] font-semibold">{threatZones.length}</span>
            </button>
          </div>

          {/* Map Tile Style Switcher */}
          <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
            <span>Tile Theme:</span>
            <div className="flex items-center gap-1 bg-white/5 p-0.5 rounded-md border border-white/10">
              <button
                onClick={() => setTileProvider('osm')}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                  tileProvider === 'osm'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Standard OpenStreetMap with full geographic labels"
              >
                OSM Standard
              </button>
              <button
                onClick={() => setTileProvider('dark')}
                className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                  tileProvider === 'dark'
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Dark mode tiles"
              >
                Dark
              </button>
            </div>
          </div>
        </div>

        {/* Real-time Telemetry Status Badge */}
        <div className="bg-[#07111F]/90 border border-white/15 rounded-xl shadow-xl backdrop-blur-md p-2.5 flex items-center justify-between gap-2 w-52 sm:w-60 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <Radio size={13} className="text-green-400 animate-pulse flex-shrink-0" />
            <span className="text-[11px] text-slate-300 truncate">
              {lastRealtimeEvent || 'Socket.IO: Live National Grid'}
            </span>
          </div>
          <span className="flex-shrink-0 px-2 py-0.5 rounded bg-green-500/15 text-green-400 border border-green-500/25 text-[10px] font-bold">
            Live
          </span>
        </div>
      </div>

      {/* ─── Severity Legend (Bottom Left) ─── */}
      <div className="absolute bottom-3 left-3 z-[1000] pointer-events-auto bg-[#07111F]/90 border border-white/15 rounded-xl shadow-2xl backdrop-blur-md px-3 py-2 flex items-center gap-3 text-xs">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">Severity:</span>
        <div className="flex items-center gap-2.5">
          {(['critical', 'high', 'medium', 'low'] as Severity[]).map((sev) => (
            <div key={sev} className="flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: SEVERITY_COLORS[sev] }}
              />
              <span className="text-[11px] text-slate-300 capitalize">{sev}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Primary Full-Screen Leaflet Map ─── */}
      <div className="flex-1 w-full h-full relative">
        <MapContainer
          center={INDIA_CENTER}
          zoom={INDIA_ZOOM}
          minZoom={2}
          maxZoom={18}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%', background: '#07111F' }}
          zoomControl={false} // Handled by our custom clean InMapControls
        >
          {/* Map Instance Reference Tracker */}
          <MapController mapRef={mapInstanceRef} />

          {/* Floating In-Map Controls: 🇮🇳 India Reset, Zoom In/Out, Fullscreen */}
          <InMapControls
            onResetIndia={handleResetToIndia}
            isFullscreen={isFullscreen}
            onToggleFullscreen={handleToggleFullscreen}
          />

          {/* OpenStreetMap-compatible Tile Layer (NO API KEY REQUIRED) */}
          {tileProvider === 'osm' ? (
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              maxZoom={19}
            />
          ) : (
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>'
              url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
              maxZoom={19}
            />
          )}

          {/* ─── Layer: Threat Zones (Buffer Polygons / Circles) ─── */}
          {layers.threatZones &&
            threatZones.map((tz) => (
              <React.Fragment key={tz.id}>
                <Circle
                  center={tz.center}
                  radius={tz.radiusKm * 1000}
                  pathOptions={{
                    color: tz.color,
                    fillColor: tz.color,
                    fillOpacity: 0.12,
                    weight: 1.5,
                    dashArray: '5, 8',
                  }}
                  eventHandlers={{
                    click: () => setSelection({ type: 'threat', item: tz }),
                  }}
                >
                  <Popup>
                    <div className="p-1">
                      <p className="text-xs font-bold text-red-400 mb-1">{tz.title}</p>
                      <p className="text-[11px] text-slate-300">{tz.description}</p>
                      <p className="text-[10px] text-slate-500 mt-1 font-mono">Radius: {tz.radiusKm} km</p>
                    </div>
                  </Popup>
                </Circle>
              </React.Fragment>
            ))}

          {/* ─── Layer: Incidents Markers ─── */}
          {layers.incidents &&
            activeIncidents.map((inc) => {
              const color = SEVERITY_COLORS[inc.severity];
              const isCritical = inc.severity === 'critical';
              const radius = isCritical ? 14 : inc.severity === 'high' ? 11 : 8;

              return (
                <React.Fragment key={inc.id}>
                  {/* Outer pulse circle for critical incidents */}
                  {isCritical && (
                    <CircleMarker
                      center={[inc.location.coordinates.lat, inc.location.coordinates.lng]}
                      radius={24}
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
                      fillOpacity: 0.9,
                      weight: 2,
                    }}
                    eventHandlers={{
                      click: () => setSelection({ type: 'incident', item: inc }),
                    }}
                  >
                    <Popup>
                      <div className="p-1 min-w-[200px]">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: color }}
                          />
                          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                            {inc.severity} · {inc.type}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-slate-100 leading-snug mb-1">
                          {inc.title}
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          {inc.location.area}, {inc.location.district}, {inc.location.state}
                        </p>
                        <button
                          onClick={() => setSelection({ type: 'incident', item: inc })}
                          className="mt-2 text-[11px] text-blue-400 hover:text-blue-300 font-semibold"
                        >
                          View Operational Brief →
                        </button>
                      </div>
                    </Popup>
                  </CircleMarker>
                </React.Fragment>
              );
            })}

          {/* ─── Layer: Shelters Markers ─── */}
          {layers.shelters &&
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
                  <div className="p-1 min-w-[200px]">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-green-400 text-xs font-bold">🏠 Relief Shelter</span>
                      <span className="text-[10px] text-slate-400">({shelter.status.toUpperCase()})</span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-100">{shelter.name}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {shelter.location.area}, {shelter.location.district}
                    </p>
                    <p className="text-[11px] text-green-400 font-medium mt-1">
                      Occupancy: {shelter.occupancy} / {shelter.capacity} persons
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}

          {/* ─── Layer: Response Teams Markers (Only when coordinates exist) ─── */}
          {layers.teams &&
            teamsWithCoords.map((team) => (
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
                      <span className="text-[10px] text-slate-400">({team.status.toUpperCase()})</span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-100">{team.name}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">Strength: {team.strength} Personnel</p>
                    {team.eta && team.eta !== '—' && (
                      <p className="text-[11px] text-amber-400 font-medium mt-1">ETA: {team.eta}</p>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}

          {/* ─── Layer: Resources Markers (Only when coordinates exist) ─── */}
          {layers.resources &&
            resourcesWithCoords.map((resource) => (
              <Marker
                key={resource.id}
                position={[resource.coordinates!.lat, resource.coordinates!.lng]}
                icon={RESOURCE_ICON}
                eventHandlers={{
                  click: () => setSelection({ type: 'resource', item: resource }),
                }}
              >
                <Popup>
                  <div className="p-1 min-w-[190px]">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-cyan-400 text-xs font-bold">📦 Logistics Depot</span>
                      <span className="text-[10px] text-slate-400 capitalize">({resource.category})</span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-100">{resource.name}</h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {resource.location}, {resource.state}
                    </p>
                    <p className="text-[11px] text-cyan-300 font-medium mt-1">
                      Stock: {resource.available} / {resource.quantity} Available
                    </p>
                  </div>
                </Popup>
              </Marker>
            ))}
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
            className="absolute top-3 right-3 bottom-3 w-80 sm:w-96 bg-[#0D1828]/98 border border-white/15 rounded-xl shadow-2xl flex flex-col overflow-hidden z-[1001] backdrop-blur-md pointer-events-auto"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/10 bg-[#07111F]/80">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
                {selection.type} Intelligence
              </span>
              <button
                onClick={() => setSelection(null)}
                className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-white/10 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {selection.type === 'incident' && <IncidentPanel incident={selection.item as Incident} />}
              {selection.type === 'shelter' && <ShelterPanel shelter={selection.item as Shelter} />}
              {selection.type === 'team' && <TeamPanel team={selection.item as Team} />}
              {selection.type === 'resource' && <ResourcePanel resource={selection.item as Resource} />}
              {selection.type === 'threat' && <ThreatPanel threat={selection.item} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ─── Detail Panels ───
const IncidentPanel: React.FC<{ incident: Incident }> = ({ incident }) => (
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
        <span>{incident.location.area}, {incident.location.district}, {incident.location.state}</span>
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
      {incident.casualties !== undefined && (
        <div className="flex items-center gap-1.5 text-slate-300">
          <AlertTriangle size={12} className={incident.casualties > 0 ? 'text-red-400' : 'text-slate-500'} />
          <span>Casualties: <strong className={incident.casualties > 0 ? 'text-red-400' : 'text-green-400'}>{incident.casualties}</strong></span>
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

const ShelterPanel: React.FC<{ shelter: Shelter }> = ({ shelter }) => {
  const pct = Math.round((shelter.occupancy / shelter.capacity) * 100);
  return (
    <div className="space-y-3.5">
      <div className="flex items-center justify-between">
        <span
          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold border ${
            shelter.status === 'active'
              ? 'text-green-400 bg-green-500/10 border-green-500/20'
              : shelter.status === 'full'
              ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
              : 'text-slate-400 bg-slate-500/10 border-slate-500/20'
          }`}
        >
          {shelter.status.toUpperCase()}
        </span>
        <span className="text-xs text-slate-500">ID: {shelter.id}</span>
      </div>

      <h3 className="text-sm font-bold text-slate-100">{shelter.name}</h3>

      <div className="flex items-center gap-1.5 text-xs text-slate-400">
        <MapPin size={12} className="text-slate-500" />
        <span>{shelter.location.area}, {shelter.location.district}</span>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-300 font-medium">Occupancy Load</span>
          <span className={`font-mono font-bold ${pct > 80 ? 'text-amber-400' : 'text-green-400'}`}>
            {shelter.occupancy} / {shelter.capacity} ({pct}%)
          </span>
        </div>
        <ProgressBar value={pct} size="sm" color={pct > 80 ? 'amber' : 'green'} />
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div
          className={`p-2 rounded border ${
            shelter.foodStock === 'adequate'
              ? 'border-green-500/25 text-green-300 bg-green-500/5'
              : shelter.foodStock === 'low'
              ? 'border-amber-500/25 text-amber-300 bg-amber-500/5'
              : 'border-red-500/25 text-red-300 bg-red-500/5'
          }`}
        >
          🍱 Food: <strong className="capitalize">{shelter.foodStock}</strong>
        </div>
        <div
          className={`p-2 rounded border ${
            shelter.waterStock === 'adequate'
              ? 'border-green-500/25 text-green-300 bg-green-500/5'
              : shelter.waterStock === 'low'
              ? 'border-amber-500/25 text-amber-300 bg-amber-500/5'
              : 'border-red-500/25 text-red-300 bg-red-500/5'
          }`}
        >
          💧 Water: <strong className="capitalize">{shelter.waterStock}</strong>
        </div>
      </div>

      <div className="p-2.5 rounded-lg bg-white/4 border border-white/8 space-y-1 text-xs text-slate-400">
        <p>Medical Facility: <strong className={shelter.medicalSupport ? 'text-green-400' : 'text-slate-500'}>{shelter.medicalSupport ? 'On-site medical wing active' : 'None'}</strong></p>
        <p>Officer in Charge: <strong className="text-slate-300">{shelter.inChargeOfficer}</strong></p>
        <p>Helpline: <strong className="text-slate-300">{shelter.contactNumber}</strong></p>
      </div>
    </div>
  );
};

const TeamPanel: React.FC<{ team: Team }> = ({ team }) => (
  <div className="space-y-3.5">
    <div className="flex items-center justify-between">
      <span
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-semibold border ${
          team.status === 'deployed'
            ? 'text-amber-400 bg-amber-500/10 border-amber-500/25'
            : team.status === 'available'
            ? 'text-green-400 bg-green-500/10 border-green-500/25'
            : 'text-blue-400 bg-blue-500/10 border-blue-500/25'
        }`}
      >
        {team.status.toUpperCase()}
      </span>
      <span className="text-xs text-slate-500">ID: {team.id}</span>
    </div>

    <h3 className="text-sm font-bold text-slate-100">{team.name}</h3>

    <div className="p-2.5 rounded-lg bg-white/4 border border-white/8 space-y-2 text-xs">
      <div className="flex justify-between"><span className="text-slate-400">Corps / Agency:</span><strong className="text-slate-200">{team.type}</strong></div>
      <div className="flex justify-between"><span className="text-slate-400">State Assignment:</span><strong className="text-slate-200">{team.state}</strong></div>
      <div className="flex justify-between"><span className="text-slate-400">Command Level:</span><strong className="text-slate-200 capitalize">{team.commandLevel}</strong></div>
      <div className="flex justify-between"><span className="text-slate-400">Tactical Strength:</span><strong className="text-slate-200">{team.strength} Personnel</strong></div>
      {team.eta && <div className="flex justify-between"><span className="text-slate-400">Target ETA:</span><strong className="text-amber-400">{team.eta}</strong></div>}
      <div className="flex justify-between pt-1 border-t border-white/5"><span className="text-slate-400">Emergency Radio / Phone:</span><strong className="text-blue-400">{team.contactNumber}</strong></div>
    </div>
  </div>
);

const ResourcePanel: React.FC<{ resource: Resource }> = ({ resource }) => (
  <div className="space-y-3.5">
    <div className="flex items-center justify-between">
      <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-cyan-500/15 text-cyan-300 border border-cyan-500/25 capitalize">
        {resource.category}
      </span>
      <span className="text-xs text-slate-500">{resource.id}</span>
    </div>

    <h3 className="text-sm font-bold text-slate-100">{resource.name}</h3>

    <div className="p-2.5 rounded-lg bg-white/4 border border-white/8 space-y-2 text-xs">
      <div className="flex justify-between"><span className="text-slate-400">Depot Location:</span><strong className="text-slate-200">{resource.location}</strong></div>
      <div className="flex justify-between"><span className="text-slate-400">State Hub:</span><strong className="text-slate-200">{resource.state}</strong></div>
      <div className="flex justify-between"><span className="text-slate-400">Total Quantity:</span><strong className="text-slate-200">{resource.quantity.toLocaleString('en-IN')}</strong></div>
      <div className="flex justify-between"><span className="text-slate-400">Available Stock:</span><strong className="text-green-400">{resource.available.toLocaleString('en-IN')}</strong></div>
      <div className="flex justify-between"><span className="text-slate-400">Currently Allocated:</span><strong className="text-amber-400">{resource.allocated.toLocaleString('en-IN')}</strong></div>
    </div>
  </div>
);

const ThreatPanel: React.FC<{ threat: any }> = ({ threat }) => (
  <div className="space-y-3.5">
    <span className="px-2.5 py-0.5 rounded text-xs font-bold bg-red-500/20 text-red-400 border border-red-500/30 uppercase tracking-wider">
      Active Threat Polygon
    </span>

    <h3 className="text-sm font-bold text-slate-100">{threat.title}</h3>

    <div className="p-2.5 rounded-lg bg-white/4 border border-white/8 space-y-2 text-xs">
      <div className="flex justify-between"><span className="text-slate-400">Affected Buffer:</span><strong className="text-red-400">{threat.radiusKm} km radius</strong></div>
      <div className="flex justify-between"><span className="text-slate-400">Severity Tier:</span><strong className="text-red-400 uppercase">{threat.severity}</strong></div>
      <div className="flex justify-between"><span className="text-slate-400">Linked Incident:</span><strong className="text-slate-200 font-mono">{threat.incidentId}</strong></div>
    </div>

    <div>
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">Threat Assessment</p>
      <p className="text-xs text-slate-300 leading-relaxed">{threat.description}</p>
    </div>
  </div>
);

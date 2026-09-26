import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  Circle,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Home, RefreshCw,
  MapPin, Shield,
  Compass, ShieldAlert,
  CheckCircle2, Search,
  Zap, X
} from 'lucide-react';
import { useAppStore } from '../store/appStore';
import { useIncidentStore } from '../store/incidentStore';
import {
  MOCK_KPI, MOCK_TEAMS, MOCK_SHELTERS, MOCK_ROADS,
  JURISDICTION_PRESETS
} from '../data/mockData';
import { SeverityBadge, StatusBadge, TypeBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Drawer } from '../components/ui/Modal';
import { Timeline } from '../components/ui/Overlay';
import { brgSocket } from '../utils/socket';
import type { Road, RouteOption, Severity, IncidentStatus } from '../types';

function formatTimeAgo(isoString: string): string {
  const diff = (Date.now() - new Date(isoString).getTime()) / 1000;
  if (diff < 60) return `${Math.round(diff)}s ago`;
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
  return `${Math.round(diff / 86400)}d ago`;
}

// ─── Custom Leaflet DivIcons ───
const createMapDivIcon = (emoji: string, bg: string, label?: string, pulse?: boolean) =>
  L.divIcon({
    className: 'brg-command-icon',
    html: `
      <div style="
        position: relative;
        min-width: 28px;
        height: 28px;
        padding: 0 4px;
        background: ${bg};
        border: 2px solid #FFFFFF;
        border-radius: ${label ? '6px' : '50%'};
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 3px;
        box-shadow: 0 3px 10px rgba(0,0,0,0.6);
        color: white;
        font-size: 11px;
        font-weight: 800;
      ">
        ${pulse ? `<span style="position: absolute; inset: -4px; border-radius: inherit; border: 2px solid ${bg}; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite; opacity: 0.75;"></span>` : ''}
        <span>${emoji}</span>
        ${label ? `<span style="font-size: 9px; font-family: monospace;">${label}</span>` : ''}
      </div>
    `,
    iconSize: label ? [44, 28] : [28, 28],
    iconAnchor: label ? [22, 14] : [14, 14],
    popupAnchor: [0, -14],
  });

const INCIDENT_ICONS: Record<Severity, L.DivIcon> = {
  critical: createMapDivIcon('⚠️', '#DC2626', 'CRIT', true),
  high: createMapDivIcon('⚠️', '#EA580C', 'HIGH', false),
  medium: createMapDivIcon('⚠️', '#D97706', undefined, false),
  low: createMapDivIcon('ℹ️', '#2563EB', undefined, false),
};

const SHELTER_ICON = createMapDivIcon('🏠', '#16A34A');
const TEAM_ICON = createMapDivIcon('🛡️', '#2563EB', 'NDRF');

// ─── Map View Synchronizer Component ───
const MapCenterUpdater: React.FC<{ center: [number, number]; zoom: number }> = ({ center, zoom }) => {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true });
  }, [center, zoom, map]);
  return null;
};

export const CommandOverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const {
    activeJurisdiction, setJurisdiction, webSocketStatus, currentUser
  } = useAppStore();
  const {
    incidents, selectIncident, selectedIncidentId, detailPanelOpen,
    setDetailPanelOpen, getById, updateIncidentStatus
  } = useIncidentStore();

  const [lastSync, setLastSync] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');
  const [closedLoopRunning, setClosedLoopRunning] = useState(false);
  const [closedLoopResult, setClosedLoopResult] = useState<any>(null);

  // Layer Toggles
  const [layers, setLayers] = useState({
    incidents: true,
    shelters: true,
    teams: true,
    roads: true,
    routes: true,
    hospitals: true,
    hazardBuffer: true,
  });

  // Local Road & Evacuation Route state (reflects real-time closed-loop updates)
  const [roads, setRoads] = useState<Road[]>(MOCK_ROADS);
  const [evacuationRoutes, setEvacuationRoutes] = useState<RouteOption[]>([
    {
      id: 'EVAC-01',
      name: 'Primary Evacuation Corridor: Marina / Adyar to High Grounds',
      type: 'RECOMMENDED',
      distanceKm: 14.2,
      estimatedTravelTimeMin: 28,
      riskLevel: 'low',
      riskExposureIndex: 18,
      waypoints: [
        [13.0827, 80.2707],
        [13.0500, 80.2400],
        [13.0200, 80.2100],
        [12.9800, 80.1800],
      ],
      elevationGainMeters: 22,
      keyCheckpoints: ['Central Hub', 'Nungambakkam High Ground', 'Camp Refuge'],
      shelterDestinationId: 'SH-001',
      shelterDestinationName: 'Adyar Relief Camp',
      reason: 'Bypasses flooded low-lying coastal arterial roads',
      warnings: [],
      mode: 'VEHICULAR',
    },
    {
      id: 'EVAC-02',
      name: 'Vizag Coastal Bypass Corridor (NH-16 to Siripuram)',
      type: 'RECOMMENDED',
      distanceKm: 22.5,
      estimatedTravelTimeMin: 35,
      riskLevel: 'medium',
      riskExposureIndex: 32,
      waypoints: [
        [17.6868, 83.2185],
        [17.7289, 83.3228],
        [17.7800, 83.3500],
      ],
      elevationGainMeters: 45,
      keyCheckpoints: ['Port Bypass', 'Siripuram Uplands'],
      shelterDestinationId: 'SHL-001',
      shelterDestinationName: 'Andhra University Refuge',
      reason: 'Elevated terrain avoiding storm surge impact',
      warnings: ['Wind gusts up to 80 km/h'],
      mode: 'VEHICULAR',
    },
  ]);

  // Listen for real-time WebSocket events
  useEffect(() => {
    const unsubRoad = brgSocket.on('road:updated', (updatedRoad: Road) => {
      setRoads((prev) =>
        prev.map((r) => (r.id === updatedRoad.id ? updatedRoad : r))
      );
      setLastSync(new Date());
    });

    const unsubRoute = brgSocket.on('route:updated', (updatedRoutes: any) => {
      if (Array.isArray(updatedRoutes) && updatedRoutes.length > 0) {
        setEvacuationRoutes(updatedRoutes);
      }
      setLastSync(new Date());
    });

    return () => {
      unsubRoad();
      unsubRoute();
    };
  }, []);

  const selectedIncident = selectedIncidentId ? getById(selectedIncidentId) : null;
  const kpi = MOCK_KPI;

  // Filtered incidents based on search & jurisdiction
  const activeIncidents = useMemo(() => {
    return incidents.filter((i) => {
      if (i.status === 'resolved' || i.status === 'closed') return false;
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      return (
        i.title.toLowerCase().includes(q) ||
        i.id.toLowerCase().includes(q) ||
        i.location.district.toLowerCase().includes(q) ||
        i.location.state.toLowerCase().includes(q)
      );
    });
  }, [incidents, searchQuery]);

  const criticalIncidents = useMemo(() => {
    return activeIncidents.filter((i) => i.severity === 'critical');
  }, [activeIncidents]);

  // Execute Closed-Loop Response Demonstration
  const triggerClosedLoopSimulation = async () => {
    setClosedLoopRunning(true);
    setClosedLoopResult(null);

    try {
      const response = await fetch('/api/closed-loop/block-road', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roadId: 'ROAD-001',
          blockageCause: 'Inundation 1.2m overflow & fallen electrical line',
          actor: currentUser?.name || 'Demo Chennai District Officer',
          role: currentUser?.role || 'district_authority',
          jurisdiction: activeJurisdiction.shortLabel,
        }),
      });

      const resData = await response.json();
      if (resData.status === 'success') {
        // Update local road state
        setRoads((prev) =>
          prev.map((r) => (r.id === 'ROAD-001' ? { ...r, status: 'blocked', blockageCause: 'Inundation 1.2m overflow' } : r))
        );

        // Update local route reroute
        setEvacuationRoutes((prev) =>
          prev.map((rt) => ({
            ...rt,
            waypoints: rt.waypoints.map(([lat, lng]) => [lat + 0.003, lng + 0.002]),
            riskExposureIndex: Math.min(100, rt.riskExposureIndex + 14),
            reason: 'DYNAMIC REROUTE: Bypassing blocked GST Road corridor',
          }))
        );

        setClosedLoopResult(resData.message);
        setLastSync(new Date());
      }
    } catch (err) {
      console.warn('Closed loop trigger error:', err);
    } finally {
      setClosedLoopRunning(false);
    }
  };

  // Lifecycle Advance Action
  const handleAdvanceStatus = (incId: string, nextStatus: IncidentStatus) => {
    updateIncidentStatus(incId, nextStatus);
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#07111F] text-slate-100">
      {/* ─── Command Center Header ─── */}
      <div className="px-4 py-3 border-b border-white/8 bg-[#091526] sticky top-0 z-20">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Left Title + Jurisdiction Scope Strip */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow shadow-blue-500/25">
                <Shield size={16} className="text-white" />
              </div>
              <div>
                <h1 className="text-base font-black text-white tracking-wider leading-none">
                  BHARAT RESPONSE GRID
                </h1>
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">EOC Master Command Gateway</p>
              </div>
            </div>

            <div className="h-6 w-px bg-white/10 hidden sm:block" />

            {/* Jurisdiction Badge */}
            <div className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#0F1F35] border border-cyan-500/30 text-xs text-cyan-300 font-bold">
              <MapPin size={12} className="text-cyan-400" />
              <span className="tracking-wide uppercase">{activeJurisdiction.label}</span>
            </div>

            {/* Real WebSocket Live indicator */}
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{webSocketStatus}</span>
            </div>

            {/* Research / Demo Notice */}
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/25 text-amber-300 font-bold hidden xl:inline">
              DEMO / RESEARCH SYSTEM
            </span>
          </div>

          {/* Right: Search, Filter, IST Time */}
          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Global Incident Search */}
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-2.5 text-slate-500" />
              <input
                type="text"
                placeholder="Search incidents or sectors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 rounded-lg bg-[#07111F] border border-white/10 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 w-48 sm:w-56"
              />
            </div>

            {/* Sync Timestamp */}
            <div className="hidden md:flex items-center gap-2 text-[11px] text-slate-400 bg-white/4 px-2.5 py-1 rounded-md border border-white/6 font-mono">
              <RefreshCw size={11} className="text-slate-400" />
              <span>Synced {formatTimeAgo(lastSync.toISOString())}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 p-3 sm:p-4 space-y-3.5 max-w-[1920px] mx-auto w-full">
        {/* Closed Loop Alert Banner (when triggered) */}
        {closedLoopResult && (
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-amber-500/40 bg-amber-950/30 p-3.5 flex items-start justify-between gap-3 text-xs text-amber-200"
          >
            <div className="flex items-start gap-2.5">
              <CheckCircle2 size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-bold text-amber-300">CLOSED-LOOP AUTOMATION COMPLETE</p>
                <p className="text-slate-300 mt-0.5">
                  Road marked BLOCKED → Dynamic lateral risk recalculated (+18%) → Evacuation routes re-charted away from flood zone → 3 designated refuge camps verified → Responders notified without page reload.
                </p>
              </div>
            </div>
            <button
              onClick={() => setClosedLoopResult(null)}
              className="text-slate-400 hover:text-white p-1 rounded"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}

        {/* ─── Compact Operational KPI Strip ─── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <div className="p-3 rounded-xl bg-[#0D1828] border border-white/8 flex flex-col justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Incidents</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-black text-white">{activeIncidents.length}</span>
              <span className="text-[11px] font-semibold text-red-400">{criticalIncidents.length} Critical</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#0D1828] border border-white/8 flex flex-col justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">High-Risk Zones</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-black text-amber-400">4</span>
              <span className="text-[11px] font-semibold text-slate-400">Coastal / Basin</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#0D1828] border border-white/8 flex flex-col justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Population at Risk</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-black text-rose-400">185K</span>
              <span className="text-[11px] font-semibold text-slate-400">In Evacuation Zone</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#0D1828] border border-white/8 flex flex-col justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Active Teams</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-black text-blue-400">{MOCK_TEAMS.filter((t) => t.status === 'deployed').length}</span>
              <span className="text-[11px] font-semibold text-emerald-400">305 Responders</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#0D1828] border border-white/8 flex flex-col justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Shelters Active</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-black text-emerald-400">{MOCK_SHELTERS.length}</span>
              <span className="text-[11px] font-semibold text-slate-400">73% Capacity</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-[#0D1828] border border-white/8 flex flex-col justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Resources Deployed</span>
            <div className="flex items-baseline justify-between mt-1">
              <span className="text-2xl font-black text-cyan-400">{kpi.resourcesAllocated}</span>
              <span className="text-[11px] font-semibold text-cyan-400/80">68% Allocated</span>
            </div>
          </div>
        </div>

        {/* ─── Main Workspace: 65% Dominant Map / 35% Operational Intelligence ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-3.5 items-start">
          {/* ─── 65% Dominant Live GIS Map (8 cols on lg) ─── */}
          <div className="lg:col-span-8 flex flex-col rounded-2xl bg-[#091526] border border-white/10 overflow-hidden shadow-2xl relative min-h-[580px] lg:h-[720px]">
            {/* In-Map Top Command Toolbar */}
            <div className="px-3.5 py-2.5 bg-[#0A1627] border-b border-white/10 flex items-center justify-between flex-wrap gap-2 z-10">
              <div className="flex items-center gap-2">
                <Compass size={16} className="text-cyan-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Live GIS Operations Map
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  [{activeJurisdiction.center[0].toFixed(2)}, {activeJurisdiction.center[1].toFixed(2)}]
                </span>
              </div>

              {/* Layer Controls & Closed-Loop Trigger */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {/* Closed Loop Simulation Trigger Button */}
                <button
                  onClick={triggerClosedLoopSimulation}
                  disabled={closedLoopRunning}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-[11px] font-bold text-amber-300 transition-colors shadow-sm disabled:opacity-50"
                  title="Simulate road blockage on GST Road and trigger immediate automated re-routing"
                >
                  <Zap size={12} className={closedLoopRunning ? 'animate-spin' : 'text-amber-400'} />
                  <span>{closedLoopRunning ? 'Simulating Re-route...' : 'Simulate Road Blockage'}</span>
                </button>

                {/* Layer Toggles */}
                <div className="flex items-center bg-[#07111F] rounded-lg p-0.5 border border-white/10 text-[10px] font-medium">
                  <button
                    onClick={() => setLayers((l) => ({ ...l, incidents: !l.incidents }))}
                    className={`px-2 py-0.5 rounded ${layers.incidents ? 'bg-red-500/20 text-red-300 font-bold' : 'text-slate-500'}`}
                  >
                    Incidents
                  </button>
                  <button
                    onClick={() => setLayers((l) => ({ ...l, shelters: !l.shelters }))}
                    className={`px-2 py-0.5 rounded ${layers.shelters ? 'bg-green-500/20 text-green-300 font-bold' : 'text-slate-500'}`}
                  >
                    Shelters
                  </button>
                  <button
                    onClick={() => setLayers((l) => ({ ...l, teams: !l.teams }))}
                    className={`px-2 py-0.5 rounded ${layers.teams ? 'bg-blue-500/20 text-blue-300 font-bold' : 'text-slate-500'}`}
                  >
                    Teams
                  </button>
                  <button
                    onClick={() => setLayers((l) => ({ ...l, roads: !l.roads }))}
                    className={`px-2 py-0.5 rounded ${layers.roads ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-500'}`}
                  >
                    Roads
                  </button>
                  <button
                    onClick={() => setLayers((l) => ({ ...l, routes: !l.routes }))}
                    className={`px-2 py-0.5 rounded ${layers.routes ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-500'}`}
                  >
                    Routes
                  </button>
                </div>
              </div>
            </div>

            {/* Map Container */}
            <div className="flex-1 w-full h-full relative">
              <MapContainer
                center={activeJurisdiction.center}
                zoom={activeJurisdiction.zoom}
                scrollWheelZoom={true}
                className="w-full h-full"
                style={{ background: '#07111F', minHeight: '520px' }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {/* Automatically sync view with selected jurisdiction */}
                <MapCenterUpdater center={activeJurisdiction.center} zoom={activeJurisdiction.zoom} />

                {/* 1. Incidents Layer */}
                {layers.incidents &&
                  activeIncidents.map((inc) => (
                    <Marker
                      key={inc.id}
                      position={[inc.location.coordinates.lat, inc.location.coordinates.lng]}
                      icon={INCIDENT_ICONS[inc.severity] || INCIDENT_ICONS.medium}
                      eventHandlers={{
                        click: () => {
                          selectIncident(inc.id);
                        },
                      }}
                    >
                      <Popup className="brg-leaflet-popup">
                        <div className="p-2 text-xs text-slate-800 space-y-1">
                          <p className="font-bold text-slate-900">{inc.title}</p>
                          <p className="text-slate-600">{inc.location.district}, {inc.location.state}</p>
                          <div className="flex items-center gap-1.5 pt-1">
                            <span className="font-bold uppercase text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-700">
                              {inc.severity}
                            </span>
                            <span className="font-mono text-[10px] text-slate-500">{inc.id}</span>
                          </div>
                          <button
                            onClick={() => selectIncident(inc.id)}
                            className="w-full mt-2 py-1 px-2 text-center text-xs font-bold text-white bg-blue-600 rounded hover:bg-blue-700"
                          >
                            Inspect Incident →
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  ))}

                {/* 2. Shelters Layer */}
                {layers.shelters &&
                  MOCK_SHELTERS.map((s) => (
                    <Marker
                      key={s.id}
                      position={[s.location.coordinates.lat, s.location.coordinates.lng]}
                      icon={SHELTER_ICON}
                    >
                      <Popup>
                        <div className="p-2 text-xs text-slate-800 space-y-1">
                          <p className="font-bold">{s.name}</p>
                          <p className="text-slate-600">Capacity: {s.occupancy} / {s.capacity}</p>
                          <p className="text-emerald-700 font-semibold">Status: {s.status.toUpperCase()}</p>
                        </div>
                      </Popup>
                    </Marker>
                  ))}

                {/* 3. Response Teams Layer */}
                {layers.teams &&
                  MOCK_TEAMS.filter((t) => t.currentLocation).map((t) => (
                    <Marker
                      key={t.id}
                      position={[t.currentLocation!.lat, t.currentLocation!.lng]}
                      icon={TEAM_ICON}
                    >
                      <Popup>
                        <div className="p-2 text-xs text-slate-800 space-y-1">
                          <p className="font-bold">{t.name}</p>
                          <p className="text-slate-600">Strength: {t.strength} personnel ({t.type})</p>
                          <p className="text-blue-700 font-semibold">Status: {t.status.toUpperCase()}</p>
                        </div>
                      </Popup>
                    </Marker>
                  ))}

                {/* 4. Blocked / Caution Roads */}
                {layers.roads &&
                  roads.map((road) => {
                    const isBlocked = road.status === 'blocked';
                    const isInundated = road.status === 'inundated';
                    const color = isBlocked ? '#EF4444' : isInundated ? '#DC2626' : '#F59E0B';
                    return (
                      <Polyline
                        key={road.id}
                        positions={road.path}
                        color={color}
                        weight={5}
                        opacity={0.85}
                        dashArray={isBlocked ? '8, 8' : undefined}
                      >
                        <Popup>
                          <div className="p-2 text-xs text-slate-800 space-y-1">
                            <p className="font-bold">{road.roadName}</p>
                            <p className="font-semibold text-red-600 uppercase text-[10px]">
                              Status: {road.status}
                            </p>
                            {road.blockageCause && (
                              <p className="text-slate-600 text-[11px]">{road.blockageCause}</p>
                            )}
                          </div>
                        </Popup>
                      </Polyline>
                    );
                  })}

                {/* 5. Dynamic Evacuation Routes */}
                {layers.routes &&
                  evacuationRoutes.map((rt) => (
                    <Polyline
                      key={rt.id}
                      positions={rt.waypoints}
                      color="#10B981"
                      weight={4}
                      opacity={0.9}
                      dashArray="4, 6"
                    >
                      <Popup>
                        <div className="p-2 text-xs text-slate-800 space-y-1">
                          <p className="font-bold text-emerald-800">{rt.name}</p>
                          <p className="text-slate-600">Travel Time: {rt.estimatedTravelTimeMin} min ({rt.distanceKm} km)</p>
                          <p className="text-emerald-600 text-[11px]">{rt.reason}</p>
                        </div>
                      </Popup>
                    </Polyline>
                  ))}

                {/* 6. Hazard Impact Buffer Circle (e.g. Cyclone Landfall / Flood surge) */}
                {layers.hazardBuffer && (
                  <Circle
                    center={[17.78, 83.42]}
                    radius={35000}
                    pathOptions={{ color: '#EF4444', fillColor: '#EF4444', fillOpacity: 0.12, weight: 1.5 }}
                  />
                )}
              </MapContainer>

              {/* Floating Quick Jurisdiction Preset Bar */}
              <div className="absolute bottom-3 left-3 z-[1000] bg-[#07111F]/90 backdrop-blur-md p-1 rounded-xl border border-white/15 shadow-xl flex items-center gap-1 flex-wrap max-w-full">
                <span className="text-[10px] text-slate-400 font-bold px-2 uppercase">Jump Focus:</span>
                {JURISDICTION_PRESETS.slice(0, 6).map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => setJurisdiction(preset)}
                    className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors ${
                      activeJurisdiction.id === preset.id
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                        : 'text-slate-300 hover:bg-white/10'
                    }`}
                  >
                    {preset.shortLabel}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ─── 35% Operational Intelligence Column (4 cols on lg) ─── */}
          <div className="lg:col-span-4 space-y-3.5">
            {/* Critical Incident Queue */}
            <div className="bg-[#091526] border border-white/10 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center justify-between pb-3 border-b border-white/8">
                <div className="flex items-center gap-2">
                  <ShieldAlert size={16} className="text-red-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Response Priorities
                  </span>
                </div>
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30 font-bold">
                  {criticalIncidents.length} Urgent
                </span>
              </div>

              <div className="divide-y divide-white/5 max-h-[280px] overflow-y-auto mt-1 scrollbar-thin scrollbar-thumb-slate-800">
                {activeIncidents.slice(0, 5).map((inc) => {
                  const isSelected = selectedIncidentId === inc.id;
                  return (
                    <div
                      key={inc.id}
                      onClick={() => selectIncident(inc.id)}
                      className={`p-2.5 rounded-xl cursor-pointer transition-all my-1 ${
                        isSelected
                          ? 'bg-blue-600/20 border border-blue-500/40'
                          : 'hover:bg-white/5 border border-transparent'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-1.5 mb-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <SeverityBadge severity={inc.severity} size="sm" />
                          <span className="text-[10px] font-mono text-slate-400 font-semibold">{inc.id}</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-white/5 text-slate-300 uppercase font-mono">
                            {inc.status}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-500 flex-shrink-0">{formatTimeAgo(inc.reportedAt)}</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-200 line-clamp-1">{inc.title}</p>
                      <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1">
                        <span className="truncate">{inc.location.district}, {inc.location.state}</span>
                        <span className="text-cyan-400 font-medium">Inspect →</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Shelter Capacity Pulse */}
            <div className="bg-[#091526] border border-white/10 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center justify-between pb-2.5 border-b border-white/8">
                <div className="flex items-center gap-2">
                  <Home size={15} className="text-emerald-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Shelter Inflow Status
                  </span>
                </div>
                <button
                  onClick={() => navigate('/resources')}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium"
                >
                  Manage All →
                </button>
              </div>

              <div className="space-y-3 mt-3">
                {MOCK_SHELTERS.slice(0, 3).map((s) => {
                  const pct = Math.round((s.occupancy / s.capacity) * 100);
                  const isHigh = pct > 75;
                  return (
                    <div key={s.id} className="space-y-1 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-200 truncate">{s.name}</span>
                        <span className={`font-mono text-[11px] ${isHigh ? 'text-amber-400 font-bold' : 'text-slate-400'}`}>
                          {s.occupancy}/{s.capacity} ({pct}%)
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            isHigh ? 'bg-amber-400' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.min(100, pct)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tactical Units Status */}
            <div className="bg-[#091526] border border-white/10 rounded-2xl p-4 shadow-xl">
              <div className="flex items-center justify-between pb-2.5 border-b border-white/8">
                <div className="flex items-center gap-2">
                  <Shield size={15} className="text-blue-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Tactical Deployment
                  </span>
                </div>
                <button
                  onClick={() => navigate('/operations')}
                  className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium"
                >
                  Units ({MOCK_TEAMS.length}) →
                </button>
              </div>

              <div className="space-y-2.5 mt-3">
                {MOCK_TEAMS.slice(0, 3).map((team) => (
                  <div key={team.id} className="p-2.5 rounded-xl bg-white/4 border border-white/6 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-slate-200 truncate">{team.name}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{team.type} · {team.strength} Personnel · {team.state}</p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 uppercase flex-shrink-0">
                      {team.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Incident Side Panel / Drawer (Section 10 Requirement) ─── */}
      <Drawer
        open={detailPanelOpen}
        onClose={() => setDetailPanelOpen(false)}
        title={selectedIncident?.title || 'Incident Command Brief'}
        subtitle={selectedIncident ? `Sector: ${selectedIncident.location.district} · ${selectedIncident.location.state}` : ''}
        width="w-[540px]"
      >
        {selectedIncident && (
          <div className="px-5 py-4 space-y-5">
            {/* Header Badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <SeverityBadge severity={selectedIncident.severity} size="md" />
              <StatusBadge status={selectedIncident.status} size="md" />
              <TypeBadge type={selectedIncident.type} />
              <span className="text-xs font-mono text-slate-400 px-2 py-0.5 rounded bg-white/5 border border-white/10 font-bold">
                {selectedIncident.id}
              </span>
            </div>

            {/* Incident Metadata Grid */}
            <div className="grid grid-cols-2 gap-3 text-xs bg-[#091526] p-3.5 rounded-xl border border-white/8">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Affected Population</p>
                <p className="text-sm font-bold text-slate-100 mt-0.5">
                  {selectedIncident.affectedPopulation?.toLocaleString('en-IN') || '—'}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Reported Casualties</p>
                <p className={`text-sm font-bold mt-0.5 ${selectedIncident.casualties && selectedIncident.casualties > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {selectedIncident.casualties || 0}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Coordinates</p>
                <p className="font-mono text-slate-300 mt-0.5">
                  {selectedIncident.location.coordinates.lat.toFixed(4)}, {selectedIncident.location.coordinates.lng.toFixed(4)}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Source / Telemetry</p>
                <p className="text-slate-300 mt-0.5">EOC Triage Doppler Radar</p>
              </div>
            </div>

            {/* Incident Lifecycle Advancement (Section 9) */}
            <div className="p-3.5 rounded-xl bg-[#0F1E33] border border-cyan-500/30 space-y-2">
              <p className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                Incident Lifecycle Transition
              </p>
              <div className="flex items-center gap-1.5 flex-wrap">
                {(['detected', 'verified', 'assessed', 'responding', 'evacuation', 'contained', 'resolved', 'closed'] as IncidentStatus[]).map((stage) => {
                  const isCurrent = selectedIncident.status === stage;
                  return (
                    <button
                      key={stage}
                      onClick={() => handleAdvanceStatus(selectedIncident.id, stage)}
                      className={`px-2 py-1 rounded text-[10px] font-bold uppercase transition-all ${
                        isCurrent
                          ? 'bg-blue-600 text-white shadow'
                          : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {stage}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Description */}
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Detailed Situation</p>
              <p className="text-xs text-slate-300 leading-relaxed bg-[#07111F] p-3 rounded-lg border border-white/6">
                {selectedIncident.description}
              </p>
            </div>

            {/* Operational Actions Required by Section 10 */}
            <div className="space-y-2 pt-2 border-t border-white/8">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Operational Actions</p>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDetailPanelOpen(false);
                    navigate('/decision-support');
                  }}
                  className="border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/10 text-xs"
                >
                  Analyze Risk
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDetailPanelOpen(false);
                    navigate('/maps');
                  }}
                  className="border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 text-xs"
                >
                  View Evacuation
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDetailPanelOpen(false);
                    navigate('/resources');
                  }}
                  className="border-blue-500/30 text-blue-300 hover:bg-blue-500/10 text-xs"
                >
                  View Shelter
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setDetailPanelOpen(false);
                    navigate('/operations');
                  }}
                  className="bg-blue-600 hover:bg-blue-500 text-xs font-bold"
                >
                  Dispatch Team
                </Button>
              </div>
            </div>

            {/* Response Timeline */}
            <div>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Audit Timeline</p>
              <Timeline
                events={selectedIncident.timeline.map((e, i) => ({
                  id: e.id,
                  label: e.label,
                  timestamp: new Date(e.timestamp).toLocaleString('en-IN'),
                  actor: e.actor,
                  completed: i < selectedIncident.timeline.length - 1,
                  active: i === selectedIncident.timeline.length - 1,
                }))}
              />
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export const IncidentDetailContent: React.FC<{ incident: any }> = ({ incident }) => {
  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2 flex-wrap">
        <SeverityBadge severity={incident.severity} size="md" />
        <StatusBadge status={incident.status} size="md" />
        <TypeBadge type={incident.type} />
        <span className="text-xs font-mono text-slate-400 px-2 py-0.5 rounded bg-white/5 border border-white/10 font-bold">
          {incident.id}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs bg-[#091526] p-3 rounded-xl border border-white/8">
        <div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Affected Population</p>
          <p className="text-sm font-bold text-slate-100 mt-0.5">
            {incident.affectedPopulation?.toLocaleString('en-IN') || '—'}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Reported Casualties</p>
          <p className="text-sm font-bold text-slate-100 mt-0.5">
            {incident.casualties || 0}
          </p>
        </div>
        <div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">District / State</p>
          <p className="text-slate-300 mt-0.5">{incident.location.district}, {incident.location.state}</p>
        </div>
        <div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Coordinates</p>
          <p className="font-mono text-slate-300 mt-0.5">
            {incident.location.coordinates.lat.toFixed(4)}, {incident.location.coordinates.lng.toFixed(4)}
          </p>
        </div>
      </div>

      <div>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Situation Brief</p>
        <p className="text-xs text-slate-300 leading-relaxed bg-[#07111F] p-3 rounded-lg border border-white/6">
          {incident.description}
        </p>
      </div>

      {incident.timeline && incident.timeline.length > 0 && (
        <div>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2">Audit Timeline</p>
          <Timeline
            events={incident.timeline.map((e: any, i: number) => ({
              id: e.id,
              label: e.label,
              timestamp: new Date(e.timestamp).toLocaleString('en-IN'),
              actor: e.actor,
              completed: i < incident.timeline.length - 1,
              active: i === incident.timeline.length - 1,
            }))}
          />
        </div>
      )}
    </div>
  );
};

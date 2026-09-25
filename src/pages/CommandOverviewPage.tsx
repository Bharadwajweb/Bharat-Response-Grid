import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertTriangle, Users, Package, Home, Clock, RefreshCw,
  ChevronRight, Activity, MapPin, Shield, Radio,
  ArrowRight, Compass, ShieldAlert, Siren
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../store/appStore';
import { useIncidentStore } from '../store/incidentStore';
import { MOCK_KPI, MOCK_MISSIONS, MOCK_TEAMS, MOCK_SHELTERS } from '../data/mockData';
import { SeverityBadge, StatusBadge, TypeBadge, LiveIndicator } from '../components/ui/Badge';
import { StatCard, Panel, ProgressBar } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Drawer } from '../components/ui/Modal';
import { Timeline } from '../components/ui/Overlay';
import type { Incident } from '../types';

function formatTimeAgo(isoString: string): string {
  const diff = (Date.now() - new Date(isoString).getTime()) / 1000;
  if (diff < 60) return `${Math.round(diff)}s ago`;
  if (diff < 3600) return `${Math.round(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.round(diff / 3600)}h ago`;
  return `${Math.round(diff / 86400)}d ago`;
}

// Agency Readiness Data
const AGENCY_STATUSES = [
  {
    agency: 'NDRF 10th Battalion',
    location: 'Vijayawada, AP',
    strength: '18 Teams (810 Personnel)',
    status: 'Deployed / Operational',
    statusColor: 'text-green-400 bg-green-500/10 border-green-500/25',
    equipment: '34 Inflatable Boats, 800 Life Jackets, Satellite Comms',
    alertLevel: 'Level 1 Immediate',
  },
  {
    agency: 'AP SDRF Quick Reaction',
    location: 'Visakhapatnam Coast',
    strength: '6 Teams (240 Personnel)',
    status: 'On-Scene / Evacuation',
    statusColor: 'text-amber-400 bg-amber-500/10 border-amber-500/25',
    equipment: '16 Rescue Skiffs, 4 Mobile Generators',
    alertLevel: 'Active Landfall Zone',
  },
  {
    agency: 'Indian Coast Guard Dist. HQ 6',
    location: 'Bay of Bengal Sector',
    strength: '3 Fast Patrol Vessels, 2 Chetak Choppers',
    status: 'Sea-Air Standby',
    statusColor: 'text-blue-400 bg-blue-500/10 border-blue-500/25',
    equipment: 'Aerial SAR, Marine Life Rafts',
    alertLevel: 'Maritime Warning',
  },
  {
    agency: 'Indian Air Force 12 Wing',
    location: 'Sulur / Hakimpet Staging',
    strength: '4 Mi-17 V5 Transport Helicopters',
    status: 'Air-Drop Alerted',
    statusColor: 'text-purple-400 bg-purple-500/10 border-purple-500/25',
    equipment: 'Relief Rations, Winch Extraction Units',
    alertLevel: 'Standby 30m Notice',
  },
];

export const CommandOverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { activeCommandLevel, currentUser } = useAppStore();
  const { incidents, selectIncident, selectedIncidentId, detailPanelOpen, setDetailPanelOpen, getById } = useIncidentStore();
  const [lastSync] = useState(new Date());

  const selectedIncident = selectedIncidentId ? getById(selectedIncidentId) : null;
  const kpi = MOCK_KPI;
  const activeIncidents = incidents.filter((i) => i.status !== 'resolved');
  const criticalIncidents = incidents.filter((i) => i.severity === 'critical');

  return (
    <div className="flex flex-col min-h-full">
      {/* Page Header */}
      <div className="px-6 py-4 border-b border-white/6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#07111F]">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-xl font-bold text-slate-100">{t('dashboard.title')}</h1>
            <LiveIndicator />
            <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-blue-500/15 text-blue-400 border border-blue-500/30 uppercase tracking-wider">
              {activeCommandLevel} Command EOC
            </span>
          </div>
          <p className="text-xs text-slate-400">
            {t('dashboard.subtitle')} · Monitoring {currentUser?.stateAssigned || 'All India Grid'}
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <RefreshCw size={12} className="text-slate-500" />
          <span>Synced {formatTimeAgo(lastSync.toISOString())}</span>
          <span className="text-slate-700">·</span>
          <span>IST {lastSync.toLocaleTimeString('en-IN', { hour12: false })}</span>
        </div>
      </div>

      <div className="flex-1 p-4 sm:p-6 space-y-5 max-w-screen-2xl mx-auto w-full">
        {/* National Emergency Broadcast Banner */}
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-red-500/30 bg-gradient-to-r from-red-950/40 via-[#0D1828] to-amber-950/20 p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg shadow-red-950/20"
        >
          <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-red-500/20 border border-red-500/40 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Siren size={20} className="text-red-400 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-500 text-white tracking-wider uppercase">
                  Level 3 Red Alert Active
                </span>
                <span className="text-xs font-semibold text-red-300">Severe Cyclonic Storm Landfall Advisory</span>
                <span className="text-xs text-slate-500">· Andhra Pradesh & South Odisha Coastal Corridor</span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Storm eye 85km East-Southeast of Visakhapatnam. Gusts up to 135 km/h. Inundation buffer 15km inland.
                All district collectors alerted. 18 NDRF battalions operational.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 flex-shrink-0 w-full md:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/weather')}
              className="border-white/15 text-xs text-slate-200 hover:bg-white/5"
            >
              Weather Radar
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Compass size={14} />}
              onClick={() => navigate('/maps')}
              className="bg-blue-600 hover:bg-blue-500 text-xs shadow-md shadow-blue-600/30"
            >
              Launch Live GIS Map →
            </Button>
          </div>
        </motion.div>

        {/* KPI Strip */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3"
        >
          <StatCard
            label={t('dashboard.activeIncidents')}
            value={kpi.activeIncidents}
            icon={<AlertTriangle size={16} />}
            iconColor="text-amber-400"
            sub="↑ 2 from yesterday"
            trend="Elevated"
          />
          <StatCard
            label={t('dashboard.criticalIncidents')}
            value={kpi.criticalIncidents}
            icon={<AlertTriangle size={16} />}
            iconColor="text-red-400"
            critical
            sub="IND-001, IND-002 active"
          />
          <StatCard
            label={t('dashboard.respondersDeployed')}
            value={kpi.respondersDeployed}
            icon={<Users size={16} />}
            iconColor="text-blue-400"
            sub="of 450 total available"
          />
          <StatCard
            label={t('dashboard.sheltersActive')}
            value={kpi.sheltersActive}
            icon={<Home size={16} />}
            iconColor="text-green-400"
            sub="3,611 persons sheltered"
          />
          <StatCard
            label={t('dashboard.resourcesAllocated')}
            value={`${kpi.resourcesAllocated}`}
            icon={<Package size={16} />}
            iconColor="text-cyan-400"
            sub="68% utilization"
          />
          <StatCard
            label={t('dashboard.avgResponse')}
            value={`${kpi.avgResponseTimeMin}m`}
            icon={<Clock size={16} />}
            iconColor="text-violet-400"
            sub="↓ 3min vs target"
            trendUp
            trend="Improving"
          />
        </motion.div>

        {/* Operational Command Grid: Left 2 cols (Situational & Tactical Readiness) + Right 1 col (Feed & Missions) */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* Left Column (2 spans): Tactical Action Board */}
          <div className="xl:col-span-2 space-y-5">
            {/* Critical Incident Action Matrix */}
            <div className="bg-[#0D1828] border border-white/8 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/6">
                <div className="flex items-center gap-2.5">
                  <ShieldAlert size={16} className="text-red-400" />
                  <span className="text-sm font-semibold text-slate-100">Critical & High Priority Incident Queue</span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
                    {criticalIncidents.length} Critical
                  </span>
                </div>
                <button
                  onClick={() => navigate('/incidents')}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium transition-colors"
                >
                  Full Triage Queue ({incidents.length}) <ChevronRight size={13} />
                </button>
              </div>

              <div className="divide-y divide-white/5">
                {incidents.slice(0, 4).map((inc) => (
                  <div
                    key={inc.id}
                    className="p-4 hover:bg-white/[0.02] transition-colors flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <SeverityBadge severity={inc.severity} size="sm" />
                        <span className="text-xs font-mono text-slate-400 font-semibold">{inc.id}</span>
                        <span className="text-slate-600">·</span>
                        <TypeBadge type={inc.type} showIcon={true} />
                        <span className="text-slate-600">·</span>
                        <span className="text-xs text-slate-500">{formatTimeAgo(inc.reportedAt)}</span>
                      </div>
                      <h3 className="text-sm font-semibold text-slate-100 mb-1">{inc.title}</h3>
                      <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                        <span className="flex items-center gap-1 text-slate-300">
                          <MapPin size={12} className="text-slate-500" />
                          {inc.location.district}, {inc.location.state} ({inc.location.area})
                        </span>
                        {inc.affectedPopulation && (
                          <span>Affected: <strong className="text-slate-200">{inc.affectedPopulation.toLocaleString('en-IN')}</strong></span>
                        )}
                        {inc.casualties !== undefined && (
                          <span className={inc.casualties > 0 ? 'text-red-400 font-semibold' : 'text-slate-400'}>
                            Casualties: {inc.casualties}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <StatusBadge status={inc.status} />
                      <Button
                        variant="secondary"
                        size="xs"
                        onClick={() => selectIncident(inc.id)}
                        className="text-xs bg-white/6 hover:bg-white/10 text-slate-200"
                      >
                        Inspect
                      </Button>
                      <Button
                        variant="primary"
                        size="xs"
                        onClick={() => navigate('/operations')}
                        className="text-xs"
                      >
                        Dispatch
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Inter-Agency Deployment & Readiness Matrix */}
            <div className="bg-[#0D1828] border border-white/8 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/6">
                <div className="flex items-center gap-2.5">
                  <Shield size={16} className="text-blue-400" />
                  <span className="text-sm font-semibold text-slate-100">Inter-Agency Readiness & Battalions</span>
                  <LiveIndicator />
                </div>
                <button
                  onClick={() => navigate('/operations')}
                  className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium transition-colors"
                >
                  Manage Deployments <ChevronRight size={13} />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/5">
                {AGENCY_STATUSES.map((agency) => (
                  <div key={agency.agency} className="bg-[#0D1828] p-4 flex flex-col justify-between space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-sm font-semibold text-slate-200">{agency.agency}</h4>
                        <p className="text-xs text-slate-500">{agency.location}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold border ${agency.statusColor}`}>
                        {agency.status}
                      </span>
                    </div>
                    <div className="text-xs space-y-1 pt-1 border-t border-white/5">
                      <p className="text-slate-400">Strength: <strong className="text-slate-200">{agency.strength}</strong></p>
                      <p className="text-slate-500 text-[11px] truncate">Equipment: {agency.equipment}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Tactical Navigation Banner */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div
                onClick={() => navigate('/maps')}
                className="bg-[#0D1828] border border-blue-500/20 hover:border-blue-500/50 rounded-xl p-4 cursor-pointer transition-all duration-150 hover:bg-blue-500/5 group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
                    <Compass size={16} />
                  </div>
                  <ArrowRight size={14} className="text-slate-500 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
                </div>
                <h4 className="text-sm font-bold text-slate-100 mb-0.5">Tactical Map & GIS</h4>
                <p className="text-xs text-slate-400">Full geospatial layer tracking of units, shelters & buffer zones</p>
              </div>

              <div
                onClick={() => navigate('/simulation')}
                className="bg-[#0D1828] border border-purple-500/20 hover:border-purple-500/50 rounded-xl p-4 cursor-pointer transition-all duration-150 hover:bg-purple-500/5 group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                    <Activity size={16} />
                  </div>
                  <ArrowRight size={14} className="text-slate-500 group-hover:text-purple-400 group-hover:translate-x-0.5 transition-all" />
                </div>
                <h4 className="text-sm font-bold text-slate-100 mb-0.5">Threat Simulator</h4>
                <p className="text-xs text-slate-400">Disaster impact projection, casualty modeling and shelter math</p>
              </div>

              <div
                onClick={() => navigate('/communications')}
                className="bg-[#0D1828] border border-cyan-500/20 hover:border-cyan-500/50 rounded-xl p-4 cursor-pointer transition-all duration-150 hover:bg-cyan-500/5 group"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                    <Radio size={16} />
                  </div>
                  <ArrowRight size={14} className="text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
                </div>
                <h4 className="text-sm font-bold text-slate-100 mb-0.5">CAP Comms Center</h4>
                <p className="text-xs text-slate-400">Inter-agency radio net and public emergency alert broadcast</p>
              </div>
            </div>
          </div>

          {/* Right Column: Live Incident Feed & Mission Tracker */}
          <div className="space-y-5">
            {/* Live Incident Feed */}
            <Panel
              title="Live Operational Feed"
              subtitle={`${activeIncidents.length} active transmissions`}
              action={
                <button
                  onClick={() => navigate('/incidents')}
                  className="flex items-center gap-1 text-xs text-blue-400 cursor-pointer hover:text-blue-300"
                >
                  View all <ChevronRight size={12} />
                </button>
              }
            >
              <div className="divide-y divide-white/5 overflow-y-auto" style={{ maxHeight: '360px' }}>
                {incidents.slice(0, 6).map((inc) => (
                  <button
                    key={inc.id}
                    onClick={() => selectIncident(inc.id)}
                    className={`w-full text-left px-4 py-3 hover:bg-white/3 transition-colors ${
                      selectedIncidentId === inc.id
                        ? 'bg-blue-500/8 border-l-2 border-blue-500'
                        : 'border-l-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <SeverityBadge severity={inc.severity} size="sm" />
                      <span className="text-xs text-slate-500 flex-shrink-0">{formatTimeAgo(inc.reportedAt)}</span>
                    </div>
                    <p className="text-xs font-semibold text-slate-200 leading-snug mb-1 line-clamp-1">{inc.title}</p>
                    <div className="flex items-center gap-1.5">
                      <MapPin size={10} className="text-slate-500 flex-shrink-0" />
                      <span className="text-xs text-slate-400 truncate">
                        {inc.location.district}, {inc.location.state}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <StatusBadge status={inc.status} />
                      <TypeBadge type={inc.type} showIcon={false} />
                    </div>
                  </button>
                ))}
              </div>
            </Panel>

            {/* Active Operations & Missions */}
            <Panel
              title="Field Missions in Progress"
              subtitle={`${MOCK_MISSIONS.filter((m) => m.status === 'active').length} battalions dispatched`}
              action={
                <button
                  onClick={() => navigate('/operations')}
                  className="flex items-center gap-1 text-xs text-blue-400 cursor-pointer hover:text-blue-300"
                >
                  Operations <ChevronRight size={12} />
                </button>
              }
            >
              <div className="px-4 py-3 space-y-3.5">
                {MOCK_MISSIONS.filter((m) => m.status === 'active').slice(0, 3).map((mission) => (
                  <div key={mission.id} className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-slate-200 truncate flex-1">{mission.name}</span>
                      <span className="text-xs font-mono font-medium text-slate-400 ml-2">{mission.progress}%</span>
                    </div>
                    <ProgressBar value={mission.progress} size="xs" color="blue" />
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span>Target ETA: <strong className="text-slate-300">{mission.eta}</strong></span>
                      <span>{mission.assignedTeamIds.length} Teams Assigned</span>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            {/* Relief Shelter Occupancy Pulse */}
            <div className="bg-[#0D1828] border border-white/8 rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Home size={15} className="text-green-400" />
                  <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Shelter Occupancy Pulse</span>
                </div>
                <button
                  onClick={() => navigate('/resources')}
                  className="text-xs text-blue-400 hover:text-blue-300"
                >
                  Details
                </button>
              </div>
              <div className="space-y-2.5">
                {MOCK_SHELTERS.slice(0, 3).map((s) => {
                  const pct = Math.round((s.occupancy / s.capacity) * 100);
                  return (
                    <div key={s.id} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-300 font-medium truncate">{s.name}</span>
                        <span className={`font-mono ${pct > 80 ? 'text-amber-400 font-bold' : 'text-slate-400'}`}>
                          {s.occupancy}/{s.capacity} ({pct}%)
                        </span>
                      </div>
                      <ProgressBar value={pct} size="xs" color={pct > 80 ? 'amber' : 'green'} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Incident Detail Drawer */}
      <Drawer
        open={detailPanelOpen}
        onClose={() => setDetailPanelOpen(false)}
        title={selectedIncident?.title || 'Incident Details'}
        subtitle={selectedIncident ? `${selectedIncident.location.district} · ${selectedIncident.location.state}` : ''}
        width="w-[520px]"
      >
        {selectedIncident && <IncidentDetailContent incident={selectedIncident} />}
      </Drawer>
    </div>
  );
};

// ─── Incident Detail Content (shared) ───
export const IncidentDetailContent: React.FC<{ incident: Incident }> = ({ incident }) => {
  const teams = MOCK_TEAMS.filter((t) => incident.assignedTeams.includes(t.id));

  return (
    <div className="px-5 py-4 space-y-5">
      {/* Badges */}
      <div className="flex items-center gap-2 flex-wrap">
        <SeverityBadge severity={incident.severity} size="md" />
        <StatusBadge status={incident.status} size="md" />
        <TypeBadge type={incident.type} />
      </div>

      {/* Meta */}
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">State</p>
          <p className="font-medium text-slate-200">{incident.location.state}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">District</p>
          <p className="font-medium text-slate-200">{incident.location.district}</p>
        </div>
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Area</p>
          <p className="font-medium text-slate-200">{incident.location.area}</p>
        </div>
        {incident.affectedPopulation && (
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Affected Population</p>
            <p className="font-medium text-slate-200">{incident.affectedPopulation.toLocaleString('en-IN')}</p>
          </div>
        )}
        {incident.casualties !== undefined && (
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Casualties</p>
            <p className={`font-bold ${incident.casualties > 0 ? 'text-red-400' : 'text-green-400'}`}>
              {incident.casualties > 0 ? incident.casualties : 'None reported'}
            </p>
          </div>
        )}
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Coordinates</p>
          <p className="font-mono text-xs text-slate-400">
            {incident.location.coordinates.lat.toFixed(4)}, {incident.location.coordinates.lng.toFixed(4)}
          </p>
        </div>
      </div>

      {/* Description */}
      <div>
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Description</p>
        <p className="text-sm text-slate-300 leading-relaxed">{incident.description}</p>
      </div>

      {/* Assigned Teams */}
      {teams.length > 0 && (
        <div>
          <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Assigned Teams ({teams.length})</p>
          <div className="space-y-2">
            {teams.map((team) => (
              <div key={team.id} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/4 border border-white/8">
                <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-200 truncate">{team.name}</p>
                  <p className="text-xs text-slate-400">{team.type} · Strength: {team.strength}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div>
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Response Timeline</p>
        <Timeline
          events={incident.timeline.map((e, i) => ({
            id: e.id,
            label: e.label,
            timestamp: new Date(e.timestamp).toLocaleString('en-IN'),
            actor: e.actor,
            completed: i < incident.timeline.length - 1,
            active: i === incident.timeline.length - 1,
          }))}
        />
      </div>

      {/* AI Briefing */}
      {incident.aiBriefing && (
        <div className="p-4 rounded-lg bg-blue-500/6 border border-blue-500/20">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 rounded bg-blue-500/20 flex items-center justify-center">
              <Activity size={11} className="text-blue-400" />
            </div>
            <p className="text-xs font-bold text-blue-400 uppercase tracking-wider">AI Command Briefing</p>
            <span className="text-xs text-slate-500 ml-auto">Auto-generated</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">{incident.aiBriefing}</p>
          {incident.aiBriefingGeneratedAt && (
            <p className="text-xs text-slate-500 mt-2">
              Generated: {new Date(incident.aiBriefingGeneratedAt).toLocaleString('en-IN')}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

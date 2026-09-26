import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertTriangle, Plus, MapPin, Users, Clock, ChevronRight, Map,
  FileCheck2, XCircle, CheckCircle, Sparkles
} from 'lucide-react';
import { useIncidentStore } from '../store/incidentStore';
import { SeverityBadge, StatusBadge, TypeBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { SearchInput, Select, Input } from '../components/ui/Input';
import { Drawer, Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/Card';
import { IncidentDetailContent } from './CommandOverviewPage';
import { brgSocket } from '../utils/socket';
import { MOCK_CITIZEN_REPORTS } from '../data/mockData';
import { verifyCitizenReportApi } from '../utils/api';
import type { Incident, Severity, IncidentStatus, DisasterType, CitizenReport } from '../types';

const SEVERITY_OPTIONS = [
  { value: 'all', label: 'All Severities' },
  { value: 'critical', label: 'Critical' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  { value: 'reported', label: 'Reported' },
  { value: 'verified', label: 'Verified' },
  { value: 'responding', label: 'Responding' },
  { value: 'contained', label: 'Contained' },
  { value: 'resolved', label: 'Resolved' },
];

const TYPE_OPTIONS = [
  { value: 'all', label: 'All Types' },
  { value: 'flood', label: 'Flood' },
  { value: 'cyclone', label: 'Cyclone' },
  { value: 'earthquake', label: 'Earthquake' },
  { value: 'fire', label: 'Fire' },
  { value: 'landslide', label: 'Landslide' },
  { value: 'drought', label: 'Drought' },
  { value: 'heatwave', label: 'Heatwave' },
  { value: 'other', label: 'Other' },
];

function formatRelativeTime(isoString: string): string {
  const diff = (Date.now() - new Date(isoString).getTime()) / 60000;
  if (diff < 60) return `${Math.round(diff)}m ago`;
  if (diff < 1440) return `${Math.round(diff / 60)}h ago`;
  return `${Math.round(diff / 1440)}d ago`;
}

export const IncidentManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    filters,
    setFilters,
    getFiltered,
    selectIncident,
    selectedIncidentId,
    detailPanelOpen,
    setDetailPanelOpen,
    getById,
    addIncident,
    updateIncidentStatus,
  } = useIncidentStore();

  const isCitizenRoute = location.pathname.includes('citizen-reports');
  const [tabOverride, setTabOverride] = useState<'incidents' | 'citizen' | null>(null);
  const activeTab = tabOverride ?? (isCitizenRoute ? 'citizen' : 'incidents');
  const setActiveTab = (tab: 'incidents' | 'citizen') => setTabOverride(tab);

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [updateStatusModalOpen, setUpdateStatusModalOpen] = useState(false);
  const [selectedNewStatus, setSelectedNewStatus] = useState<IncidentStatus>('responding');
  const [statusNote, setStatusNote] = useState('');

  // Citizen Reports Verification State (Section 11)
  const [citizenReports, setCitizenReports] = useState<CitizenReport[]>(MOCK_CITIZEN_REPORTS);
  const [citizenStatusFilter, setCitizenStatusFilter] = useState<string>('all');
  const [citizenSearch, setCitizenSearch] = useState<string>('');
  const [verificationFeedback, setVerificationFeedback] = useState<string | null>(null);

  // Form State for New Incident
  const [newIncidentForm, setNewIncidentForm] = useState({
    title: '',
    type: 'flood' as DisasterType,
    severity: 'critical' as Severity,
    state: 'Andhra Pradesh',
    district: 'Visakhapatnam',
    area: '',
    affectedPopulation: '',
    casualties: '0',
    description: '',
  });

  const filtered = getFiltered();
  const selectedIncident = selectedIncidentId ? getById(selectedIncidentId) : null;

  // Filtered Citizen Reports
  const filteredCitizenReports = citizenReports.filter((report) => {
    if (citizenStatusFilter !== 'all' && report.status !== citizenStatusFilter) return false;
    if (citizenSearch.trim()) {
      const q = citizenSearch.toLowerCase();
      return (
        report.title.toLowerCase().includes(q) ||
        report.description.toLowerCase().includes(q) ||
        report.location.district.toLowerCase().includes(q) ||
        report.location.area.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Citizen Report Corroborate Action
  const handleCorroborate = async (reportId: string) => {
    const target = citizenReports.find((r) => r.id === reportId);
    if (!target) return;

    const newConfidence = Math.min(96, (target.confidenceScore || 60) + 18);
    const newCount = (target.corroborationCount || 1) + 1;

    setCitizenReports((prev) =>
      prev.map((r) =>
        r.id === reportId
          ? { ...r, status: 'CORROBORATED', confidenceScore: newConfidence, corroborationCount: newCount }
          : r
      )
    );

    try {
      await verifyCitizenReportApi(reportId, 'CORROBORATED', 'Corroborated by nearby satellite / radar matching');
    } catch (e) {
      console.warn('API error, kept local state', e);
    }

    setVerificationFeedback(`Report ${reportId} successfully corroborated with nearby sensor data (Confidence: ${newConfidence}%).`);
    setTimeout(() => setVerificationFeedback(null), 5000);
  };

  // Citizen Report Verify & Escalate to Incident Action
  const handleVerifyAndEscalate = async (reportId: string) => {
    const report = citizenReports.find((r) => r.id === reportId);
    if (!report) return;

    // 1. Update report status to VERIFIED
    setCitizenReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, status: 'VERIFIED', confidenceScore: 99 } : r))
    );

    // 2. Promote to Verified Active Incident
    const newIncId = `INC-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
    const newIncident: Incident = {
      id: newIncId,
      title: report.title,
      type: (report.type as DisasterType) || 'flood',
      severity: report.severity || 'high',
      status: 'verified',
      location: report.location,
      description: `[Verified Citizen Dispatch ${report.id}]: ${report.description}`,
      reportedAt: report.reportedAt,
      updatedAt: new Date().toISOString(),
      assignedTeams: [],
      affectedPopulation: 250,
      casualties: 0,
      notes: [
        {
          id: `N-${Date.now()}`,
          author: 'District Emergency Operations Officer',
          role: 'Incident Commander',
          content: `Vetted and promoted from Citizen Report ${report.id} after sensor corroboration.`,
          timestamp: new Date().toISOString(),
        },
      ],
      timeline: [
        {
          id: 'T1',
          status: 'detected',
          label: `Citizen Report ${report.id} registered`,
          timestamp: report.reportedAt,
          actor: 'Citizen Volunteer App',
        },
        {
          id: 'T2',
          status: 'verified',
          label: 'Corroborated & Promoted to Active Operational Incident',
          timestamp: new Date().toISOString(),
          actor: 'District EOC Authority',
        },
      ],
    };

    addIncident(newIncident);
    brgSocket.emit('incident:created', newIncident);

    try {
      await verifyCitizenReportApi(reportId, 'VERIFIED', 'Promoted to active operational incident');
    } catch (e) {
      console.warn('API error, kept local state', e);
    }

    setVerificationFeedback(`Report ${reportId} VERIFIED and promoted to Active Incident ${newIncId}. Responders alerted!`);
    setTimeout(() => setVerificationFeedback(null), 6000);
  };

  // Citizen Report Reject Action
  const handleRejectReport = async (reportId: string) => {
    setCitizenReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, status: 'REJECTED', confidenceScore: 12 } : r))
    );

    try {
      await verifyCitizenReportApi(reportId, 'REJECTED', 'Inconsistent signals or false alarm');
    } catch (e) {
      console.warn('API error, kept local state', e);
    }

    setVerificationFeedback(`Report ${reportId} flagged as REJECTED (False alarm / uncorroborated).`);
    setTimeout(() => setVerificationFeedback(null), 5000);
  };

  const handleCreateIncident = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIncidentForm.title.trim()) return;

    const newId = `INC-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;
    const created: Incident = {
      id: newId,
      title: newIncidentForm.title.trim(),
      type: newIncidentForm.type,
      severity: newIncidentForm.severity,
      status: 'reported',
      location: {
        state: newIncidentForm.state,
        district: newIncidentForm.district,
        area: newIncidentForm.area || 'Central Sector',
        coordinates: {
          lat: 17.6868 + (Math.random() - 0.5) * 0.1,
          lng: 83.2185 + (Math.random() - 0.5) * 0.1,
        },
      },
      description: newIncidentForm.description || 'Emergency incident recorded by Command Operations Center.',
      reportedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      assignedTeams: [],
      affectedPopulation: newIncidentForm.affectedPopulation ? parseInt(newIncidentForm.affectedPopulation, 10) : 0,
      casualties: newIncidentForm.casualties ? parseInt(newIncidentForm.casualties, 10) : 0,
      notes: [
        {
          id: `N-${Date.now()}`,
          author: 'Command Operations Officer',
          role: 'Incident Commander',
          content: 'Incident registered via CAP Command Gateway.',
          timestamp: new Date().toISOString(),
        },
      ],
      timeline: [
        {
          id: `T1`,
          status: 'reported',
          label: 'Incident Registered in Gateway',
          timestamp: new Date().toISOString(),
          actor: 'Command EOC',
        },
      ],
    };

    addIncident(created);
    brgSocket.emit('incident:created', created);

    // Reset and close
    setNewIncidentForm({
      title: '',
      type: 'flood',
      severity: 'critical',
      state: 'Andhra Pradesh',
      district: 'Visakhapatnam',
      area: '',
      affectedPopulation: '',
      casualties: '0',
      description: '',
    });
    setCreateModalOpen(false);
    selectIncident(newId);
  };

  const handleUpdateStatusConfirm = () => {
    if (!selectedIncident) return;
    updateIncidentStatus(selectedIncident.id, selectedNewStatus);
    brgSocket.emit('incident:updated', { id: selectedIncident.id, status: selectedNewStatus });
    setUpdateStatusModalOpen(false);
    setStatusNote('');
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* Page header */}
      <div className="px-6 py-5 border-b border-white/6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <AlertTriangle size={20} className="text-amber-400" />
              Incident & Citizen Intelligence
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {filtered.length} incidents · {citizenReports.filter((r) => r.status !== 'VERIFIED' && r.status !== 'REJECTED').length} citizen reports awaiting triage
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={<Map size={14} />}
              onClick={() => navigate('/maps')}
              className="text-slate-300 border-white/15 hover:bg-white/5"
            >
              Tactical Map View
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={14} />}
              onClick={() => setCreateModalOpen(true)}
            >
              Create Incident
            </Button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 mt-4 border-b border-white/10 pb-2">
          <button
            onClick={() => setActiveTab('incidents')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'incidents'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <AlertTriangle size={14} />
            <span>Active Incidents ({filtered.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('citizen')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
              activeTab === 'citizen'
                ? 'bg-cyan-600 text-white shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <FileCheck2 size={14} />
            <span>Citizen Report Verification</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-white/20 text-white font-mono">
              {citizenReports.filter((r) => r.status !== 'VERIFIED' && r.status !== 'REJECTED').length}
            </span>
          </button>
        </div>

        {/* Action Feedback Banner */}
        {verificationFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 p-3 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <CheckCircle size={15} className="text-emerald-400 flex-shrink-0" />
              <span>{verificationFeedback}</span>
            </div>
            <button
              onClick={() => setVerificationFeedback(null)}
              className="text-slate-400 hover:text-white text-xs px-2"
            >
              ✕
            </button>
          </motion.div>
        )}

        {/* Filters for Incidents Tab */}
        {activeTab === 'incidents' && (
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <div className="flex-1 min-w-48">
              <SearchInput
                placeholder="Search incidents, district, location..."
                value={filters.search}
                onChange={(e) => setFilters({ search: e.target.value })}
              />
            </div>
            <Select
              options={SEVERITY_OPTIONS}
              value={filters.severity}
              onChange={(e) => setFilters({ severity: e.target.value as Severity | 'all' })}
              className="w-40"
            />
            <Select
              options={STATUS_OPTIONS}
              value={filters.status}
              onChange={(e) => setFilters({ status: e.target.value as IncidentStatus | 'all' })}
              className="w-40"
            />
            <Select
              options={TYPE_OPTIONS}
              value={filters.type}
              onChange={(e) => setFilters({ type: e.target.value as DisasterType | 'all' })}
              className="w-40"
            />
            {(filters.search || filters.severity !== 'all' || filters.status !== 'all' || filters.type !== 'all') && (
              <Button variant="ghost" size="sm" onClick={() => useIncidentStore.getState().resetFilters()}>
                Clear Filters
              </Button>
            )}
          </div>
        )}

        {/* Filters & Pipeline Explainer for Citizen Verification Tab */}
        {activeTab === 'citizen' && (
          <div className="space-y-3 mt-4">
            {/* 4-Stage Verification Workflow Pipeline Badge Strip */}
            <div className="p-3 rounded-xl bg-[#091526] border border-cyan-500/20 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
                <Sparkles size={14} className="text-cyan-400" />
                <span>Verification Pipeline:</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap text-[11px] font-mono">
                <span className="px-2 py-0.5 rounded bg-blue-500/15 border border-blue-500/30 text-blue-300 font-bold">
                  1. NEW
                </span>
                <span className="text-slate-500">→</span>
                <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold">
                  2. UNVERIFIED
                </span>
                <span className="text-slate-500">→</span>
                <span className="px-2 py-0.5 rounded bg-purple-500/15 border border-purple-500/30 text-purple-300 font-bold">
                  3. CORROBORATED
                </span>
                <span className="text-slate-500">→</span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold">
                  4. VERIFIED / REJECTED
                </span>
              </div>
              <span className="text-[11px] text-slate-400">
                Multi-sensor cross check (Radar + Proximity + Responders)
              </span>
            </div>

            {/* Filter inputs */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex-1 min-w-48">
                <SearchInput
                  placeholder="Filter citizen distress reports by locality, river, sector..."
                  value={citizenSearch}
                  onChange={(e) => setCitizenSearch(e.target.value)}
                />
              </div>
              <Select
                options={[
                  { value: 'all', label: 'All Verification Statuses' },
                  { value: 'NEW', label: 'NEW' },
                  { value: 'UNVERIFIED', label: 'UNVERIFIED' },
                  { value: 'CORROBORATED', label: 'CORROBORATED' },
                  { value: 'VERIFIED', label: 'VERIFIED' },
                  { value: 'REJECTED', label: 'REJECTED' },
                ]}
                value={citizenStatusFilter}
                onChange={(e) => setCitizenStatusFilter(e.target.value)}
                className="w-48"
              />
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto p-4">
        {/* TAB 1: Active Incidents Table */}
        {activeTab === 'incidents' && (
          <>
            {filtered.length === 0 ? (
              <div className="py-12">
                <EmptyState
                  icon={<AlertTriangle size={36} className="text-amber-400" />}
                  title="No incidents match the active filters"
                  description="Adjust your search criteria or register a new field incident."
                  action={
                    <Button variant="primary" size="sm" icon={<Plus size={14} />} onClick={() => setCreateModalOpen(true)}>
                      Create New Incident
                    </Button>
                  }
                />
              </div>
            ) : (
              <div className="bg-[#0D1828] border border-white/8 rounded-xl overflow-hidden shadow-xl">
                <table className="data-table min-w-[900px]">
                  <thead>
                    <tr>
                      <th>Severity</th>
                      <th>Incident</th>
                      <th>Type</th>
                      <th>Location</th>
                      <th>Status</th>
                      <th>Teams</th>
                      <th>Reported</th>
                      <th>Updated</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((inc, idx) => (
                      <motion.tr
                        key={inc.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: Math.min(idx * 0.02, 0.2) }}
                        className={`cursor-pointer transition-colors ${
                          selectedIncidentId === inc.id ? 'bg-blue-500/10 border-l-2 border-blue-500' : 'hover:bg-white/[0.02]'
                        }`}
                        onClick={() => selectIncident(inc.id)}
                      >
                        <td><SeverityBadge severity={inc.severity} /></td>
                        <td>
                          <div className="max-w-64">
                            <p className="text-sm font-semibold text-slate-100 line-clamp-1">{inc.title}</p>
                            <p className="text-xs font-mono text-slate-500 mt-0.5">{inc.id}</p>
                          </div>
                        </td>
                        <td><TypeBadge type={inc.type} /></td>
                        <td>
                          <div className="flex items-start gap-1">
                            <MapPin size={12} className="text-slate-500 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-xs text-slate-200 font-medium">{inc.location.district}</p>
                              <p className="text-xs text-slate-500">{inc.location.state} ({inc.location.area})</p>
                            </div>
                          </div>
                        </td>
                        <td><StatusBadge status={inc.status} /></td>
                        <td>
                          <div className="flex items-center gap-1 text-xs text-slate-300">
                            <Users size={12} className="text-slate-500" />
                            {inc.assignedTeams.length > 0 ? (
                              `${inc.assignedTeams.length} battalion${inc.assignedTeams.length !== 1 ? 's' : ''}`
                            ) : (
                              <span className="text-slate-500">Unassigned</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <div className="flex items-center gap-1 text-xs text-slate-400">
                            <Clock size={11} className="text-slate-500" />
                            {formatRelativeTime(inc.reportedAt)}
                          </div>
                        </td>
                        <td>
                          <span className="text-xs text-slate-500">{formatRelativeTime(inc.updatedAt)}</span>
                        </td>
                        <td>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              selectIncident(inc.id);
                            }}
                            className="p-1.5 rounded text-slate-500 hover:text-slate-200 hover:bg-white/8 transition-colors"
                            aria-label="View details"
                          >
                            <ChevronRight size={16} />
                          </button>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* TAB 2: Citizen Report Verification Workflow (Section 11) */}
        {activeTab === 'citizen' && (
          <div className="space-y-4">
            {filteredCitizenReports.length === 0 ? (
              <div className="py-12">
                <EmptyState
                  icon={<FileCheck2 size={36} className="text-cyan-400" />}
                  title="No citizen reports match active filters"
                  description="Reports submitted via Citizen Mobile App or SOS Beacons will appear here for verification."
                />
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3.5">
                {filteredCitizenReports.map((report) => {
                  const isVerified = report.status === 'VERIFIED';
                  const isRejected = report.status === 'REJECTED';
                  const isCorroborated = report.status === 'CORROBORATED';

                  return (
                    <motion.div
                      key={report.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-xl bg-[#091526] border border-white/10 hover:border-cyan-500/30 transition-all shadow-lg"
                    >
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                        {/* Left: Metadata & Description */}
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-white/5 border border-white/10 text-cyan-300">
                              {report.id}
                            </span>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-300 uppercase">
                              {report.type}
                            </span>
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <Clock size={12} className="text-slate-500" />
                              {formatRelativeTime(report.reportedAt)}
                            </span>
                            {/* Privacy preserved: minimal info displayed */}
                            <span className="text-[11px] text-slate-400 bg-white/5 px-2 py-0.5 rounded font-mono">
                              Source: {report.contact || 'Citizen Volunteer App'} (Privacy Guarded)
                            </span>
                          </div>

                          <h3 className="text-sm font-bold text-white leading-snug">
                            {report.title}
                          </h3>

                          <p className="text-xs text-slate-300 leading-relaxed bg-[#07111F] p-3 rounded-lg border border-white/6">
                            {report.description}
                          </p>

                          <div className="flex items-center gap-4 text-xs text-slate-400 flex-wrap">
                            <span className="flex items-center gap-1">
                              <MapPin size={12} className="text-cyan-400" />
                              <strong className="text-slate-200">{report.location.area}</strong>, {report.location.district}, {report.location.state}
                            </span>
                            <span className="font-mono text-slate-500 text-[11px]">
                              [{report.location.coordinates.lat.toFixed(4)}, {report.location.coordinates.lng.toFixed(4)}]
                            </span>
                          </div>
                        </div>

                        {/* Right: Confidence Score & Verification Workflow Controls */}
                        <div className="lg:w-80 flex flex-col justify-between p-3 rounded-xl bg-[#0F1E33] border border-white/8 space-y-3">
                          <div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-400 font-medium">Confidence Score</span>
                              <span className="font-mono font-bold text-cyan-300">
                                {report.confidenceScore || 60}%
                              </span>
                            </div>
                            <div className="h-2 w-full bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-300 ${
                                  (report.confidenceScore || 60) > 80
                                    ? 'bg-emerald-500'
                                    : (report.confidenceScore || 60) > 60
                                    ? 'bg-amber-400'
                                    : 'bg-red-400'
                                }`}
                                style={{ width: `${report.confidenceScore || 60}%` }}
                              />
                            </div>
                          </div>

                          {/* Corroborating Signals */}
                          <div className="text-[11px] text-slate-400 space-y-1">
                            <div className="flex items-center justify-between">
                              <span>Nearby Similar Reports:</span>
                              <span className="font-mono text-slate-200 font-bold">{report.corroborationCount || 1} signal(s)</span>
                            </div>
                            <div className="flex items-center justify-between">
                              <span>Current Verification Status:</span>
                              <span
                                className={`font-mono font-bold text-[10px] px-1.5 py-0.5 rounded ${
                                  isVerified
                                    ? 'bg-emerald-500/20 text-emerald-300'
                                    : isRejected
                                    ? 'bg-red-500/20 text-red-300'
                                    : isCorroborated
                                    ? 'bg-purple-500/20 text-purple-300'
                                    : 'bg-amber-500/20 text-amber-300'
                                }`}
                              >
                                {report.status}
                              </span>
                            </div>
                          </div>

                          {/* Verification Decision Buttons */}
                          <div className="pt-2 border-t border-white/10 flex items-center gap-1.5">
                            {!isVerified && !isRejected && (
                              <>
                                <button
                                  onClick={() => handleCorroborate(report.id)}
                                  className="flex-1 py-1.5 px-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-300 text-[11px] font-bold transition-all text-center"
                                  title="Corroborate using nearby reports and Doppler radar"
                                >
                                  Corroborate
                                </button>
                                <button
                                  onClick={() => handleVerifyAndEscalate(report.id)}
                                  className="flex-1 py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition-all text-center shadow"
                                  title="Verify and promote to active operational incident"
                                >
                                  Verify & Escalate
                                </button>
                                <button
                                  onClick={() => handleRejectReport(report.id)}
                                  className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-[11px] font-bold transition-all"
                                  title="Flag as false report / uncorroborated"
                                >
                                  <XCircle size={15} />
                                </button>
                              </>
                            )}

                            {isVerified && (
                              <div className="w-full flex items-center justify-center gap-1.5 py-1 rounded bg-emerald-500/15 text-emerald-300 text-xs font-bold">
                                <CheckCircle size={14} />
                                <span>Promoted to Active Incident</span>
                              </div>
                            )}

                            {isRejected && (
                              <div className="w-full flex items-center justify-center gap-1.5 py-1 rounded bg-red-500/15 text-red-300 text-xs font-bold">
                                <XCircle size={14} />
                                <span>Flagged False Report</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detail drawer */}
      <Drawer
        open={detailPanelOpen}
        onClose={() => setDetailPanelOpen(false)}
        title={selectedIncident?.title || 'Incident Details'}
        subtitle={selectedIncident ? `${selectedIncident.id} · ${selectedIncident.location.district}` : ''}
        width="w-[560px]"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button variant="ghost" size="sm" onClick={() => setDetailPanelOpen(false)}>
              Close
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/operations')}
              >
                Dispatch Teams
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  if (selectedIncident) {
                    setSelectedNewStatus(selectedIncident.status);
                    setUpdateStatusModalOpen(true);
                  }
                }}
              >
                Update Status
              </Button>
            </div>
          </div>
        }
      >
        {selectedIncident && <IncidentDetailContent incident={selectedIncident} />}
      </Drawer>

      {/* Create Incident Modal */}
      <Modal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Register New Emergency Incident"
        subtitle="CAP Common Alerting Protocol Entry Form"
        size="lg"
      >
        <form onSubmit={handleCreateIncident} className="space-y-4">
          <Input
            label="Incident Title"
            required
            placeholder="e.g. Flash Flood — Godavari Basin Breach"
            value={newIncidentForm.title}
            onChange={(e) => setNewIncidentForm({ ...newIncidentForm, title: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Disaster Type"
              options={TYPE_OPTIONS.filter((o) => o.value !== 'all')}
              value={newIncidentForm.type}
              onChange={(e) => setNewIncidentForm({ ...newIncidentForm, type: e.target.value as DisasterType })}
            />
            <Select
              label="Severity Level"
              options={[
                { value: 'critical', label: 'Critical (Immediate Threat)' },
                { value: 'high', label: 'High (Elevated Danger)' },
                { value: 'medium', label: 'Medium (Guarded)' },
                { value: 'low', label: 'Low (Advisory)' },
              ]}
              value={newIncidentForm.severity}
              onChange={(e) => setNewIncidentForm({ ...newIncidentForm, severity: e.target.value as Severity })}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="State"
              required
              value={newIncidentForm.state}
              onChange={(e) => setNewIncidentForm({ ...newIncidentForm, state: e.target.value })}
            />
            <Input
              label="District"
              required
              value={newIncidentForm.district}
              onChange={(e) => setNewIncidentForm({ ...newIncidentForm, district: e.target.value })}
            />
            <Input
              label="Area / Ward"
              placeholder="e.g. Sector 4"
              value={newIncidentForm.area}
              onChange={(e) => setNewIncidentForm({ ...newIncidentForm, area: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Affected Population (Est.)"
              type="number"
              placeholder="e.g. 5000"
              value={newIncidentForm.affectedPopulation}
              onChange={(e) => setNewIncidentForm({ ...newIncidentForm, affectedPopulation: e.target.value })}
            />
            <Input
              label="Casualties Reported"
              type="number"
              placeholder="0"
              value={newIncidentForm.casualties}
              onChange={(e) => setNewIncidentForm({ ...newIncidentForm, casualties: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Situation Description
            </label>
            <textarea
              rows={3}
              placeholder="Provide field situation assessment, water levels, wind speed, or immediate assistance requirements..."
              value={newIncidentForm.description}
              onChange={(e) => setNewIncidentForm({ ...newIncidentForm, description: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white/5 border border-white/15 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
            <Button variant="ghost" type="button" onClick={() => setCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Register & Broadcast
            </Button>
          </div>
        </form>
      </Modal>

      {/* Update Status Modal */}
      <Modal
        open={updateStatusModalOpen}
        onClose={() => setUpdateStatusModalOpen(false)}
        title="Update Incident Lifecycle Status"
        subtitle={selectedIncident ? `${selectedIncident.id} · ${selectedIncident.title}` : ''}
        size="md"
      >
        <div className="space-y-4">
          <Select
            label="Lifecycle Status"
            options={[
              { value: 'reported', label: 'Reported (Under Initial Verification)' },
              { value: 'verified', label: 'Verified (Confirmed by District DEOC)' },
              { value: 'responding', label: 'Responding (NDRF / SDRF Deployed)' },
              { value: 'contained', label: 'Contained (Threat Mitigated / Evacuated)' },
              { value: 'resolved', label: 'Resolved (Recovery / Operations Closed)' },
            ]}
            value={selectedNewStatus}
            onChange={(e) => setSelectedNewStatus(e.target.value as IncidentStatus)}
          />

          <Input
            label="Officer Transition Log Note (Optional)"
            placeholder="e.g. Flood waters receding; relief supplies delivered."
            value={statusNote}
            onChange={(e) => setStatusNote(e.target.value)}
          />

          <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
            <Button variant="ghost" onClick={() => setUpdateStatusModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleUpdateStatusConfirm}>
              Commit Status Change
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

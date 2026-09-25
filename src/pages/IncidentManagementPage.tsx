import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  AlertTriangle, Plus, Search, Filter, MoreVertical,
  MapPin, Users, Clock, ChevronRight, List, Map, CheckCircle2, Shield
} from 'lucide-react';
import { useIncidentStore } from '../store/incidentStore';
import { SeverityBadge, StatusBadge, TypeBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { SearchInput, Select, Input } from '../components/ui/Input';
import { Drawer, Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/Card';
import { IncidentDetailContent } from './CommandOverviewPage';
import { brgSocket } from '../utils/socket';
import type { Incident, Severity, IncidentStatus, DisasterType } from '../types';

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

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [updateStatusModalOpen, setUpdateStatusModalOpen] = useState(false);
  const [selectedNewStatus, setSelectedNewStatus] = useState<IncidentStatus>('responding');
  const [statusNote, setStatusNote] = useState('');

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
              Incident Management
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {filtered.length} incidents · {filtered.filter((i) => i.status !== 'resolved').length} active
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

        {/* Filters */}
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
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto p-4">
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
                        <ChevronRight size={14} />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
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

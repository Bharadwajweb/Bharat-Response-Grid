import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Radio, Target, Users, Clock, CheckCircle2, PlayCircle,
  PauseCircle, XCircle, Plus, ShieldCheck, ChevronRight
} from 'lucide-react';
import { MOCK_MISSIONS, MOCK_TEAMS } from '../data/mockData';
import { useIncidentStore } from '../store/incidentStore';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { ProgressBar } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Input, Select } from '../components/ui/Input';
import { brgSocket } from '../utils/socket';
import type { Mission, MissionStatus, Team } from '../types';

const STATUS_CONFIG: Record<MissionStatus, { label: string; icon: React.ReactNode; color: string; bg: string; }> = {
  planning: { label: 'Planning', icon: <Clock size={12} />, color: 'text-slate-400', bg: 'bg-slate-500/10 border-slate-500/20' },
  active: { label: 'Active', icon: <PlayCircle size={12} />, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  paused: { label: 'Paused', icon: <PauseCircle size={12} />, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  completed: { label: 'Completed', icon: <CheckCircle2 size={12} />, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
  aborted: { label: 'Aborted', icon: <XCircle size={12} />, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20' },
};

const PRIORITY_CONFIG = {
  critical: 'text-red-400 bg-red-500/10 border-red-500/20',
  high: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  medium: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  low: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
};

export const EmergencyOperationsPage: React.FC = () => {
  const { incidents, getById } = useIncidentStore();
  const [activeTab, setActiveTab] = useState<'missions' | 'teams'>('missions');
  const [missions, setMissions] = useState<Mission[]>(MOCK_MISSIONS);
  const [teams, setTeams] = useState<Team[]>(MOCK_TEAMS);
  const [newMissionModalOpen, setNewMissionModalOpen] = useState(false);

  // New Mission Form State
  const [newMissionForm, setNewMissionForm] = useState({
    name: '',
    priority: 'critical' as 'critical' | 'high' | 'medium' | 'low',
    incidentId: incidents[0]?.id || 'INC-2024-001',
    eta: '4 hours',
    objective: '',
    assignedTeamId: 'TEAM-002',
  });

  const activeMissions = missions.filter((m) => m.status === 'active');
  const deployedTeams = teams.filter((t) => t.status === 'deployed');
  const availableTeams = teams.filter((t) => t.status === 'available');

  const handleCreateMission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMissionForm.name.trim()) return;

    const newMsn: Mission = {
      id: `MSN-00${missions.length + 1}`,
      name: newMissionForm.name.trim(),
      priority: newMissionForm.priority,
      status: 'active',
      assignedTeamIds: [newMissionForm.assignedTeamId],
      incidentId: newMissionForm.incidentId,
      progress: 10,
      startedAt: new Date().toISOString(),
      eta: newMissionForm.eta || 'Ongoing',
      objective: newMissionForm.objective || 'Provide tactical disaster relief.',
    };

    setMissions([newMsn, ...missions]);

    // Update team status to deployed
    setTeams((prev) =>
      prev.map((t) =>
        t.id === newMissionForm.assignedTeamId
          ? { ...t, status: 'deployed', assignedIncidentId: newMissionForm.incidentId }
          : t
      )
    );

    brgSocket.emit('mission:updated', newMsn);
    setNewMissionForm({
      name: '',
      priority: 'critical',
      incidentId: incidents[0]?.id || 'INC-2024-001',
      eta: '4 hours',
      objective: '',
      assignedTeamId: 'TEAM-002',
    });
    setNewMissionModalOpen(false);
  };

  const handleUpdateMissionStatus = (missionId: string, newStatus: MissionStatus) => {
    setMissions((prev) =>
      prev.map((m) => (m.id === missionId ? { ...m, status: newStatus } : m))
    );
    brgSocket.emit('mission:updated', { id: missionId, status: newStatus });
  };

  const handleAdvanceMissionProgress = (missionId: string) => {
    setMissions((prev) =>
      prev.map((m) => {
        if (m.id !== missionId) return m;
        const newProgress = Math.min(m.progress + 20, 100);
        const newStatus = newProgress >= 100 ? 'completed' : m.status;
        return { ...m, progress: newProgress, status: newStatus };
      })
    );
  };

  return (
    <div className="flex flex-col min-h-full">
      <div className="px-6 py-5 border-b border-white/6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Radio size={20} className="text-blue-400" />
              Emergency Operations
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Command board · Active missions and battalion deployment
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={14} />}
            onClick={() => setNewMissionModalOpen(true)}
          >
            New Mission
          </Button>
        </div>

        {/* Summary Bar */}
        <div className="flex gap-6 mt-4 flex-wrap">
          {[
            { label: 'Active Missions', value: activeMissions.length, color: 'text-blue-400' },
            { label: 'Teams Deployed', value: deployedTeams.length, color: 'text-amber-400' },
            { label: 'Teams Available', value: availableTeams.length, color: 'text-green-400' },
            {
              label: 'Responders On-Mission',
              value: deployedTeams.reduce((sum, t) => sum + t.strength, 0),
              color: 'text-slate-200',
            },
          ].map((item) => (
            <div key={item.label} className="flex flex-col">
              <span className={`text-2xl font-bold tabular-nums ${item.color}`}>{item.value}</span>
              <span className="text-xs text-slate-500 uppercase tracking-wider">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex-1 p-4 sm:p-6 overflow-auto">
        {/* Tab buttons */}
        <div className="flex gap-1 mb-4">
          {(['missions', 'teams'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all capitalize ${
                activeTab === tab
                  ? 'bg-blue-500/15 text-blue-400 border border-blue-500/25 shadow-sm'
                  : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
              }`}
            >
              {tab === 'missions' ? `Tactical Missions (${missions.length})` : `Battalions & Teams (${teams.length})`}
            </button>
          ))}
        </div>

        {activeTab === 'missions' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {missions.map((mission, idx) => {
              const statusCfg = STATUS_CONFIG[mission.status];
              const incident = getById(mission.incidentId);
              const assignedTeamsList = teams.filter((t) => mission.assignedTeamIds.includes(t.id));

              return (
                <motion.div
                  key={mission.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(idx * 0.04, 0.2) }}
                  className="bg-[#0D1828] border border-white/8 rounded-xl p-4 space-y-3.5 hover:border-white/15 transition-all shadow-lg"
                >
                  {/* Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-slate-100 leading-snug">{mission.name}</p>
                      <p className="text-xs font-mono text-slate-500 mt-0.5">{mission.id}</p>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded border text-xs font-bold flex-shrink-0 ${statusCfg.bg} ${statusCfg.color}`}
                    >
                      {statusCfg.icon} {statusCfg.label}
                    </span>
                  </div>

                  {/* Priority & Target Incident */}
                  <div className="space-y-1.5 text-xs">
                    <div className="flex items-center gap-2">
                      <Target size={12} className="text-slate-500" />
                      <span className="text-slate-400">Priority:</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${PRIORITY_CONFIG[mission.priority]}`}>
                        {mission.priority}
                      </span>
                    </div>

                    {incident && (
                      <div className="px-2.5 py-1.5 rounded-lg bg-white/4 border border-white/6">
                        <p className="text-[10px] text-slate-500 uppercase tracking-wider">Target Incident</p>
                        <p className="text-xs font-medium text-slate-200 line-clamp-1">{incident.title}</p>
                      </div>
                    )}
                  </div>

                  {/* Progress with interactive step */}
                  <div className="space-y-1.5">
                    <ProgressBar
                      value={mission.progress}
                      label="Objective Execution"
                      showValue
                      size="sm"
                      color={mission.progress >= 100 ? 'green' : mission.progress >= 50 ? 'blue' : 'amber'}
                    />
                    <div className="flex justify-between items-center text-xs text-slate-500">
                      <span>Target ETA: <strong className="text-slate-300">{mission.eta || '—'}</strong></span>
                      {mission.status === 'active' && mission.progress < 100 && (
                        <button
                          onClick={() => handleAdvanceMissionProgress(mission.id)}
                          className="text-[11px] text-blue-400 hover:text-blue-300 font-semibold"
                        >
                          + Advance +20%
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Objective */}
                  <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
                    {mission.objective}
                  </p>

                  {/* Assigned Teams list */}
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Users size={12} className="text-slate-500" />
                      <span>{assignedTeamsList.length} Units Assigned</span>
                    </div>

                    {/* Quick status actions */}
                    <div className="flex items-center gap-1.5">
                      {mission.status === 'active' ? (
                        <button
                          onClick={() => handleUpdateMissionStatus(mission.id, 'completed')}
                          className="px-2 py-0.5 rounded bg-green-500/15 hover:bg-green-500/25 text-green-400 border border-green-500/30 text-[11px] font-semibold"
                        >
                          Complete
                        </button>
                      ) : (
                        <button
                          onClick={() => handleUpdateMissionStatus(mission.id, 'active')}
                          className="px-2 py-0.5 rounded bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 border border-blue-500/30 text-[11px] font-semibold"
                        >
                          Reactivate
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {activeTab === 'teams' && (
          <div className="bg-[#0D1828] border border-white/8 rounded-xl overflow-hidden shadow-xl">
            <table className="data-table min-w-[700px]">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>Battalion / Team</th>
                  <th>Corps Type</th>
                  <th>State Hub</th>
                  <th>Command Level</th>
                  <th>Strength</th>
                  <th>Assigned Task</th>
                  <th>Contact</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((team, idx) => {
                  const incident = team.assignedIncidentId ? getById(team.assignedIncidentId) : null;
                  const statusColors: Record<string, string> = {
                    deployed: 'bg-amber-500',
                    available: 'bg-green-500',
                    standby: 'bg-blue-500',
                    'off-duty': 'bg-slate-600',
                  };
                  return (
                    <motion.tr
                      key={team.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: Math.min(idx * 0.02, 0.2) }}
                      className="hover:bg-white/[0.02]"
                    >
                      <td>
                        <div className="flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${statusColors[team.status] || 'bg-slate-500'}`} />
                          <span className="text-xs capitalize text-slate-300 font-medium">{team.status}</span>
                        </div>
                      </td>
                      <td>
                        <p className="text-sm font-semibold text-slate-200">{team.name}</p>
                        <p className="text-xs font-mono text-slate-500">{team.id}</p>
                      </td>
                      <td><Badge variant="ghost" size="xs">{team.type}</Badge></td>
                      <td><span className="text-sm text-slate-300">{team.state}</span></td>
                      <td><span className="text-xs text-slate-400 capitalize">{team.commandLevel}</span></td>
                      <td>
                        <span className="text-sm font-semibold text-slate-200 tabular-nums">{team.strength}</span>
                        <span className="text-xs text-slate-500 ml-1">personnel</span>
                      </td>
                      <td>
                        {incident ? (
                          <div>
                            <p className="text-xs text-slate-200 font-medium truncate max-w-40">{incident.title}</p>
                            <p className="text-xs font-mono text-slate-500">{incident.id}</p>
                          </div>
                        ) : (
                          <span className="text-slate-500 text-xs">Unassigned</span>
                        )}
                      </td>
                      <td>
                        <a href={`tel:${team.contactNumber}`} className="text-xs text-blue-400 hover:underline">
                          {team.contactNumber}
                        </a>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Mission Modal */}
      <Modal
        open={newMissionModalOpen}
        onClose={() => setNewMissionModalOpen(false)}
        title="Deploy New Tactical Mission"
        subtitle="National Disaster Response Coordination Board"
        size="lg"
      >
        <form onSubmit={handleCreateMission} className="space-y-4">
          <Input
            label="Mission Codename"
            required
            placeholder="e.g. Op Cyclone Shield — Sector 4"
            value={newMissionForm.name}
            onChange={(e) => setNewMissionForm({ ...newMissionForm, name: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Operational Priority"
              options={[
                { value: 'critical', label: 'Critical' },
                { value: 'high', label: 'High' },
                { value: 'medium', label: 'Medium' },
                { value: 'low', label: 'Low' },
              ]}
              value={newMissionForm.priority}
              onChange={(e) =>
                setNewMissionForm({ ...newMissionForm, priority: e.target.value as any })
              }
            />

            <Select
              label="Target Incident"
              options={incidents.map((i) => ({ value: i.id, label: `${i.id}: ${i.title.slice(0, 24)}...` }))}
              value={newMissionForm.incidentId}
              onChange={(e) => setNewMissionForm({ ...newMissionForm, incidentId: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Assign Lead Battalion"
              options={teams.map((t) => ({
                value: t.id,
                label: `${t.name} (${t.type})`,
              }))}
              value={newMissionForm.assignedTeamId}
              onChange={(e) => setNewMissionForm({ ...newMissionForm, assignedTeamId: e.target.value })}
            />
            <Input
              label="Target Completion ETA"
              placeholder="e.g. 6 hours"
              value={newMissionForm.eta}
              onChange={(e) => setNewMissionForm({ ...newMissionForm, eta: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Mission Objective & Scope
            </label>
            <textarea
              rows={3}
              required
              placeholder="State key directives: Evacuate residents, distribute life jackets, restore power lines..."
              value={newMissionForm.objective}
              onChange={(e) => setNewMissionForm({ ...newMissionForm, objective: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-white/5 border border-white/15 rounded-lg text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
            <Button variant="ghost" type="button" onClick={() => setNewMissionModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Mobilize & Deploy
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

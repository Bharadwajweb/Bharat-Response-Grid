import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Plus, Search, MoreHorizontal, ShieldCheck, ShieldOff,
  Trash2, Activity, Mail, UserCheck
} from 'lucide-react';
import { MOCK_USERS, MOCK_AUDIT_LOGS } from '../data/mockData';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { SearchInput, Input, Select } from '../components/ui/Input';
import { UserAvatar } from '../components/ui/Overlay';
import { ConfirmDialog, Modal, Tabs } from '../components/ui/Modal';
import type { User, UserRole, CommandLevel } from '../types';

export const UserManagementPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('users');
  const [search, setSearch] = useState('');
  const [confirmAction, setConfirmAction] = useState<{ type: 'suspend' | 'remove'; user: User } | null>(null);
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [addUserModalOpen, setAddUserModalOpen] = useState(false);

  // New User Form State
  const [newUserForm, setNewUserForm] = useState({
    name: '',
    email: '',
    role: 'responder' as UserRole,
    commandLevel: 'state' as CommandLevel,
    stateAssigned: 'Andhra Pradesh',
    districtAssigned: '',
  });

  const filtered = users.filter((u) =>
    !search ||
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleConfirm = () => {
    if (!confirmAction) return;
    if (confirmAction.type === 'suspend') {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === confirmAction.user.id
            ? { ...u, status: u.status === 'active' ? 'suspended' : 'active' }
            : u
        )
      );
    } else {
      setUsers((prev) => prev.filter((u) => u.id !== confirmAction.user.id));
    }
    setConfirmAction(null);
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserForm.name.trim() || !newUserForm.email.trim()) return;

    const initials = newUserForm.name
      .split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();

    const createdUser: User = {
      id: `USR-${Date.now().toString().slice(-4)}`,
      name: newUserForm.name.trim(),
      email: newUserForm.email.trim(),
      role: newUserForm.role,
      commandLevel: newUserForm.commandLevel,
      stateAssigned: newUserForm.stateAssigned || undefined,
      districtAssigned: newUserForm.districtAssigned || undefined,
      avatarInitials: initials || 'OF',
      status: 'active',
      lastActive: 'Just now',
    };

    setUsers([createdUser, ...users]);
    setNewUserForm({
      name: '',
      email: '',
      role: 'responder',
      commandLevel: 'state',
      stateAssigned: 'Andhra Pradesh',
      districtAssigned: '',
    });
    setAddUserModalOpen(false);
  };

  const ROLE_BADGES: Record<string, 'critical' | 'warning' | 'info' | 'success' | 'ghost'> = {
    national_admin: 'critical',
    state_admin: 'warning',
    district_admin: 'info',
    responder: 'success',
    citizen: 'ghost',
  };

  return (
    <div className="flex flex-col min-h-full">
      <div className="px-6 py-5 border-b border-white/6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Users size={20} className="text-blue-400" />
              User & Officer Directory
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              {users.length} registered officers · {users.filter((u) => u.status === 'active').length} active
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            icon={<Plus size={14} />}
            onClick={() => setAddUserModalOpen(true)}
          >
            Add Officer
          </Button>
        </div>
      </div>

      <Tabs
        tabs={[
          { id: 'users', label: 'Officer Directory', icon: <Users size={14} />, count: users.length },
          { id: 'audit', label: 'Audit Trail', icon: <Activity size={14} />, count: MOCK_AUDIT_LOGS.length },
        ]}
        active={activeTab}
        onChange={setActiveTab}
        className="px-6"
      />

      <div className="flex-1 p-4 sm:p-6 overflow-auto">
        {activeTab === 'users' && (
          <>
            <div className="mb-4 max-w-sm">
              <SearchInput
                placeholder="Search officers by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="bg-[#0D1828] border border-white/8 rounded-xl overflow-hidden shadow-xl">
              <table className="data-table min-w-[750px]">
                <thead>
                  <tr>
                    <th>Officer</th>
                    <th>Designated Role</th>
                    <th>Command Level</th>
                    <th>Jurisdiction</th>
                    <th>Account Status</th>
                    <th>Last Active</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((user, idx) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: Math.min(idx * 0.02, 0.2) }}
                      className="hover:bg-white/[0.02]"
                    >
                      <td>
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            initials={user.avatarInitials}
                            size="sm"
                            online={Boolean(user.onlineAt)}
                          />
                          <div>
                            <p className="text-sm font-semibold text-slate-200">{user.name}</p>
                            <p className="text-xs text-slate-500">{user.email}</p>
                          </div>
                        </div>
                      </td>
                      <td>
                        <Badge variant={ROLE_BADGES[user.role] || 'ghost'} size="xs">
                          {user.role.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td>
                        <span className="text-xs text-slate-300 capitalize font-medium">
                          {user.commandLevel}
                        </span>
                      </td>
                      <td>
                        <span className="text-xs text-slate-400">
                          {user.stateAssigned || 'National HQ'}
                          {user.districtAssigned ? ` · ${user.districtAssigned}` : ''}
                        </span>
                      </td>
                      <td>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold border ${
                            user.status === 'active'
                              ? 'text-green-400 bg-green-500/10 border-green-500/20'
                              : 'text-red-400 bg-red-500/10 border-red-500/20'
                          }`}
                        >
                          {user.status === 'active' ? (
                            <ShieldCheck size={11} />
                          ) : (
                            <ShieldOff size={11} />
                          )}
                          <span className="capitalize">{user.status}</span>
                        </span>
                      </td>
                      <td>
                        <span className="text-xs text-slate-500">{user.lastActive}</span>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setConfirmAction({ type: 'suspend', user })}
                            title={user.status === 'active' ? 'Suspend Account' : 'Reactivate'}
                            className="p-1 rounded text-slate-500 hover:text-amber-400 hover:bg-white/6 transition-colors"
                          >
                            <ShieldOff size={14} />
                          </button>
                          <button
                            onClick={() => setConfirmAction({ type: 'remove', user })}
                            title="Remove User"
                            className="p-1 rounded text-slate-500 hover:text-red-400 hover:bg-white/6 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {activeTab === 'audit' && (
          <div className="bg-[#0D1828] border border-white/8 rounded-xl overflow-hidden shadow-xl">
            <table className="data-table min-w-[700px]">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Officer</th>
                  <th>Operational Record</th>
                  <th>Log ID</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_AUDIT_LOGS.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02]">
                    <td>
                      <span className="text-xs text-slate-400 font-mono">
                        {new Date(log.timestamp).toLocaleString('en-IN', { hour12: false })}
                      </span>
                    </td>
                    <td>
                      <span className="text-xs font-semibold text-slate-200">{log.action}</span>
                    </td>
                    <td>
                      <p className="text-xs text-slate-300">{log.userName}</p>
                      <p className="text-[10px] text-slate-500">{log.userRole}</p>
                    </td>
                    <td>
                      <p className="text-xs text-slate-400">{log.details}</p>
                    </td>
                    <td>
                      <span className="text-xs font-mono text-slate-600">{log.id}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add User Modal */}
      <Modal
        open={addUserModalOpen}
        onClose={() => setAddUserModalOpen(false)}
        title="Register New Command Officer"
        subtitle="Role-Based Access Control Provisioning"
        size="md"
      >
        <form onSubmit={handleAddUser} className="space-y-4">
          <Input
            label="Officer Full Name"
            required
            placeholder="e.g. IAS K. Sudhakar"
            value={newUserForm.name}
            onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
          />

          <Input
            label="Government Official Email"
            type="email"
            required
            placeholder="e.g. sudhakar@apsdma.ap.gov.in"
            value={newUserForm.email}
            onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Designated Role"
              options={[
                { value: 'national_admin', label: 'National Admin (NDMA)' },
                { value: 'state_admin', label: 'State Admin (SDMA)' },
                { value: 'district_admin', label: 'District Admin (DDMA)' },
                { value: 'responder', label: 'Field Responder / NDRF' },
              ]}
              value={newUserForm.role}
              onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value as UserRole })}
            />

            <Select
              label="Command Level"
              options={[
                { value: 'national', label: 'National' },
                { value: 'state', label: 'State' },
                { value: 'district', label: 'District' },
              ]}
              value={newUserForm.commandLevel}
              onChange={(e) =>
                setNewUserForm({ ...newUserForm, commandLevel: e.target.value as CommandLevel })
              }
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="State Assignment"
              placeholder="e.g. Andhra Pradesh"
              value={newUserForm.stateAssigned}
              onChange={(e) => setNewUserForm({ ...newUserForm, stateAssigned: e.target.value })}
            />

            <Input
              label="District (If applicable)"
              placeholder="e.g. Visakhapatnam"
              value={newUserForm.districtAssigned}
              onChange={(e) => setNewUserForm({ ...newUserForm, districtAssigned: e.target.value })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-white/10">
            <Button variant="ghost" type="button" onClick={() => setAddUserModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Provision Officer
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Action Dialog */}
      <ConfirmDialog
        open={confirmAction !== null}
        onClose={() => setConfirmAction(null)}
        onConfirm={handleConfirm}
        title={confirmAction?.type === 'suspend' ? 'Confirm User Status Change' : 'Revoke Officer Access'}
        message={
          confirmAction?.type === 'suspend'
            ? `Are you sure you want to ${confirmAction.user.status === 'active' ? 'suspend' : 'reactivate'} ${confirmAction.user.name}?`
            : `Are you sure you want to permanently revoke access for ${confirmAction?.user.name}? This action is irreversible.`
        }
        variant={confirmAction?.type === 'remove' ? 'danger' : 'warning'}
      />
    </div>
  );
};

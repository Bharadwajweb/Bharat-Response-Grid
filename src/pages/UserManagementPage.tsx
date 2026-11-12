import React, { useMemo, useState } from 'react';
import useSWR from 'swr';
import { Activity, Plus, RefreshCw, ShieldCheck, Users } from 'lucide-react';
import { brgApi, type BRGRole } from '../services/brgApi';

const roleOptions: Array<{ value: BRGRole; label: string }> = [
  { value: 'CENTRAL_AUTHORITY', label: 'Central authority' },
  { value: 'STATE_AUTHORITY', label: 'State authority' },
  { value: 'DISTRICT_OFFICER', label: 'District officer' },
  { value: 'EMERGENCY_OFFICER', label: 'Emergency officer' },
  { value: 'CITIZEN', label: 'Citizen' },
];

export const UserManagementPage: React.FC = () => {
  const [tab, setTab] = useState<'users' | 'audit'>('users');
  const [search, setSearch] = useState('');
  const [showAssign, setShowAssign] = useState(false);
  const [userId, setUserId] = useState('');
  const [role, setRole] = useState<BRGRole>('EMERGENCY_OFFICER');
  const [stateScope, setStateScope] = useState('');
  const [districtScope, setDistrictScope] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const { data: usersEnvelope, isLoading: usersLoading, mutate: refreshUsers } = useSWR('brg-admin-users', brgApi.adminUsers, { revalidateOnFocus: true, shouldRetryOnError: false });
  const { data: auditEnvelope, isLoading: auditLoading, mutate: refreshAudit } = useSWR('brg-admin-audit', brgApi.adminAudit, { revalidateOnFocus: true, shouldRetryOnError: false });
  const users = usersEnvelope?.data ?? [];
  const audit = auditEnvelope?.data ?? [];
  const filteredUsers = useMemo(() => users.filter((user) => `${user.name ?? ''} ${user.email ?? ''} ${user.id}`.toLowerCase().includes(search.toLowerCase())), [users, search]);
  const needsState = role === 'STATE_AUTHORITY' || role === 'DISTRICT_OFFICER' || role === 'EMERGENCY_OFFICER';
  const needsDistrict = role === 'DISTRICT_OFFICER';

  const assignRole = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userId) return;
    setError('');
    setSaving(true);
    try {
      await brgApi.assignUserRole(userId, {
        role,
        ...(needsState ? { state_scope: stateScope.trim() } : {}),
        ...(needsDistrict ? { district_scope: districtScope.trim() } : {}),
      });
      await Promise.all([refreshUsers(), refreshAudit()]);
      setShowAssign(false);
      setUserId('');
      setStateScope('');
      setDistrictScope('');
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Role assignment could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="space-y-5 p-4 md:p-6">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-800 pb-5">
        <div><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-sky-300"><Users size={14} /> Access control</p><h1 className="mt-2 text-2xl font-semibold text-white md:text-3xl">Users and audit trail</h1><p className="mt-1 text-sm text-slate-400">Live Neon Auth identities with explicit BRG role and jurisdiction assignments.</p></div>
        <button type="button" onClick={() => { void refreshUsers(); void refreshAudit(); }} className="rounded-lg border border-slate-700 p-2 text-slate-400 hover:text-white" aria-label="Refresh user directory"><RefreshCw size={15} /></button>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4"><p className="text-xs text-slate-400">Role directory: {usersEnvelope?.status ?? 'CHECKING'} · Audit log: {auditEnvelope?.status ?? 'CHECKING'}</p><button type="button" onClick={() => setShowAssign((visible) => !visible)} className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-3 py-2 text-xs font-semibold text-slate-950"><Plus size={14} /> Assign BRG role</button></div>

      {showAssign && <form onSubmit={assignRole} className="grid gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4 md:grid-cols-2">
        <h2 className="text-sm font-semibold text-slate-100 md:col-span-2">Assign role to a registered Neon Auth account</h2>
        <label className="text-xs text-slate-400">Account<select value={userId} onChange={(event) => setUserId(event.target.value)} required className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100"><option value="">Select registered account</option>{users.map((user) => <option key={user.id} value={user.id}>{user.name || user.email || user.id} · {user.id.slice(0, 8)}</option>)}</select></label>
        <label className="text-xs text-slate-400">BRG role<select value={role} onChange={(event) => setRole(event.target.value as BRGRole)} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100">{roleOptions.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
        {needsState && <label className="text-xs text-slate-400">State scope<input value={stateScope} onChange={(event) => setStateScope(event.target.value)} required maxLength={100} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100" /></label>}
        {needsDistrict && <label className="text-xs text-slate-400">District scope<input value={districtScope} onChange={(event) => setDistrictScope(event.target.value)} required maxLength={100} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100" /></label>}
        <p className="text-xs leading-5 text-slate-500 md:col-span-2">Accounts must be created in Neon Auth and sign in once before they appear here. This form grants BRG operational permissions only; authentication and password management remain with Neon Auth.</p>
        {error && <p className="text-sm text-rose-200 md:col-span-2" role="alert">{error}</p>}
        <div className="flex justify-end gap-2 md:col-span-2"><button type="button" onClick={() => { setShowAssign(false); setError(''); }} className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-400">Cancel</button><button type="submit" disabled={saving || !users.length} className="rounded-lg bg-sky-500 px-4 py-2 text-xs font-semibold text-slate-950 disabled:opacity-50">{saving ? 'Assigning…' : 'Assign role'}</button></div>
      </form>}

      <div className="flex gap-2 border-b border-slate-800" role="tablist" aria-label="User administration views"><button type="button" role="tab" aria-selected={tab === 'users'} onClick={() => setTab('users')} className={`px-3 py-2 text-sm ${tab === 'users' ? 'border-b-2 border-sky-400 text-sky-200' : 'text-slate-500'}`}>Accounts <span className="ml-1 text-xs">{users.length}</span></button><button type="button" role="tab" aria-selected={tab === 'audit'} onClick={() => setTab('audit')} className={`inline-flex items-center gap-2 px-3 py-2 text-sm ${tab === 'audit' ? 'border-b-2 border-sky-400 text-sky-200' : 'text-slate-500'}`}><Activity size={14} /> Audit trail</button></div>

      {tab === 'users' ? <section className="space-y-3" role="tabpanel" aria-label="Accounts">
        <label className="block max-w-sm text-xs text-slate-400">Search by name, email, or auth ID<input value={search} onChange={(event) => setSearch(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100" /></label>
        <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b border-slate-800 bg-slate-950/50 text-[10px] uppercase tracking-wider text-slate-500"><tr><th className="px-4 py-3">Account</th><th className="px-4 py-3">Email status</th><th className="px-4 py-3">BRG roles</th><th className="px-4 py-3">Created</th></tr></thead><tbody className="divide-y divide-slate-800">{filteredUsers.map((user) => <tr key={user.id}><td className="px-4 py-3"><p className="font-medium text-slate-200">{user.name || 'Name not available'}</p><p className="mt-1 text-xs text-slate-500">{user.email || 'Email not available'} · <span className="font-mono">{user.id}</span></p></td><td className="px-4 py-3"><span className={`inline-flex items-center gap-1 text-xs ${user.emailVerified ? 'text-emerald-300' : 'text-amber-300'}`}><ShieldCheck size={13} />{user.emailVerified ? 'Verified' : 'Unverified'}</span></td><td className="px-4 py-3"><div className="flex flex-wrap gap-1.5">{user.roles.length ? user.roles.map((assignment, index) => <span key={`${assignment.role}-${assignment.stateScope}-${assignment.districtScope}-${index}`} className="rounded border border-slate-700 bg-slate-950 px-2 py-1 text-[10px] text-slate-300">{assignment.role.replaceAll('_', ' ')}{assignment.stateScope ? ` · ${assignment.stateScope}` : ''}{assignment.districtScope ? ` / ${assignment.districtScope}` : ''}</span>) : <span className="text-xs text-slate-500">No BRG role</span>}</div></td><td className="px-4 py-3 text-xs text-slate-400">{new Date(user.createdAt).toLocaleDateString()}</td></tr>)}{!filteredUsers.length && <tr><td colSpan={4} className="px-4 py-10 text-center text-sm text-slate-500">{usersLoading ? 'Loading registered accounts…' : usersEnvelope?.status === 'OFFLINE' ? 'Directory unavailable; no sample users are shown.' : 'No registered accounts match this search.'}</td></tr>}</tbody></table></div>
      </section> : <section className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-900/60" role="tabpanel" aria-label="Audit trail"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-b border-slate-800 bg-slate-950/50 text-[10px] uppercase tracking-wider text-slate-500"><tr><th className="px-4 py-3">Time</th><th className="px-4 py-3">Actor</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Record</th><th className="px-4 py-3">Details</th></tr></thead><tbody className="divide-y divide-slate-800">{audit.map((entry) => <tr key={entry.id}><td className="whitespace-nowrap px-4 py-3 text-xs text-slate-400">{new Date(entry.timestamp).toLocaleString()}</td><td className="px-4 py-3"><p className="text-xs text-slate-200">{entry.userId}</p><p className="text-[10px] text-slate-500">{entry.role}</p></td><td className="px-4 py-3 text-xs text-slate-200">{entry.action}</td><td className="px-4 py-3 text-xs text-slate-400">{entry.entityType}{entry.entityId ? ` · ${entry.entityId}` : ''}</td><td className="px-4 py-3 text-xs text-slate-500">{JSON.stringify(entry.details)}</td></tr>)}{!audit.length && <tr><td colSpan={5} className="px-4 py-10 text-center text-sm text-slate-500">{auditLoading ? 'Loading audit entries…' : auditEnvelope?.status === 'OFFLINE' ? 'Audit service unavailable; no sample logs are shown.' : 'No audit entries have been recorded.'}</td></tr>}</tbody></table></section>}
    </main>
  );
};

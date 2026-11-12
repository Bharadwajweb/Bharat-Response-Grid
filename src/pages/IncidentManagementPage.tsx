import React, { useEffect, useState } from 'react';
import useSWR from 'swr';
import { AlertTriangle, Check, ChevronDown, Plus, RefreshCw, ShieldAlert } from 'lucide-react';
import { brgApi, type IncidentRecord } from '../services/brgApi';
import { useAppStore } from '../store/appStore';

const nextStatus: Partial<Record<IncidentRecord['status'], IncidentRecord['status']>> = {
  reported: 'verified',
  verified: 'responding',
  responding: 'contained',
  contained: 'resolved',
};

const statusStyles: Record<string, string> = {
  critical: 'border-rose-500/30 bg-rose-500/10 text-rose-300',
  high: 'border-orange-500/30 bg-orange-500/10 text-orange-300',
  medium: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  low: 'border-slate-700 bg-slate-900 text-slate-400',
};

export const IncidentManagementPage: React.FC = () => {
  const currentUser = useAppStore((store) => store.currentUser);
  const [showCreate, setShowCreate] = useState(false);
  const [title, setTitle] = useState('');
  const [hazardType, setHazardType] = useState('flood');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState<'critical' | 'high' | 'medium' | 'low'>('medium');
  const [locationText, setLocationText] = useState('');
  const [state, setState] = useState(currentUser?.stateAssigned ?? '');
  const [district, setDistrict] = useState(currentUser?.districtAssigned ?? '');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [assignee, setAssignee] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const canCommand = ['national_admin', 'state_admin', 'district_admin'].includes(currentUser?.role ?? '');
  const { data: envelope, isLoading, mutate } = useSWR('brg-incidents', brgApi.incidents, { refreshInterval: 20000, revalidateOnFocus: true, shouldRetryOnError: false });
  const incidents = envelope?.data ?? [];

  useEffect(() => {
    const onRealtime = (event: Event) => {
      const detail = (event as CustomEvent<{ type?: string }>).detail;
      if (detail?.type?.startsWith('incident:')) void mutate();
    };
    window.addEventListener('brg:realtime', onRealtime);
    return () => window.removeEventListener('brg:realtime', onRealtime);
  }, [mutate]);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setLocationText('');
    setLatitude('');
    setLongitude('');
  };

  const createIncident = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canCommand) return;
    if (Boolean(latitude) !== Boolean(longitude)) {
      setError('Provide both latitude and longitude, or leave both blank.');
      return;
    }
    setBusyId('create');
    setError('');
    try {
      await brgApi.createIncident({
        title: title.trim(), hazard_type: hazardType, description: description.trim(), severity,
        location_text: locationText.trim(), state: state.trim(), district: district.trim() || undefined,
        latitude: latitude ? Number(latitude) : undefined, longitude: longitude ? Number(longitude) : undefined,
      });
      resetForm();
      setShowCreate(false);
      await mutate();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Incident could not be saved.');
    } finally {
      setBusyId(null);
    }
  };

  const advanceIncident = async (incident: IncidentRecord) => {
    const status = nextStatus[incident.status];
    if (!status) return;
    setBusyId(incident.id);
    setError('');
    try {
      await brgApi.updateIncident(incident.id, { status });
      await mutate();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Incident status could not be updated.');
    } finally {
      setBusyId(null);
    }
  };

  const assignIncident = async (incident: IncidentRecord) => {
    const target = assignee[incident.id]?.trim();
    if (!target) return;
    setBusyId(incident.id);
    setError('');
    try {
      await brgApi.assignIncident(incident.id, target);
      setAssignee((current) => ({ ...current, [incident.id]: '' }));
      await mutate();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Responder assignment could not be saved.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <main className="space-y-5 p-4 md:p-6">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-800 pb-5">
        <div><p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-sky-300"><ShieldAlert size={14} /> Incident operations</p><h1 className="mt-2 text-2xl font-semibold text-white md:text-3xl">Incident registry</h1><p className="mt-1 text-sm text-slate-400">PostgreSQL records scoped to your assigned command jurisdiction.</p></div>
        <div className="flex items-center gap-2"><span className="rounded-full border border-slate-700 px-2.5 py-1 text-[10px] font-bold tracking-wider text-slate-300">{envelope?.status ?? 'CHECKING'}</span><button type="button" onClick={() => void mutate()} className="rounded-lg border border-slate-700 p-2 text-slate-400 hover:text-white" aria-label="Refresh incidents"><RefreshCw size={15} /></button>{canCommand && <button type="button" onClick={() => setShowCreate((value) => !value)} className="inline-flex items-center gap-2 rounded-lg bg-sky-500 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-sky-400"><Plus size={15} /> New incident</button>}</div>
      </header>

      {error && <p className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 text-sm text-rose-200" role="alert">{error}</p>}

      {showCreate && <form onSubmit={createIncident} className="grid gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4 md:grid-cols-2">
        <label className="text-xs text-slate-400">Incident title<input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={180} required className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100" /></label>
        <label className="text-xs text-slate-400">Hazard type<select value={hazardType} onChange={(event) => setHazardType(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100"><option value="flood">Flood</option><option value="cyclone">Cyclone</option><option value="earthquake">Earthquake</option><option value="fire">Fire</option><option value="landslide">Landslide</option><option value="other">Other</option></select></label>
        <label className="text-xs text-slate-400">Severity<select value={severity} onChange={(event) => setSeverity(event.target.value as typeof severity)} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100"><option value="critical">Critical</option><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></label>
        <label className="text-xs text-slate-400">Location description<input value={locationText} onChange={(event) => setLocationText(event.target.value)} maxLength={240} required className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100" /></label>
        <label className="text-xs text-slate-400">State / union territory<input value={state} onChange={(event) => setState(event.target.value)} maxLength={100} required className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100" /></label>
        <label className="text-xs text-slate-400">District<input value={district} onChange={(event) => setDistrict(event.target.value)} maxLength={100} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100" /></label>
        <label className="text-xs text-slate-400 md:col-span-2">Description<textarea value={description} onChange={(event) => setDescription(event.target.value)} maxLength={5000} rows={3} required className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100" /></label>
        <div className="grid gap-3 sm:grid-cols-2 md:col-span-2"><label className="text-xs text-slate-400">Latitude (optional)<input type="number" min={-90} max={90} step="any" value={latitude} onChange={(event) => setLatitude(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100" /></label><label className="text-xs text-slate-400">Longitude (optional)<input type="number" min={-180} max={180} step="any" value={longitude} onChange={(event) => setLongitude(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100" /></label></div>
        <div className="flex justify-end gap-2 md:col-span-2"><button type="button" onClick={() => setShowCreate(false)} className="rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-400">Cancel</button><button type="submit" disabled={busyId === 'create'} className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 disabled:opacity-50">{busyId === 'create' ? 'Saving…' : 'Save incident'}</button></div>
      </form>}

      <section className="space-y-3" aria-label="Incident records">
        {!incidents.length && <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-10 text-center"><AlertTriangle size={20} className="mx-auto text-slate-500" /><p className="mt-3 text-sm text-slate-300">{isLoading ? 'Loading scoped records…' : envelope?.status === 'OFFLINE' ? 'Incident registry unavailable. No local sample incidents are shown.' : 'No incidents are recorded for this scope.'}</p></div>}
        {incidents.map((incident) => <article key={incident.id} className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><span className="font-mono text-[10px] text-sky-300">{incident.reference}</span><span className={`rounded border px-2 py-0.5 text-[9px] uppercase ${statusStyles[incident.severity] ?? statusStyles.low}`}>{incident.severity}</span><span className="rounded border border-slate-700 px-2 py-0.5 text-[9px] uppercase text-slate-400">{incident.status}</span></div><h2 className="mt-2 text-base font-semibold text-slate-100">{incident.title}</h2><p className="mt-1 text-sm text-slate-400">{incident.hazardType} · {incident.location} · {incident.district ? `${incident.district}, ` : ''}{incident.state}</p><p className="mt-2 text-xs leading-5 text-slate-500">{incident.description}</p></div>
            <div className="flex flex-wrap items-center gap-2">{canCommand && nextStatus[incident.status] && <button type="button" onClick={() => void advanceIncident(incident)} disabled={busyId === incident.id} className="inline-flex items-center gap-1 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:border-sky-500/30 hover:text-white disabled:opacity-50"><Check size={13} /> Mark {nextStatus[incident.status]}</button>}</div>
          </div>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-3 text-xs text-slate-500"><span>Updated {new Date(incident.updatedAt).toLocaleString()}</span><span>{incident.assignedTo ? `Assigned responder ${incident.assignedTo}` : 'No responder assigned'}</span></div>
          {canCommand && <details className="mt-3"><summary className="inline-flex cursor-pointer list-none items-center gap-1 text-xs text-sky-300">Assign responder <ChevronDown size={12} /></summary><div className="mt-2 flex flex-wrap gap-2"><label className="sr-only" htmlFor={`assignee-${incident.id}`}>Responder user ID</label><input id={`assignee-${incident.id}`} value={assignee[incident.id] ?? ''} onChange={(event) => setAssignee((current) => ({ ...current, [incident.id]: event.target.value }))} placeholder="Neon Auth user ID" className="min-w-0 flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200" /><button type="button" onClick={() => void assignIncident(incident)} disabled={busyId === incident.id || !assignee[incident.id]?.trim()} className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 disabled:opacity-50">Assign</button></div></details>}
        </article>)}
      </section>
    </main>
  );
};

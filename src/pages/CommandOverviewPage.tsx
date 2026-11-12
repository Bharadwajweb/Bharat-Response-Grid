import React from 'react';
import { Link } from 'react-router-dom';
import useSWR from 'swr';
import { Activity, ArrowRight, CloudRain, Database, Map, Radio, ShieldAlert, Warehouse } from 'lucide-react';
import { brgApi } from '../services/brgApi';

const statusTone: Record<string, string> = {
  LIVE: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300',
  CACHED: 'border-amber-500/25 bg-amber-500/10 text-amber-300',
  NO_DATA: 'border-slate-700 bg-slate-900 text-slate-400',
  OFFLINE: 'border-rose-500/25 bg-rose-500/10 text-rose-300',
  DEGRADED: 'border-amber-500/25 bg-amber-500/10 text-amber-300',
  ERROR: 'border-rose-500/25 bg-rose-500/10 text-rose-300',
};

function SourcePill({ status }: { status?: string }) {
  const value = status ?? 'OFFLINE';
  return <span className={`rounded-full border px-2 py-1 text-[9px] font-bold tracking-wider ${statusTone[value] ?? statusTone.NO_DATA}`}>{value.replaceAll('_', ' ')}</span>;
}

export const CommandOverviewPage: React.FC = () => {
  const { data: status } = useSWR('brg-system-status', brgApi.systemStatus, { refreshInterval: 15000, shouldRetryOnError: false });
  const { data: incidents } = useSWR('brg-incidents', brgApi.incidents, { refreshInterval: 20000, shouldRetryOnError: false });
  const { data: alerts } = useSWR('brg-alerts', brgApi.alerts, { refreshInterval: 30000, shouldRetryOnError: false });
  const { data: shelters } = useSWR('brg-shelters', brgApi.shelters, { refreshInterval: 60000, shouldRetryOnError: false });
  const { data: resources } = useSWR('brg-resources', brgApi.resources, { refreshInterval: 60000, shouldRetryOnError: false });
  const { data: weather } = useSWR('brg-weather-national', () => brgApi.weather(), { refreshInterval: 300000, shouldRetryOnError: false });

  const incidentRows = incidents?.data ?? [];
  const activeIncidents = incidentRows.filter((item) => !['contained', 'resolved'].includes(item.status));
  const criticalIncidents = activeIncidents.filter((item) => item.severity === 'critical' || item.severity === 'high');
  const alertRows = alerts?.data ?? [];
  const shelterRows = shelters?.data ?? [];
  const activeShelters = shelterRows.filter((shelter) => shelter.status === 'active');
  const resourceRows = resources?.data ?? [];
  const weatherData = weather?.data;
  const serviceOverall = status?.data.overall ?? 'OFFLINE';

  const metrics = [
    { label: 'Active incidents', value: incidents?.status === 'OFFLINE' ? '—' : String(activeIncidents.length), note: incidents?.status === 'NO_DATA' ? 'No records returned' : incidents?.source ?? 'BRG incident registry', icon: ShieldAlert, tone: 'text-rose-300' },
    { label: 'High / critical', value: incidents?.status === 'OFFLINE' ? '—' : String(criticalIncidents.length), note: 'From scoped incident records', icon: Activity, tone: 'text-amber-300' },
    { label: 'Active shelters', value: shelters?.status === 'OFFLINE' ? '—' : String(activeShelters.length), note: shelters?.source ?? 'BRG shelter registry', icon: Warehouse, tone: 'text-emerald-300' },
    { label: 'Tracked resources', value: resources?.status === 'OFFLINE' ? '—' : String(resourceRows.length), note: resources?.source ?? 'BRG resource registry', icon: Database, tone: 'text-sky-300' },
  ];

  return (
    <main className="space-y-6 p-4 md:p-6">
      <header className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-sky-300"><Activity size={14} /> National coordination</p>
          <h1 className="mt-2 text-2xl font-semibold text-white md:text-3xl">Command overview</h1>
          <p className="mt-1 text-sm text-slate-400">Scoped records and source-backed feeds. No operational count is substituted when a service is unavailable.</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-300"><Radio size={14} className={serviceOverall === 'ONLINE' ? 'text-emerald-300' : 'text-amber-300'} /> System <SourcePill status={serviceOverall} /></div>
      </header>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Current source-backed metrics">
        {metrics.map(({ label, value, note, icon: Icon, tone }) => <article key={label} className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
          <div className="flex items-center justify-between"><span className="text-xs font-medium text-slate-400">{label}</span><Icon size={16} className={tone} /></div>
          <p className="mt-4 text-3xl font-semibold tabular-nums text-slate-100">{value}</p>
          <p className="mt-1 truncate text-[11px] text-slate-500">{note}</p>
          <div className="mt-3"><SourcePill status={label === 'Active incidents' || label === 'High / critical' ? incidents?.status : label === 'Active shelters' ? shelters?.status : resources?.status} /></div>
        </article>)}
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.8fr)]">
        <section className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/70">
          <div className="flex items-center justify-between gap-3 border-b border-slate-800 px-4 py-3">
            <div><h2 className="text-sm font-semibold text-slate-100">Incident queue</h2><p className="mt-1 text-xs text-slate-500">Most recently updated records in your command scope</p></div>
            <Link to="/incidents" className="inline-flex items-center gap-1 text-xs font-medium text-sky-300 hover:text-sky-200">Open registry <ArrowRight size={13} /></Link>
          </div>
          <div className="divide-y divide-slate-800/80">
            {activeIncidents.slice(0, 6).map((incident) => <article key={incident.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0"><p className="truncate text-sm font-medium text-slate-200">{incident.title}</p><p className="mt-1 text-xs text-slate-500">{incident.reference} · {incident.location}{incident.district ? ` · ${incident.district}` : ''}</p></div>
              <div className="flex items-center gap-2"><span className="rounded border border-slate-700 px-2 py-1 text-[9px] uppercase text-slate-300">{incident.status}</span><span className="rounded border border-slate-700 px-2 py-1 text-[9px] uppercase text-slate-300">{incident.severity}</span></div>
            </article>)}
            {!activeIncidents.length && <p className="px-4 py-10 text-center text-sm text-slate-500">{incidents?.status === 'OFFLINE' ? 'Incident registry unavailable.' : 'No active incidents returned for this scope.'}</p>}
          </div>
        </section>

        <div className="space-y-4">
          <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="flex items-center justify-between gap-3"><h2 className="text-sm font-semibold text-slate-100">Weather reference point</h2><SourcePill status={weather?.status} /></div>
            {weatherData ? <><p className="mt-4 text-3xl font-semibold text-white">{weatherData.temperature == null ? '—' : `${weatherData.temperature.toFixed(1)}°C`}</p><p className="mt-1 text-xs text-slate-500">Open-Meteo modelled grid · {weatherData.latitude.toFixed(2)}, {weatherData.longitude.toFixed(2)}</p><p className="mt-3 text-[11px] leading-5 text-slate-500">Not an official warning or station observation. Confirm local alerts before acting.</p></> : <p className="mt-4 text-sm text-slate-500">No weather reading is available.</p>}
            <Link to="/weather" className="mt-3 inline-flex items-center gap-1 text-xs text-sky-300 hover:text-sky-200"><CloudRain size={13} /> Weather intelligence <ArrowRight size={13} /></Link>
          </section>
          <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
            <div className="flex items-center justify-between gap-3"><h2 className="text-sm font-semibold text-slate-100">Current alerts</h2><SourcePill status={alerts?.status} /></div>
            {alertRows.length ? <ul className="mt-3 space-y-2">{alertRows.slice(0, 4).map((alert) => <li key={alert.id} className="border-t border-slate-800 pt-2"><p className="text-sm text-slate-200">{alert.title}</p><p className="mt-1 text-xs text-slate-500">{alert.severity} · {alert.audience}{alert.state ? ` · ${alert.state}` : ''}</p></li>)}</ul> : <p className="mt-3 text-sm text-slate-500">{alerts?.status === 'OFFLINE' ? 'Alert feed unavailable.' : 'No alerts were returned.'}</p>}
          </section>
        </div>
      </div>

      <nav className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Operational tools">
        {[
          { to: '/maps', label: 'Map and tracking', icon: Map },
          { to: '/communications', label: 'Scoped communications', icon: Radio },
          { to: '/analytics', label: 'Data and analytics', icon: Activity },
          { to: '/data-sources', label: 'System and data sources', icon: Database },
        ].map(({ to, label, icon: Icon }) => <Link key={to} to={to} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/60 px-4 py-3 text-sm text-slate-300 transition hover:border-sky-500/30 hover:text-white"><span className="flex items-center gap-2"><Icon size={15} className="text-sky-300" />{label}</span><ArrowRight size={14} /></Link>)}
      </nav>
    </main>
  );
};

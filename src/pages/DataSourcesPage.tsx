import React from 'react';
import useSWR from 'swr';
import { Activity, CloudSun, Database, Map, Radio, RefreshCw, ShieldCheck } from 'lucide-react';
import { brgApi } from '../services/brgApi';

const sources = [
  { key: 'api', label: 'BRG API', detail: 'Authenticated operational services', icon: Activity },
  { key: 'database', label: 'Neon PostgreSQL + PostGIS', detail: 'Incidents, shelters, resources, audit history', icon: Database },
  { key: 'weather', label: 'Open-Meteo', detail: 'Current conditions and forecast feed', icon: CloudSun },
  { key: 'earthquakes', label: 'USGS ComCat', detail: 'Recent earthquake event feed', icon: Activity },
  { key: 'routing', label: 'OSRM / OpenStreetMap', detail: 'Road-route provider; hazard overlay depends on configured risk zones', icon: Map },
  { key: 'websocket', label: 'Realtime events', detail: 'Authenticated one-time WebSocket tickets', icon: Radio },
] as const;

function statusClasses(status?: string) {
  if (status === 'ONLINE') return 'border-emerald-400/25 bg-emerald-400/10 text-emerald-300';
  if (status === 'DEGRADED') return 'border-amber-400/25 bg-amber-400/10 text-amber-300';
  return 'border-slate-700 bg-slate-800/70 text-slate-400';
}

export const DataSourcesPage: React.FC = () => {
  const { data, isLoading, mutate } = useSWR('system-status', brgApi.systemStatus, {
    refreshInterval: 15_000,
    revalidateOnFocus: true,
    shouldRetryOnError: false,
  });
  const status = data?.data;
  const overall = status?.overall ?? 'OFFLINE';

  return (
    <section className="min-h-full bg-[#07111F] px-4 py-6 text-slate-100 sm:px-6 lg:px-8" aria-labelledby="sources-title">
      <div className="mx-auto max-w-5xl space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-cyan-300">
              <ShieldCheck size={14} /> Source transparency
            </div>
            <h1 id="sources-title" className="text-2xl font-semibold tracking-tight">System health & data sources</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-400">Only provider responses and database records are labelled live. Missing feeds stay visibly unavailable; they are never replaced with invented operational values.</p>
          </div>
          <button type="button" onClick={() => void mutate()} className="inline-flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-300 hover:bg-white/5" aria-label="Refresh source status">
            <RefreshCw size={14} className={isLoading ? 'animate-spin' : ''} /> Refresh
          </button>
        </header>

        <div className={`flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4 ${statusClasses(overall)}`} role="status" aria-live="polite">
          <div><p className="text-xs font-semibold uppercase tracking-wider">Overall status</p><p className="mt-1 text-lg font-bold">{isLoading ? 'CHECKING' : overall}</p></div>
          <p className="max-w-xl text-xs leading-relaxed text-current/80">{status?.checkedAt ? `Last checked ${new Date(status.checkedAt).toLocaleString()}` : 'The API has not returned a health check. No feed is assumed live.'}</p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {sources.map(({ key, label, detail, icon: Icon }) => {
            const service = status?.services?.[key];
            const serviceStatus = service?.status ?? 'OFFLINE';
            const lastUpdated = typeof service?.lastUpdated === 'string' ? service.lastUpdated : null;
            const note = typeof service?.note === 'string' ? service.note : null;
            return (
              <article key={key} className="rounded-xl border border-white/8 bg-[#0D1828] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-white/10 bg-white/[0.04] text-cyan-300"><Icon size={16} /></div>
                    <div><h2 className="text-sm font-semibold">{label}</h2><p className="mt-1 text-xs leading-relaxed text-slate-500">{detail}</p></div>
                  </div>
                  <span className={`shrink-0 rounded-full border px-2 py-1 text-[10px] font-semibold tracking-wide ${statusClasses(serviceStatus)}`}>{serviceStatus}</span>
                </div>
                <div className="mt-4 flex flex-wrap justify-between gap-2 border-t border-white/6 pt-3 text-[11px] text-slate-500">
                  <span>{lastUpdated ? `Last successful update ${new Date(lastUpdated).toLocaleString()}` : 'No successful update recorded'}</span>
                  {typeof service?.schema === 'string' && <span>Schema: {service.schema.replaceAll('_', ' ').toLowerCase()}</span>}
                </div>
                {note && <p className="mt-2 text-xs text-amber-300/80">{note}</p>}
              </article>
            );
          })}
        </div>

        <aside className="rounded-xl border border-amber-400/20 bg-amber-400/[0.06] p-4 text-xs leading-relaxed text-amber-100/80">
          Route geometry from OSRM is not a safety clearance. A route is marked hazard-assessed only when the database contains risk-zone polygons; a missing overlay means risk is unknown, not zero.
        </aside>
      </div>
    </section>
  );
};

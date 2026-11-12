import React from 'react';
import useSWR from 'swr';
import { Activity, Database, ShieldAlert, Warehouse } from 'lucide-react';
import { brgApi } from '../services/brgApi';

export const AnalyticsCenterPage: React.FC = () => {
  const { data: summary, isLoading } = useSWR('brg-analytics-summary', brgApi.analytics, { refreshInterval: 60000, revalidateOnFocus: true, shouldRetryOnError: false });
  const { data: shelters } = useSWR('brg-shelters', brgApi.shelters, { refreshInterval: 60000, shouldRetryOnError: false });
  const payload = summary?.data as {
    incidentCount?: number;
    activeIncidents?: number;
    resolvedIncidents?: number;
    disastersByType?: Array<{ type: string; count: number }>;
    shelterCapacity?: number | null;
    shelterOccupancy?: number | null;
    averageResolutionMinutes?: number | null;
    dataCoverage?: string;
  } | null | undefined;
  const metrics = [
    { label: 'Incident records', value: payload?.incidentCount, icon: ShieldAlert },
    { label: 'Active incidents', value: payload?.activeIncidents, icon: Activity },
    { label: 'Active shelters', value: shelters?.data?.length, icon: Warehouse },
    { label: 'Known shelter capacity', value: payload?.shelterCapacity, icon: Database },
  ];
  const value = (number: number | null | undefined) => number == null ? '—' : new Intl.NumberFormat('en-IN').format(number);

  return (
    <main className="space-y-6 p-4 md:p-6">
      <header className="border-b border-slate-800 pb-5"><p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-300">Operational analytics</p><h1 className="mt-2 text-2xl font-semibold text-white md:text-3xl">Analytics center</h1><p className="mt-1 text-sm text-slate-400">Aggregates are calculated from records visible to your assigned command scope.</p></header>
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/60 p-4"><p className="text-sm text-slate-300">Source: {summary?.source ?? 'BRG PostgreSQL'}</p><span className="rounded-full border border-slate-700 px-2.5 py-1 text-[10px] font-bold text-slate-300">{summary?.status ?? 'CHECKING'}</span></div>
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Scoped data metrics">
        {metrics.map(({ label, value: metricValue, icon: Icon }) => <article key={label} className="rounded-xl border border-slate-800 bg-slate-900/70 p-4"><div className="flex items-center justify-between text-xs text-slate-400"><span>{label}</span><Icon size={15} className="text-sky-300" /></div><p className="mt-4 text-3xl font-semibold tabular-nums text-white">{isLoading ? '…' : value(metricValue)}</p><p className="mt-2 text-[10px] text-slate-500">{summary?.status === 'OFFLINE' ? 'Unavailable; no mock metric is shown.' : 'Computed from persisted operational records.'}</p></article>)}
      </section>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-5"><h2 className="text-sm font-semibold text-slate-100">Incident mix</h2><p className="mt-1 text-xs text-slate-500">Recorded hazard types only</p>
          {payload?.disastersByType?.length ? <ul className="mt-4 space-y-3">{payload.disastersByType.map((entry) => <li key={entry.type} className="flex items-center justify-between border-b border-slate-800 pb-2 text-sm"><span className="capitalize text-slate-300">{entry.type}</span><span className="font-mono text-slate-100">{value(entry.count)}</span></li>)}</ul> : <p className="mt-6 rounded-lg border border-dashed border-slate-700 p-4 text-sm text-slate-500">{summary?.status === 'OFFLINE' ? 'Analytics service unavailable.' : 'Insufficient incident records for a breakdown.'}</p>}
        </section>
        <section className="rounded-xl border border-slate-800 bg-slate-900/70 p-5"><h2 className="text-sm font-semibold text-slate-100">Data completeness</h2><p className="mt-1 text-xs text-slate-500">Missing values remain unknown; they are not imputed.</p>
          <dl className="mt-4 space-y-3 text-sm"><div className="flex justify-between border-b border-slate-800 pb-2"><dt className="text-slate-400">Resolved incidents</dt><dd className="text-slate-100">{value(payload?.resolvedIncidents)}</dd></div><div className="flex justify-between border-b border-slate-800 pb-2"><dt className="text-slate-400">Known shelter occupancy</dt><dd className="text-slate-100">{value(payload?.shelterOccupancy)}</dd></div><div className="flex justify-between border-b border-slate-800 pb-2"><dt className="text-slate-400">Average resolution time</dt><dd className="text-slate-100">{payload?.averageResolutionMinutes == null ? '—' : `${value(payload.averageResolutionMinutes)} min`}</dd></div><div className="flex justify-between"><dt className="text-slate-400">Coverage</dt><dd className="text-slate-100">{payload?.dataCoverage ?? 'INSUFFICIENT DATA'}</dd></div></dl>
        </section>
      </div>
      {summary?.status === 'OFFLINE' && <p role="alert" className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3 text-xs text-amber-200">Analytics are unavailable. No cached or sample statistics are presented as live.</p>}
    </main>
  );
};

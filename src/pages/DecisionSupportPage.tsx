import React, { useState } from 'react';
import { Activity, AlertTriangle, Database, ShieldCheck } from 'lucide-react';
import { brgApi } from '../services/brgApi';

type Assessment = {
  status: 'SIMULATION' | 'INSUFFICIENT_DATA';
  score: number | null;
  classification: string | null;
  confidenceCoveragePercent: number;
  availableFactors: string[];
  missingFactors: string[];
  populationExposure: number | null;
  sourceTimestamps: Record<string, string>;
  method: string;
  recommendation?: string;
  decisionStatus?: string;
};

function optionalNumber(value: string) {
  return value.trim() === '' ? undefined : Number(value);
}

export const DecisionSupportPage: React.FC = () => {
  const [rainfall, setRainfall] = useState('');
  const [wind, setWind] = useState('');
  const [magnitude, setMagnitude] = useState('');
  const [floodDepth, setFloodDepth] = useState('');
  const [population, setPopulation] = useState('');
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const runAssessment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const response = await brgApi.assessRisk({
        rainfall_mm_24h: optionalNumber(rainfall),
        wind_speed_kph: optionalNumber(wind),
        earthquake_magnitude: optionalNumber(magnitude),
        flood_depth_m: optionalNumber(floodDepth),
        population_exposure: population.trim() ? Number(population) : undefined,
      });
      setAssessment(response as Assessment);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Decision service is unavailable.');
    } finally {
      setSubmitting(false);
    }
  };

  const complete = assessment?.score !== null && assessment?.score !== undefined;

  return (
    <main className="space-y-6 p-4 md:p-6">
      <header className="border-b border-slate-800 pb-5">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-300"><Activity size={14} /> Decision support</p>
        <h1 className="mt-2 text-2xl font-semibold text-white md:text-3xl">Hazard screening console</h1>
        <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-400">Submit known values to a transparent, uncalibrated screening rule. It does not estimate affected populations, generate routes, issue warnings, or authorize response actions.</p>
      </header>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
        <form onSubmit={runAssessment} className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/70 p-5">
          <div><h2 className="text-base font-semibold text-slate-100">Available evidence</h2><p className="mt-1 text-xs text-slate-500">Leave unknown fields blank. Values are not inferred.</p></div>
          <div className="grid gap-3 sm:grid-cols-2">
            {[
              { id: 'rainfall', label: 'Rainfall, last 24 h (mm)', value: rainfall, set: setRainfall, min: 0, max: 5000, step: 0.1 },
              { id: 'wind', label: 'Wind speed (km/h)', value: wind, set: setWind, min: 0, max: 1000, step: 0.1 },
              { id: 'magnitude', label: 'Earthquake magnitude', value: magnitude, set: setMagnitude, min: 0, max: 10, step: 0.1 },
              { id: 'flood-depth', label: 'Flood depth (m)', value: floodDepth, set: setFloodDepth, min: 0, max: 100, step: 0.01 },
              { id: 'population', label: 'Known population exposure', value: population, set: setPopulation, min: 0, max: 100000000, step: 1 },
            ].map(({ id, label, value, set, min, max, step }) => <label key={id} htmlFor={id} className="text-xs text-slate-400">{label}<input id={id} type="number" min={min} max={max} step={step} value={value} onChange={(event) => set(event.target.value)} className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-cyan-400" /></label>)}
          </div>
          {error && <p className="rounded-lg border border-rose-500/20 bg-rose-500/5 p-3 text-sm text-rose-200" role="alert">{error}</p>}
          <button type="submit" disabled={submitting} className="rounded-lg bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-400 disabled:opacity-50">{submitting ? 'Assessing supplied factors…' : 'Run advisory screening'}</button>
        </form>

        <section className="space-y-4 rounded-xl border border-slate-800 bg-slate-900/70 p-5" aria-live="polite">
          <div className="flex items-start justify-between gap-3"><div><h2 className="text-base font-semibold text-slate-100">Result and limitations</h2><p className="mt-1 text-xs text-slate-500">Human review required</p></div><span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-wider ${assessment?.status === 'SIMULATION' ? 'border-amber-500/30 bg-amber-500/10 text-amber-200' : 'border-slate-700 bg-slate-950 text-slate-400'}`}>{assessment?.status ?? 'NOT RUN'}</span></div>
          {assessment ? <>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3"><p className="text-[10px] uppercase tracking-wider text-slate-500">Screening score</p><p className="mt-2 text-2xl font-semibold text-slate-100">{complete ? `${assessment.score}/100` : '—'}</p></div>
              <div className="rounded-lg border border-slate-800 bg-slate-950/70 p-3"><p className="text-[10px] uppercase tracking-wider text-slate-500">Factor coverage</p><p className="mt-2 text-2xl font-semibold text-slate-100">{assessment.confidenceCoveragePercent}%</p></div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-slate-800 p-3 text-sm"><ShieldCheck size={15} className="text-amber-300" /><span className="text-slate-300">Classification: {assessment.classification ?? 'Insufficient data'}</span></div>
            {assessment.recommendation && <p className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3 text-sm leading-5 text-cyan-100">{assessment.recommendation}</p>}
            <div className="space-y-2 text-xs"><p className="text-slate-400">Factors received: {assessment.availableFactors.length ? assessment.availableFactors.join(', ') : 'none'}</p><p className="text-slate-500">Factors missing: {assessment.missingFactors.join(', ') || 'none'}</p><p className="text-slate-500">Population exposure is an input only: {assessment.populationExposure == null ? 'not provided' : assessment.populationExposure.toLocaleString('en-IN')}.</p></div>
            <p className="flex items-start gap-2 border-t border-slate-800 pt-3 text-xs leading-5 text-slate-500"><Database size={14} className="mt-0.5 shrink-0" />{assessment.method}</p>
          </> : <div className="grid min-h-56 place-items-center text-center"><div><AlertTriangle size={20} className="mx-auto text-slate-600" /><p className="mt-3 text-sm text-slate-400">No assessment has been run.</p><p className="mt-1 text-xs text-slate-600">No score or confidence value is fabricated in advance.</p></div></div>}
        </section>
      </div>

      <aside className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-xs leading-5 text-amber-100/80">Research prototype only. The rule weights are not calibrated against historical events; do not use the output as an official warning, evacuation route, resource allocation, or dispatch decision.</aside>
    </main>
  );
};

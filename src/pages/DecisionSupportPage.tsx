import React from 'react';
import { Activity, ArrowUpRight, Compass, Database, GitBranch, MapPinned, ShieldCheck, TriangleAlert } from 'lucide-react';
import { motion } from 'framer-motion';
import { demoDecision, decisionArchitecture, decisionDisclaimer, decisionSourceLabel, riskBand } from '../services/decisionEngine';
import { Panel, StatCard } from '../components/ui/Card';
import { LiveIndicator } from '../components/ui/Badge';

export const DecisionSupportPage: React.FC = () => {
  const result = demoDecision;
  return (
    <div className="min-h-full p-4 sm:p-6 space-y-5 max-w-screen-2xl mx-auto">
      <header className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2"><Activity className="text-cyan-400" size={20} /><span className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-400">Decision intelligence</span><LiveIndicator /></div>
          <h1 className="text-2xl font-bold text-slate-100">Dynamic Risk & Evacuation Console</h1>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">Convert normalized hazard observations into explainable impact zones, safe directions and risk-aware route recommendations.</p>
        </div>
        <div className="text-right text-xs text-slate-500"><div className="font-mono text-slate-300">{decisionSourceLabel()}</div><div>Mode: <span className="text-amber-400">SIMULATION</span> · officer confirmation required</div></div>
      </header>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard label="Risk score" value={`${result.riskScore}/100`} icon={<TriangleAlert size={16} />} iconColor="text-red-400" critical />
        <StatCard label="Population at risk" value={result.populationAtRisk.toLocaleString('en-IN')} icon={<MapPinned size={16} />} iconColor="text-amber-400" />
        <StatCard label="Impact area" value={`${result.impactAreaKm2} km²`} icon={<Compass size={16} />} iconColor="text-orange-400" />
        <StatCard label="Safe direction" value={result.safeDirection} icon={<ArrowUpRight size={16} />} iconColor="text-green-400" />
        <StatCard label="Confidence" value={`${result.confidence}%`} icon={<ShieldCheck size={16} />} iconColor="text-cyan-400" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_0.8fr] gap-5">
        <Panel title="Risk-aware route comparison" subtitle="Cost combines distance, travel time, exposure, blockage and congestion">
          <div className="space-y-3">
            {result.routeOptions.map((route) => (
              <motion.div key={route.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className={`p-4 rounded-lg border ${route.recommended ? 'border-green-500/40 bg-green-500/10' : 'border-white/8 bg-white/[0.02]'}`}>
                <div className="flex items-start justify-between gap-3"><div><div className="flex items-center gap-2"><span className="font-mono text-xs text-slate-500">{route.id}</span><h3 className="text-sm font-semibold text-slate-100">{route.label}</h3>{route.recommended && <span className="text-[10px] uppercase tracking-wider font-bold text-green-400 border border-green-500/30 rounded px-1.5 py-0.5">Recommended</span>}</div><p className="text-xs text-slate-400 mt-1">{routeReason(route)}</p></div><span className={`text-lg font-bold tabular-nums ${route.riskScore >= 70 ? 'text-red-400' : route.riskScore >= 50 ? 'text-amber-400' : 'text-green-400'}`}>{route.riskScore}</span></div>
                <div className="flex gap-5 mt-3 text-xs text-slate-400"><span>{route.distanceKm} km</span><span>{route.minutes} min</span><span className="text-slate-500">route risk score</span></div>
              </motion.div>
            ))}
          </div>
        </Panel>

        <Panel title="Decision pipeline" subtitle="Traceable research workflow">
          <div className="space-y-2">{decisionArchitecture().map((step, index) => <div key={step} className="flex items-center gap-3 p-2.5 rounded bg-white/[0.025] border border-white/5"><span className="w-6 h-6 rounded-full bg-cyan-500/15 text-cyan-400 text-xs flex items-center justify-center font-bold">{index + 1}</span><span className="text-sm text-slate-300 capitalize">{step}</span>{index < decisionArchitecture().length - 1 && <GitBranch size={13} className="ml-auto text-slate-600" />}</div>)}</div>
        </Panel>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Panel title="Officer actions" subtitle="Generated from current inputs"><div className="space-y-2">{result.actions.map((action) => <div key={action} className="flex gap-2 text-sm text-slate-300"><ShieldCheck size={15} className="text-cyan-400 mt-0.5 shrink-0" />{action}</div>)}</div></Panel>
        <Panel title="Data transparency" subtitle="Never silently present demo data"><div className="space-y-3 text-sm"><div className="flex justify-between"><span className="text-slate-500">Input source</span><span className="text-amber-400">SIMULATION</span></div><div className="flex justify-between"><span className="text-slate-500">Model status</span><span className="text-green-400">Operational</span></div><div className="flex justify-between"><span className="text-slate-500">Confidence</span><span className="text-slate-200">{result.confidence}%</span></div><div className="flex justify-between"><span className="text-slate-500">Risk band</span><span className="text-red-400">{riskBand(result.riskScore)}</span></div></div></Panel>
        <Panel title="System boundary" subtitle="Research prototype controls"><div className="flex items-start gap-3"><Database size={18} className="text-amber-400 mt-0.5" /><p className="text-xs leading-relaxed text-slate-400">{decisionDisclaimer()}</p></div></Panel>
      </div>
    </div>
  );
};

function routeReason(route: { recommended: boolean; reason: string }) { return route.recommended ? 'Lower projected hazard exposure with available road access and shelter capacity.' : route.reason; }

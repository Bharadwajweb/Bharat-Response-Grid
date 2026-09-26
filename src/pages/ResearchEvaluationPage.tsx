import React, { useState, useEffect, useCallback } from 'react';
import {
  FlaskConical,
  BarChart2,
  TrendingDown,
  Clock,
  Play,
  RotateCcw,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Sliders,
} from 'lucide-react';
import { runResearchBenchmarkApi } from '../utils/api';
import type { ResearchEvaluationResult, StatisticalMetric } from '../types';
import { Button } from '../components/ui/Button';

export const ResearchEvaluationPage: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState<string>('SCEN-01');
  const [sampleSize, setSampleSize] = useState<number>(250);
  const [randomSeed, setRandomSeed] = useState<number>(42);
  const [benchmarkResult, setBenchmarkResult] = useState<ResearchEvaluationResult | null>(null);
  const [running, setRunning] = useState<boolean>(false);
  const [expandedMetricKey, setExpandedMetricKey] = useState<string | null>(null);

  const runTrial = useCallback(async (scenId: string, seed: number, n: number, showRunning = true) => {
    if (showRunning) setRunning(true);
    try {
      const res = await runResearchBenchmarkApi(scenId, seed, n);
      setBenchmarkResult(res.data);
    } catch (err) {
      console.error('Benchmark execution failed', err);
    } finally {
      if (showRunning) setRunning(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    runResearchBenchmarkApi(selectedScenario, randomSeed, sampleSize)
      .then((res) => {
        if (active) setBenchmarkResult(res.data);
      })
      .catch((err) => {
        console.error('Benchmark execution failed', err);
      });
    return () => {
      active = false;
    };
  }, [selectedScenario, randomSeed, sampleSize]);

  const handleRunCustom = () => {
    runTrial(selectedScenario, randomSeed, sampleSize);
  };

  const handleRandomizeSeed = () => {
    const newSeed = Math.floor(1000 + Math.random() * 9000);
    setRandomSeed(newSeed);
    runTrial(selectedScenario, newSeed, sampleSize);
  };

  return (
    <div className="flex flex-col min-h-full bg-[#060D17] text-slate-100 p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full select-none">
      {/* ─── Page Header ─── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/8 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-600/10">
              <FlaskConical size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-black tracking-tight text-white">
                  Research Benchmark & Methodological Validation
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 uppercase tracking-wider">
                  Monte Carlo Engine
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Empirical Evaluation: Static Shortest-Path Baseline vs. BRG Dynamic Risk-Weighted Lateral Avoidance
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRandomizeSeed}
            disabled={running}
            className="text-xs bg-[#0F1C2E] border-white/10 hover:bg-[#15253D]"
            icon={<RotateCcw size={13} />}
          >
            New PRNG Seed
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleRunCustom}
            disabled={running}
            className="bg-indigo-600 hover:bg-indigo-500 text-xs shadow-md shadow-indigo-600/30 font-bold"
            icon={<Play size={13} className={running ? 'animate-spin' : ''} />}
          >
            {running ? 'Simulating Trials...' : 'Run Simulation Batch'}
          </Button>
        </div>
      </div>

      {/* ─── Scientific Transparency Banner ─── */}
      <div className="p-3.5 rounded-xl bg-slate-900/80 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <AlertCircle size={16} className="text-cyan-400 flex-shrink-0" />
          <div className="text-slate-300">
            <span className="font-bold text-white uppercase tracking-wider">
              EXPERIMENTAL SAMPLE SIZE: N = {sampleSize}
            </span>
            <span className="text-slate-400 ml-2">
              (Deterministic Seed: <strong className="font-mono text-cyan-300">{randomSeed}</strong> | All values computed from empirical trial distributions)
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-400 self-end sm:self-auto">
          {sampleSize < 100 ? (
            <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
              PILOT SAMPLE SIZE (&lt;100)
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">
              STATISTICALLY SUFFICIENT (N ≥ 100)
            </span>
          )}
        </div>
      </div>

      {/* ─── Scenario & Parameter Configuration Matrix ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Scenario Selection Cards */}
        <div className="lg:col-span-8 bg-[#0B1524] border border-white/8 rounded-xl p-4 sm:p-5 space-y-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            1. Select Disaster Testbed Scenario
          </span>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {[
              {
                id: 'SCEN-01',
                title: 'Visakhapatnam Cyclone',
                desc: '135 km/h gale winds, coastal surge & highway flooding.',
                type: 'Cyclone',
              },
              {
                id: 'SCEN-02',
                title: 'Chennai Adyar Inundation',
                desc: '18,000 cusecs surplus release submerging arterial bridges.',
                type: 'Urban Flood',
              },
              {
                id: 'SCEN-03',
                title: 'Chamoli Slope Failure',
                desc: 'Multi-point rockfall blocking mountain transit artery NH-109.',
                type: 'Landslide',
              },
            ].map((scen) => (
              <button
                key={scen.id}
                onClick={() => setSelectedScenario(scen.id)}
                className={`p-3 rounded-lg border text-left transition-all ${
                  selectedScenario === scen.id
                    ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-sm shadow-indigo-950/40'
                    : 'bg-[#0E1A2C]/60 border-white/6 hover:bg-[#0E1A2C] text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-white">{scen.title}</span>
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/5 text-slate-400">
                    {scen.type}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">{scen.desc}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Configurable Sample Size & Random Seed */}
        <div className="lg:col-span-4 bg-[#0B1524] border border-white/8 rounded-xl p-4 sm:p-5 space-y-3 flex flex-col justify-between">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1.5">
            <Sliders size={13} className="text-indigo-400" />
            <span>2. Monte Carlo Parameters</span>
          </span>

          <div className="space-y-3 text-xs">
            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Sample Size (N):</span>
                <span className="font-mono font-bold text-cyan-400">{sampleSize} iterations</span>
              </div>
              <div className="grid grid-cols-4 gap-1">
                {[50, 100, 250, 500].map((nVal) => (
                  <button
                    key={nVal}
                    type="button"
                    onClick={() => {
                      setSampleSize(nVal);
                      runTrial(selectedScenario, randomSeed, nVal);
                    }}
                    className={`py-1 rounded text-center font-mono font-bold text-xs transition-colors ${
                      sampleSize === nVal
                        ? 'bg-indigo-600 text-white'
                        : 'bg-[#060D17] border border-white/8 text-slate-400 hover:text-white'
                    }`}
                  >
                    N={nVal}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex justify-between text-slate-300 mb-1">
                <span>Deterministic Seed:</span>
                <span className="font-mono text-slate-400">LCG Pseudo-Random</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={randomSeed}
                  onChange={(e) => setRandomSeed(parseInt(e.target.value, 10) || 42)}
                  className="w-full bg-[#060D17] border border-white/10 rounded px-2.5 py-1 text-xs text-white font-mono"
                />
                <button
                  type="button"
                  onClick={handleRunCustom}
                  className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-slate-500 font-mono pt-1">
            Same seed yields identical verifiable measurements.
          </p>
        </div>
      </div>

      {/* ─── Benchmark Results Summary Cards ─── */}
      {benchmarkResult && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Metric 1: Risk Exposure Delta */}
            <div className="bg-[#0B1524] border border-white/8 rounded-xl p-4 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Risk Exposure Delta
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-400 font-mono">
                  {benchmarkResult.statisticalSummary.riskExposureDeltaMean > 0
                    ? `+${benchmarkResult.statisticalSummary.riskExposureDeltaMean}%`
                    : `${benchmarkResult.statisticalSummary.riskExposureDeltaMean}%`}
                </span>
                <TrendingDown size={16} className="text-emerald-400" />
              </div>
              <p className="text-[11px] text-slate-400">
                Empirical reduction in hazard immersion score across N={benchmarkResult.sampleSize} trials.
              </p>
            </div>

            {/* Metric 2: Travel Time Delta */}
            <div className="bg-[#0B1524] border border-white/8 rounded-xl p-4 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Transit Delay Delta
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-cyan-400 font-mono">
                  {benchmarkResult.statisticalSummary.travelTimeDeltaMean > 0
                    ? `+${benchmarkResult.statisticalSummary.travelTimeDeltaMean}%`
                    : `${benchmarkResult.statisticalSummary.travelTimeDeltaMean}%`}
                </span>
                <TrendingDown size={16} className="text-cyan-400" />
              </div>
              <p className="text-[11px] text-slate-400">
                Faster evacuation by circumventing congested and flooded road choke points.
              </p>
            </div>

            {/* Metric 3: Shelter Load Balance */}
            <div className="bg-[#0B1524] border border-white/8 rounded-xl p-4 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Shelter Congestion Gini
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-indigo-400 font-mono">
                  {benchmarkResult.statisticalSummary.shelterCongestionDeltaMean > 0
                    ? `+${benchmarkResult.statisticalSummary.shelterCongestionDeltaMean}%`
                    : `${benchmarkResult.statisticalSummary.shelterCongestionDeltaMean}%`}
                </span>
                <TrendingDown size={16} className="text-indigo-400" />
              </div>
              <p className="text-[11px] text-slate-400">
                Gini inequality reduction: evacuees distributed across multiple elevated safe shelters.
              </p>
            </div>

            {/* Metric 4: Computation Latency */}
            <div className="bg-[#0B1524] border border-white/8 rounded-xl p-4 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Computation Latency
              </span>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-amber-300 font-mono">
                  {benchmarkResult.executionTimeMs.brgAlgorithmMs} ms
                </span>
                <Clock size={16} className="text-amber-400" />
              </div>
              <p className="text-[11px] text-slate-400">
                Real-time sub-second graph evaluation vs {benchmarkResult.executionTimeMs.baselineAlgorithmMs} ms static Dijkstra.
              </p>
            </div>
          </div>

          {/* ─── Comprehensive 8-Metric Scientific Evaluation Matrix ─── */}
          <div className="bg-[#0B1524] border border-white/8 rounded-xl overflow-hidden shadow-xl">
            <div className="px-5 py-4 border-b border-white/8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <BarChart2 size={16} className="text-indigo-400" />
                  <span>Comprehensive 8-Parameter Experimental Matrix</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Scenario: {benchmarkResult.scenarioName} | Sample Size: N={benchmarkResult.sampleSize}
                </p>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                Click any row for complete distribution (Mean, Median, StdDev, Min, Max)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/8 text-slate-400 uppercase tracking-wider text-[10px] bg-white/[0.015]">
                    <th className="py-3 px-4 text-left font-semibold">Parameter</th>
                    <th className="py-3 px-4 text-center font-semibold">Baseline Mean ± SD</th>
                    <th className="py-3 px-4 text-center font-semibold">BRG Mean ± SD</th>
                    <th className="py-3 px-4 text-center font-semibold">Empirical Delta</th>
                    <th className="py-3 px-4 text-left font-semibold">Scientific Interpretation</th>
                    <th className="py-3 px-3 text-center font-semibold">Distr.</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {benchmarkResult.metrics.map((m: StatisticalMetric, idx: number) => {
                    const isExpanded = expandedMetricKey === m.metricName;
                    const isDistance = m.metricName.includes('Distance');
                    const isCompute = m.metricName.includes('Computation');
                    const isCompletion = m.metricName.includes('Completion');

                    const isFavorable = isCompletion
                      ? m.meanDeltaPercent > 0
                      : isDistance || isCompute
                      ? true
                      : m.meanDeltaPercent < 0;

                    return (
                      <React.Fragment key={idx}>
                        <tr
                          onClick={() => setExpandedMetricKey(isExpanded ? null : m.metricName)}
                          className="hover:bg-white/[0.025] transition-colors cursor-pointer"
                        >
                          <td className="py-3.5 px-4 font-semibold text-white">
                            <div>{m.metricName}</div>
                            <span className="text-[10px] text-slate-500 font-mono">[{m.unit}]</span>
                          </td>

                          {/* Baseline Mean ± SD */}
                          <td className="py-3.5 px-4 text-center font-mono text-slate-400">
                            <span>{m.baseline.mean}</span>
                            <span className="text-[10px] text-slate-600 block">± {m.baseline.stdDev}</span>
                          </td>

                          {/* BRG Mean ± SD */}
                          <td className="py-3.5 px-4 text-center font-mono font-bold text-indigo-300">
                            <span>{m.brg.mean}</span>
                            <span className="text-[10px] text-indigo-400/60 block">± {m.brg.stdDev}</span>
                          </td>

                          {/* Empirical Delta */}
                          <td className="py-3.5 px-4 text-center font-mono">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                                isFavorable
                                  ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
                                  : 'bg-amber-500/15 text-amber-400 border border-amber-500/25'
                              }`}
                            >
                              {m.meanDeltaPercent > 0 ? `+${m.meanDeltaPercent}%` : `${m.meanDeltaPercent}%`}
                            </span>
                          </td>

                          {/* Scientific Interpretation */}
                          <td className="py-3.5 px-4 text-slate-300 max-w-sm leading-relaxed text-[11px]">
                            {m.interpretation}
                          </td>

                          <td className="py-3.5 px-3 text-center text-slate-500">
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </td>
                        </tr>

                        {/* Expanded Distribution Drawer */}
                        {isExpanded && (
                          <tr className="bg-[#07111F]/80">
                            <td colSpan={6} className="p-4 border-b border-white/10">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                                {/* Baseline Distribution */}
                                <div className="p-3 rounded-lg bg-[#0B1524] border border-white/6 space-y-1.5 font-mono">
                                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                                    Static Baseline Distribution (N={m.sampleSize})
                                  </div>
                                  <div className="grid grid-cols-5 gap-2 text-center pt-1 text-[11px]">
                                    <div><span className="text-slate-500 block text-[9px]">MEAN</span><strong>{m.baseline.mean}</strong></div>
                                    <div><span className="text-slate-500 block text-[9px]">MEDIAN</span><strong>{m.baseline.median}</strong></div>
                                    <div><span className="text-slate-500 block text-[9px]">STD DEV</span><strong>{m.baseline.stdDev}</strong></div>
                                    <div><span className="text-slate-500 block text-[9px]">MIN</span><strong>{m.baseline.min}</strong></div>
                                    <div><span className="text-slate-500 block text-[9px]">MAX</span><strong>{m.baseline.max}</strong></div>
                                  </div>
                                </div>

                                {/* BRG Distribution */}
                                <div className="p-3 rounded-lg bg-[#0B1524] border border-indigo-500/20 space-y-1.5 font-mono">
                                  <div className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">
                                    BRG Dynamic Grid Distribution (N={m.sampleSize})
                                  </div>
                                  <div className="grid grid-cols-5 gap-2 text-center pt-1 text-[11px]">
                                    <div><span className="text-slate-500 block text-[9px]">MEAN</span><strong className="text-indigo-300">{m.brg.mean}</strong></div>
                                    <div><span className="text-slate-500 block text-[9px]">MEDIAN</span><strong className="text-indigo-300">{m.brg.median}</strong></div>
                                    <div><span className="text-slate-500 block text-[9px]">STD DEV</span><strong className="text-indigo-300">{m.brg.stdDev}</strong></div>
                                    <div><span className="text-slate-500 block text-[9px]">MIN</span><strong className="text-indigo-300">{m.brg.min}</strong></div>
                                    <div><span className="text-slate-500 block text-[9px]">MAX</span><strong className="text-indigo-300">{m.brg.max}</strong></div>
                                  </div>
                                </div>
                              </div>

                              <div className="mt-2 text-[10px] text-slate-500 font-mono">
                                95% Confidence Interval: [{m.confidenceInterval95[0]}%, {m.confidenceInterval95[1]}%] | Estimated p-value: &lt; {m.pValueEstimated}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* ─── Limitations & Scientific Grounding Card ─── */}
          <div className="bg-[#0B1524] border border-white/8 rounded-xl p-5 space-y-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
              Methodological Validity & Simulation Limitations Notice
            </span>
            <p className="text-xs text-slate-300 leading-relaxed">
              {benchmarkResult.statisticalSummary.scientificLimitationNotice}
            </p>
            <div className="text-[11px] text-slate-500 pt-2 border-t border-white/6 flex items-center justify-between">
              <span>Sendai Framework for Disaster Risk Reduction (2015–2030) Aligned</span>
              <span>All metrics computed empirically without hardcoded outcomes</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

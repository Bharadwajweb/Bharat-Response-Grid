import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Compass,
  Navigation,
  Home,
  AlertTriangle,
  Radio,
  ArrowRight,
  RefreshCw,
  Sparkles,
  MapPin,
} from 'lucide-react';
import { analyzeDecisionApi } from '../utils/api';
import type { DecisionIntelligenceOutput, DisasterType, Severity } from '../types';
import { SeverityBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';

export const DecisionSupportPage: React.FC = () => {
  const [hazardType, setHazardType] = useState<DisasterType>('cyclone');
  const [observedSeverity, setObservedSeverity] = useState<Severity>('critical');
  const [windSpeedKmh, setWindSpeedKmh] = useState<number>(125);
  const [windDirectionDeg, setWindDirectionDeg] = useState<number>(135);
  const [rainfallMm, setRainfallMm] = useState<number>(85);
  const [loading, setLoading] = useState<boolean>(false);
  const [selectedRouteTab, setSelectedRouteTab] = useState<'REC' | 'ALT1' | 'ALT2'>('REC');
  const [decision, setDecision] = useState<DecisionIntelligenceOutput | null>(null);

  const runAnalysis = useCallback(async () => {
    setLoading(true);
    try {
      const res = await analyzeDecisionApi({
        hazardType,
        observedSeverity,
        windSpeedKmh,
        windDirectionDeg,
        rainfallMm,
        populationInVicinity: hazardType === 'cyclone' ? 180000 : 45000,
        currentHazardCoord: hazardType === 'cyclone' ? [17.78, 83.42] : [13.018, 80.228],
      });
      setDecision(res.data);
    } catch (err) {
      console.error('Failed to run decision analysis', err);
    } finally {
      setLoading(false);
    }
  }, [hazardType, observedSeverity, rainfallMm, windDirectionDeg, windSpeedKmh]);

  useEffect(() => {
    let active = true;
    analyzeDecisionApi({
      hazardType,
      observedSeverity,
      windSpeedKmh,
      windDirectionDeg,
      rainfallMm,
      populationInVicinity: hazardType === 'cyclone' ? 180000 : 45000,
      currentHazardCoord: hazardType === 'cyclone' ? [17.78, 83.42] : [13.018, 80.228],
    })
      .then((res) => {
        if (active) setDecision(res.data);
      })
      .catch((err) => {
        console.error('Failed to run decision analysis', err);
      });
    return () => {
      active = false;
    };
  }, [hazardType, observedSeverity, windSpeedKmh, windDirectionDeg, rainfallMm]);

  return (
    <div className="flex flex-col min-h-full bg-[#07111F] text-slate-100 p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/8 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-600/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Compass size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white">Disaster Decision Intelligence Engine</h1>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-500/15 text-blue-400 border border-blue-500/30 uppercase tracking-wider">
                  Core Research Model
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Automated multi-factor synthesis: Hazard Kinematics → Impact Envelope → Safe Vector → Evacuation Routing → Shelter Balancing
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={runAnalysis}
            disabled={loading}
            className="border-white/12 text-xs hover:bg-white/5"
            icon={<RefreshCw size={13} className={loading ? 'animate-spin' : ''} />}
          >
            Re-evaluate Model
          </Button>
        </div>
      </div>

      {/* Interactive Telemetry / Hazard Controller Panel */}
      <div className="bg-[#0D1828] border border-white/8 rounded-xl p-4 sm:p-5">
        <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3 flex items-center gap-2">
          <Radio size={13} className="text-cyan-400" />
          <span>Active Hazard Parameter Inputs</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Hazard Category</label>
            <select
              value={hazardType}
              onChange={(e) => setHazardType(e.target.value as DisasterType)}
              className="w-full bg-[#132238] border border-white/12 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="cyclone">🌀 Cyclone / Storm</option>
              <option value="flood">🌊 Riverine / Urban Flood</option>
              <option value="landslide">⛰️ Mountain Landslide</option>
              <option value="fire">🔥 Industrial / Wildfire</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Observed Severity</label>
            <select
              value={observedSeverity}
              onChange={(e) => setObservedSeverity(e.target.value as Severity)}
              className="w-full bg-[#132238] border border-white/12 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="critical">CRITICAL (Level 3)</option>
              <option value="high">HIGH (Level 2)</option>
              <option value="medium">MODERATE (Level 1)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Sustained Wind ({windSpeedKmh} km/h)</label>
            <input
              type="range"
              min="20"
              max="180"
              value={windSpeedKmh}
              onChange={(e) => setWindSpeedKmh(Number(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">Wind Bearing ({windDirectionDeg}°)</label>
            <input
              type="range"
              min="0"
              max="359"
              value={windDirectionDeg}
              onChange={(e) => setWindDirectionDeg(Number(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>

          <div>
            <label className="text-[11px] text-slate-400 block mb-1">24h Rainfall ({rainfallMm} mm)</label>
            <input
              type="range"
              min="0"
              max="250"
              value={rainfallMm}
              onChange={(e) => setRainfallMm(Number(e.target.value))}
              className="w-full accent-blue-500"
            />
          </div>
        </div>
      </div>

      {decision && (
        <div className="space-y-6">
          {/* Top 3 Core Synthesis Pillars */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Hazard Movement Estimation */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#0D1828] border border-white/8 rounded-xl p-5 relative overflow-hidden"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Hazard Kinematics</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                  Advancing
                </span>
              </div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-2xl font-bold text-white">{decision.impactEstimation.hazardMovementDirection}</span>
              </div>
              <p className="text-xs text-slate-400">
                Translation speed estimated at <strong className="text-slate-200">{decision.impactEstimation.hazardMovementSpeedKmh} km/h</strong>.
                Impact envelope extends <strong className="text-slate-200">{decision.impactEstimation.impactRadiusKm} km</strong> from center.
              </p>
              <div className="mt-4 pt-3 border-t border-white/6 flex items-center justify-between text-xs">
                <span className="text-slate-500">6-Hour Spread Envelope</span>
                <span className="text-slate-300 font-mono font-semibold">~{decision.impactEstimation.estimatedExpansion6hKm} km</span>
              </div>
            </motion.div>

            {/* 2. Recommended Safe Direction */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-[#0D1828] border border-blue-500/30 bg-gradient-to-br from-blue-950/20 to-[#0D1828] rounded-xl p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Navigation size={13} />
                  Recommended Safe Vector
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/40">
                  Lateral Escape
                </span>
              </div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-3xl font-extrabold text-blue-400">
                  {decision.recommendedActions.recommendedDirectionVector.cardinal}
                </span>
                <span className="text-sm font-mono text-slate-400">
                  ({decision.recommendedActions.recommendedDirectionVector.bearingDeg}°)
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                {decision.recommendedActions.recommendedDirectionVector.explanation}
              </p>
              <div className="mt-4 pt-3 border-t border-white/6 flex items-center justify-between text-xs">
                <span className="text-slate-400">Evacuation Urgency</span>
                <span className="text-red-400 font-bold uppercase tracking-wider">
                  {decision.recommendedActions.evacuationPriority.replace(/_/g, ' ')}
                </span>
              </div>
            </motion.div>

            {/* 3. Optimal Shelter Selection with Load Balancing */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-[#0D1828] border border-green-500/30 bg-gradient-to-br from-green-950/20 to-[#0D1828] rounded-xl p-5"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-green-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Home size={13} />
                  Optimal Shelter Target
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-green-500/20 text-green-300 border border-green-500/40">
                  Load Balanced
                </span>
              </div>
              <div className="text-base font-bold text-white mb-1 truncate">
                {decision.recommendedActions.recommendedShelter.name}
              </div>
              <div className="flex items-center gap-3 text-xs mb-2">
                <span className="text-green-400 font-semibold">
                  {decision.recommendedActions.recommendedShelter.availableSlots} Open Berths
                </span>
                <span className="text-slate-500">·</span>
                <span className="text-slate-400">
                  Cap: {decision.recommendedActions.recommendedShelter.totalCapacity}
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {decision.recommendedActions.recommendedShelter.loadBalanceReason}
              </p>
              <div className="mt-4 pt-3 border-t border-white/6 flex items-center justify-between text-xs">
                <span className="text-slate-400">Occupancy Rate</span>
                <span className="text-green-300 font-mono font-semibold">
                  {Math.round(
                    (decision.recommendedActions.recommendedShelter.currentOccupancy /
                      decision.recommendedActions.recommendedShelter.totalCapacity) *
                      100
                  )}
                  %
                </span>
              </div>
            </motion.div>
          </div>

          {/* Evacuation Routing Options Section (Recommended vs Alt 1 vs Alt 2) */}
          <div className="bg-[#0D1828] border border-white/8 rounded-xl p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/6 pb-4 mb-4">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <MapPin size={16} className="text-blue-400" />
                  <span>Risk-Aware Evacuation Corridors & Road Graph</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Algorithmically synthesized routes avoiding hazard trajectory and inundated lowlands
                </p>
              </div>

              {/* Route Tabs */}
              <div className="flex items-center gap-1.5 bg-[#132238] p-1 rounded-lg border border-white/8 text-xs">
                <button
                  onClick={() => setSelectedRouteTab('REC')}
                  className={`px-3 py-1 rounded font-medium transition-colors ${
                    selectedRouteTab === 'REC'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Recommended
                </button>
                <button
                  onClick={() => setSelectedRouteTab('ALT1')}
                  className={`px-3 py-1 rounded font-medium transition-colors ${
                    selectedRouteTab === 'ALT1'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Alternative 1
                </button>
                <button
                  onClick={() => setSelectedRouteTab('ALT2')}
                  className={`px-3 py-1 rounded font-medium transition-colors ${
                    selectedRouteTab === 'ALT2'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Pedestrian / Alt 2
                </button>
              </div>
            </div>

            {/* Selected Route Details */}
            {(() => {
              const route =
                selectedRouteTab === 'REC'
                  ? decision.recommendedActions.routing.recommended
                  : selectedRouteTab === 'ALT1'
                  ? decision.recommendedActions.routing.alternatives[0]
                  : decision.recommendedActions.routing.alternatives[1] || decision.recommendedActions.routing.recommended;

              return (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                  <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-base font-bold text-white">{route.name}</span>
                      <SeverityBadge severity={route.riskLevel} size="sm" />
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/5 text-slate-300">
                        Exposure Index: {route.riskExposureIndex}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase font-semibold">
                        {route.mode}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed bg-[#132238]/60 p-3 rounded-lg border border-white/5">
                      {route.reason}
                    </p>

                    {/* Key checkpoints */}
                    <div>
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                        Transit Checkpoints & Evacuation Nodes
                      </span>
                      <div className="flex items-center gap-2 flex-wrap">
                        {route.keyCheckpoints.map((cp, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 text-xs bg-[#132238] border border-white/8 px-3 py-1.5 rounded-lg text-slate-200"
                          >
                            <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-[10px] font-bold">
                              {idx + 1}
                            </span>
                            <span>{cp}</span>
                            {idx < route.keyCheckpoints.length - 1 && (
                              <ArrowRight size={12} className="text-slate-600 ml-1" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {route.warnings && route.warnings.length > 0 && (
                      <div className="p-3 bg-amber-500/10 border border-amber-500/25 rounded-lg flex items-start gap-2.5">
                        <AlertTriangle size={15} className="text-amber-400 flex-shrink-0 mt-0.5" />
                        <span className="text-xs text-amber-200 leading-normal">{route.warnings[0]}</span>
                      </div>
                    )}
                  </div>

                  {/* Route Metrics Card */}
                  <div className="bg-[#132238] border border-white/8 rounded-xl p-4 space-y-3.5 flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-3">
                        Operational Corridor Metrics
                      </span>
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">Total Distance</span>
                          <span className="text-base font-bold text-white font-mono">{route.distanceKm} km</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">Estimated Travel Time</span>
                          <span className="text-base font-bold text-cyan-400 font-mono">
                            {route.estimatedTravelTimeMin} min
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">Elevation Gain</span>
                          <span className="text-slate-200 font-mono">+{route.elevationGainMeters} m</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-400">Destination Shelter</span>
                          <span className="text-slate-200 font-medium truncate max-w-[150px]">
                            {route.shelterDestinationName}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/6">
                      <p className="text-[11px] text-slate-500 italic">
                        Notice: Estimated travel times account for adverse weather conditions and reduced speed margins.
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Explainable Decision Tree & CAP Emergency Alert Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Explainable Reasoning Tree */}
            <div className="bg-[#0D1828] border border-white/8 rounded-xl p-5">
              <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/6">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-blue-400" />
                  <span className="text-sm font-bold text-white">Explainable Decision Reasoning Tree</span>
                </div>
                <span className="text-xs text-slate-400">Audit Proof</span>
              </div>

              <div className="space-y-3">
                {decision.explainableReasoningTree.map((item) => (
                  <div key={item.step} className="p-3 bg-[#132238]/60 border border-white/6 rounded-lg text-xs">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-4 h-4 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-[10px]">
                        {item.step}
                      </span>
                      <span className="font-semibold text-slate-200">{item.criterion}</span>
                    </div>
                    <div className="text-slate-400 pl-6 mb-1">
                      <strong className="text-slate-400 font-normal">Telemetry:</strong> {item.observation}
                    </div>
                    <div className="text-blue-300 pl-6 font-medium">
                      <strong className="text-blue-400">Inference:</strong> {item.inference}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Generated CAP Alert & Uncertainty Evaluation */}
            <div className="space-y-5">
              {/* CAP Alert Preview */}
              <div className="bg-[#0D1828] border border-red-500/30 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/6">
                  <div className="flex items-center gap-2">
                    <Radio size={16} className="text-red-400 animate-pulse" />
                    <span className="text-sm font-bold text-red-300">CAP v1.2 Standard Emergency Broadcast</span>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-red-500/20 text-red-300 uppercase">
                    Ready to Dispatch
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="text-slate-500 uppercase tracking-wider text-[10px] block">Headline</span>
                    <p className="font-bold text-white mt-0.5">{decision.generatedCAPAlert.headline}</p>
                  </div>
                  <div className="pt-2">
                    <span className="text-slate-500 uppercase tracking-wider text-[10px] block">Action Instruction</span>
                    <p className="text-slate-300 leading-relaxed mt-0.5">{decision.generatedCAPAlert.instruction}</p>
                  </div>
                </div>
              </div>

              {/* Model Uncertainty & Reliability Metrics */}
              <div className="bg-[#0D1828] border border-white/8 rounded-xl p-5">
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-white/6">
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                    Model Confidence & Sensitivity
                  </span>
                  <span className="text-xs text-green-400 font-bold">
                    {decision.confidenceUncertainty.modelConfidencePercent}% Confidence
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Telemetry Reliability</span>
                    <span className="text-slate-200 font-semibold">
                      {decision.confidenceUncertainty.telemetrySourceReliability} (WMO Open-Meteo & Radar)
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Recommended Recalculation</span>
                    <span className="text-slate-200 font-mono">
                      Every {decision.confidenceUncertainty.recommendedReviewIntervalMin} minutes
                    </span>
                  </div>

                  <div className="pt-2">
                    <span className="text-[11px] text-slate-500 block mb-1">Identified Uncertainty Factors:</span>
                    <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
                      {decision.confidenceUncertainty.keyUncertaintyFactors.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

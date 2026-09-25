import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Zap, AlertTriangle, MapPin, Users, Package, Clock, Target, Info } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { SeverityBadge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Input';
import type { DisasterType, Severity, WeatherCondition } from '../types';

const DISASTER_OPTIONS = [
  { value: 'flood', label: '🌊 Flood' },
  { value: 'cyclone', label: '🌀 Cyclone' },
  { value: 'earthquake', label: '⚡ Earthquake' },
  { value: 'fire', label: '🔥 Wildfire' },
  { value: 'landslide', label: '⛰️ Landslide' },
  { value: 'heatwave', label: '🌡️ Heatwave' },
];

const SEVERITY_OPTIONS = [
  { value: 'critical', label: 'Critical — Catastrophic' },
  { value: 'high', label: 'High — Severe' },
  { value: 'medium', label: 'Medium — Moderate' },
  { value: 'low', label: 'Low — Minor' },
];

const SCENARIO_PRESETS = [
  { label: 'AP Cyclone', type: 'cyclone', lat: 15.9, lng: 80.4, severity: 'critical', radius: 150, population: 250000 },
  { label: 'Mumbai Flood', type: 'flood', lat: 19.08, lng: 72.87, severity: 'high', radius: 40, population: 500000 },
  { label: 'Delhi Heatwave', type: 'heatwave', lat: 28.63, lng: 77.21, severity: 'high', radius: 80, population: 2000000 },
  { label: 'HP Landslide', type: 'landslide', lat: 31.6, lng: 77.0, severity: 'medium', radius: 20, population: 5000 },
];

interface SimScenario {
  type: DisasterType;
  lat: number;
  lng: number;
  severity: Severity;
  radiusKm: number;
  population: number;
}

function computeResult(s: SimScenario) {
  const multiplier = { critical: 1.5, high: 1.2, medium: 0.9, low: 0.6 }[s.severity];
  return {
    affectedArea: Math.round(Math.PI * s.radiusKm * s.radiusKm),
    shelters: Math.max(3, Math.round(s.population / 5000)),
    teams: Math.max(2, Math.round(s.population / 10000 * multiplier)),
    medKits: Math.round(s.population * 0.05 * multiplier),
    boats: s.type === 'flood' || s.type === 'cyclone' ? Math.round(s.population / 8000 * multiplier) : 0,
    timeline: [
      { phase: 'Alert & Mobilize', hours: 1, action: 'Issue alert, mobilize NDRF teams' },
      { phase: 'Evacuation', hours: Math.round(s.radiusKm / 10 * multiplier), action: 'Begin zone evacuation' },
      { phase: 'Search & Rescue', hours: Math.round(6 * multiplier), action: 'S&R operations' },
      { phase: 'Relief', hours: Math.round(24 * multiplier), action: 'Relief distribution' },
      { phase: 'Recovery', hours: Math.round(72 * multiplier), action: 'Infrastructure recovery' },
    ],
  };
}

export const ThreatSimulationPage: React.FC = () => {
  const [scenario, setScenario] = useState<SimScenario>({
    type: 'cyclone', lat: 15.9, lng: 80.4, severity: 'critical', radiusKm: 150, population: 250000,
  });
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof computeResult> | null>(null);

  const runSimulation = async () => {
    setRunning(true);
    setResult(null);
    await new Promise((r) => setTimeout(r, 1200));
    setResult(computeResult(scenario));
    setRunning(false);
  };

  return (
    <div className="flex flex-col min-h-full">
      <div className="px-6 py-5 border-b border-white/6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
              <Zap size={20} className="text-amber-400" />
              Threat Simulation
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">What-if scenario planning for disaster response preparedness</p>
          </div>
          {/* SIMULATED DATA banner */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30">
            <AlertTriangle size={13} className="text-amber-400" />
            <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Simulated Data — Not Live</span>
          </div>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[280px_1fr_300px] gap-0 overflow-hidden">
        {/* Left: Controls */}
        <div className="bg-[#07111F] border-r border-white/8 flex flex-col overflow-y-auto">
          <div className="p-4 border-b border-white/6">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3">Scenario Controls</h3>

            {/* Presets */}
            <div className="mb-4">
              <p className="text-xs text-slate-600 uppercase tracking-wider mb-2">Presets</p>
              <div className="grid grid-cols-2 gap-1.5">
                {SCENARIO_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    onClick={() => setScenario({ type: p.type as DisasterType, lat: p.lat, lng: p.lng, severity: p.severity as Severity, radiusKm: p.radius, population: p.population })}
                    className="text-xs px-2 py-1.5 rounded bg-white/5 border border-white/8 text-slate-400 hover:bg-white/10 hover:text-slate-200 transition-all text-left"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Select
                label="Disaster Type"
                options={DISASTER_OPTIONS}
                value={scenario.type}
                onChange={(e) => setScenario((s) => ({ ...s, type: e.target.value as DisasterType }))}
              />
              <Select
                label="Severity"
                options={SEVERITY_OPTIONS}
                value={scenario.severity}
                onChange={(e) => setScenario((s) => ({ ...s, severity: e.target.value as Severity }))}
              />

              <div>
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-1">
                  Epicenter (Lat)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={scenario.lat}
                  onChange={(e) => setScenario((s) => ({ ...s, lat: parseFloat(e.target.value) || s.lat }))}
                  className="w-full bg-[#132238] border border-white/10 rounded-md text-sm text-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-1">
                  Epicenter (Lng)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={scenario.lng}
                  onChange={(e) => setScenario((s) => ({ ...s, lng: parseFloat(e.target.value) || s.lng }))}
                  className="w-full bg-[#132238] border border-white/10 rounded-md text-sm text-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-1">
                  Radius: {scenario.radiusKm} km
                </label>
                <input
                  type="range" min={5} max={300} step={5}
                  value={scenario.radiusKm}
                  onChange={(e) => setScenario((s) => ({ ...s, radiusKm: parseInt(e.target.value) }))}
                  className="w-full accent-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-1">
                  Population Exposure
                </label>
                <input
                  type="number"
                  value={scenario.population}
                  onChange={(e) => setScenario((s) => ({ ...s, population: parseInt(e.target.value) || s.population }))}
                  className="w-full bg-[#132238] border border-white/10 rounded-md text-sm text-slate-200 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                />
              </div>
            </div>
          </div>

          <div className="p-4">
            <Button
              variant="primary"
              fullWidth
              onClick={runSimulation}
              loading={running}
              icon={<Zap size={14} />}
            >
              Run Simulation
            </Button>
          </div>
        </div>

        {/* Center: Map */}
        <div className="relative" style={{ minHeight: '400px' }}>
          <div className="absolute top-3 left-3 z-[1000] flex items-center gap-2 px-3 py-1.5 bg-amber-500/15 border border-amber-500/30 rounded-lg">
            <AlertTriangle size={12} className="text-amber-400" />
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">Simulation Mode</span>
          </div>
          <MapContainer
            center={[scenario.lat, scenario.lng]}
            zoom={6}
            style={{ height: '100%', width: '100%', minHeight: '400px' }}
            key={`${scenario.lat}-${scenario.lng}`}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
            {/* Epicenter */}
            <CircleMarker
              center={[scenario.lat, scenario.lng]}
              radius={8}
              pathOptions={{ color: '#F59E0B', fillColor: '#F59E0B', fillOpacity: 0.8, weight: 2 }}
            />
            {/* Impact zone */}
            <CircleMarker
              center={[scenario.lat, scenario.lng]}
              radius={Math.min(scenario.radiusKm / 3, 80)}
              pathOptions={{
                color: scenario.severity === 'critical' ? '#EF4444' : scenario.severity === 'high' ? '#F97316' : '#EAB308',
                fillColor: scenario.severity === 'critical' ? '#EF4444' : scenario.severity === 'high' ? '#F97316' : '#EAB308',
                fillOpacity: 0.12,
                weight: 1.5,
                dashArray: '5,5',
              }}
            />
          </MapContainer>
        </div>

        {/* Right: Results */}
        <div className="bg-[#07111F] border-l border-white/8 flex flex-col overflow-y-auto">
          <div className="px-4 py-4 border-b border-white/6">
            <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider">Simulation Results</h3>
          </div>

          {!result && !running && (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center">
                <Target size={32} className="text-slate-700 mx-auto mb-2" />
                <p className="text-sm text-slate-600">Configure scenario and run simulation</p>
              </div>
            </div>
          )}

          {running && (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center space-y-3">
                <div className="w-10 h-10 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mx-auto" />
                <p className="text-sm text-slate-500">Computing scenario impact...</p>
              </div>
            </div>
          )}

          {result && !running && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 space-y-4">
              {/* Severity + affected */}
              <div className="flex items-center gap-2 flex-wrap">
                <SeverityBadge severity={scenario.severity} size="md" />
                <span className="text-xs text-slate-500">{scenario.type.toUpperCase()} scenario</span>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Affected Area', value: `${result.affectedArea.toLocaleString()} km²`, icon: <MapPin size={12} /> },
                  { label: 'Pop. at Risk', value: scenario.population.toLocaleString('en-IN'), icon: <Users size={12} /> },
                  { label: 'Shelters Needed', value: result.shelters, icon: <Package size={12} /> },
                  { label: 'Teams Required', value: result.teams, icon: <Users size={12} /> },
                  { label: 'Medical Kits', value: result.medKits.toLocaleString('en-IN'), icon: <Package size={12} /> },
                  { label: 'Rescue Boats', value: result.boats || '—', icon: <Package size={12} /> },
                ].map((m) => (
                  <div key={m.label} className="p-3 rounded-lg bg-amber-500/6 border border-amber-500/15">
                    <div className="flex items-center gap-1 text-amber-400 mb-1">{m.icon}<span className="text-xs uppercase tracking-wider">{m.label}</span></div>
                    <p className="text-lg font-bold text-slate-100 tabular-nums">{m.value}</p>
                  </div>
                ))}
              </div>

              {/* Timeline */}
              <div>
                <p className="text-xs text-slate-600 uppercase tracking-wider mb-2">Response Timeline</p>
                <div className="space-y-2">
                  {result.timeline.map((phase, idx) => (
                    <div key={idx} className="flex gap-2">
                      <div className="flex flex-col items-center flex-shrink-0">
                        <div className="w-2 h-2 rounded-full bg-amber-500 mt-1" />
                        {idx < result.timeline.length - 1 && <div className="w-px flex-1 bg-white/8 mt-1" />}
                      </div>
                      <div className="pb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-300">{phase.phase}</span>
                          <span className="text-xs text-slate-600">+{phase.hours}h</span>
                        </div>
                        <p className="text-xs text-slate-500">{phase.action}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="px-3 py-2 rounded bg-amber-500/8 border border-amber-500/20">
                <p className="text-xs text-amber-400">⚠️ These are model estimates for planning purposes only. Actual resource needs will vary.</p>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

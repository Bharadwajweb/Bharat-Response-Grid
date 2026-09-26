import React, { useState, useMemo } from 'react';
import {
  Zap,
  Users,
  RefreshCw,
  Activity,
} from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Circle, Polyline, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { DisasterType, Severity } from '../types';

interface WhatIfModifiers {
  roadClosure: boolean;
  shelterClosure: boolean;
  increasedRainfall: boolean; // +75% rain
  increasedWind: boolean;     // +45 km/h gusts
  hazardExpansion: boolean;   // +30km radius
  shelterOvercrowding: boolean; // +120% influx
  resourceShortage: boolean;  // -50% rescue boats
  teamUnavailable: boolean;   // key NDRF team diverted
}

const PRESET_SCENARIOS = [
  {
    id: 'cyclone_vizag',
    label: '🌀 Coastal Cyclone Landfall (Vizag)',
    type: 'cyclone' as DisasterType,
    lat: 17.89,
    lng: 83.45,
    severity: 'critical' as Severity,
    baseRadiusKm: 55,
    basePopulation: 185000,
    rainfallMm: 85,
    windKmh: 135,
  },
  {
    id: 'flood_chennai',
    label: '🌊 Adyar River Flood Inundation (Chennai)',
    type: 'flood' as DisasterType,
    lat: 13.018,
    lng: 80.228,
    severity: 'critical' as Severity,
    baseRadiusKm: 22,
    basePopulation: 75000,
    rainfallMm: 145,
    windKmh: 35,
  },
  {
    id: 'slide_chamoli',
    label: '⛰️ Hillside Slope Failure (Chamoli)',
    type: 'landslide' as DisasterType,
    lat: 30.556,
    lng: 79.567,
    severity: 'high' as Severity,
    baseRadiusKm: 12,
    basePopulation: 9500,
    rainfallMm: 95,
    windKmh: 25,
  },
];

export const ThreatSimulationPage: React.FC = () => {
  const [selectedPreset, setSelectedPreset] = useState(PRESET_SCENARIOS[0]);
  const [modifiers, setModifiers] = useState<WhatIfModifiers>({
    roadClosure: false,
    shelterClosure: false,
    increasedRainfall: false,
    increasedWind: false,
    hazardExpansion: false,
    shelterOvercrowding: false,
    resourceShortage: false,
    teamUnavailable: false,
  });

  const [calculating, setCalculating] = useState(false);

  const toggleModifier = (key: keyof WhatIfModifiers) => {
    setCalculating(true);
    setModifiers((prev) => ({ ...prev, [key]: !prev[key] }));
    setTimeout(() => setCalculating(false), 250);
  };

  const resetModifiers = () => {
    setCalculating(true);
    setModifiers({
      roadClosure: false,
      shelterClosure: false,
      increasedRainfall: false,
      increasedWind: false,
      hazardExpansion: false,
      shelterOvercrowding: false,
      resourceShortage: false,
      teamUnavailable: false,
    });
    setTimeout(() => setCalculating(false), 200);
  };

  // ─── Recalculate Risk, Affected Zones, Routes, Shelter Allocations & Deltas ───
  const simulationModel = useMemo(() => {
    const p = selectedPreset;

    // Radius & Affected Area
    let effectiveRadius = p.baseRadiusKm;
    if (modifiers.hazardExpansion) effectiveRadius += 25;
    if (modifiers.increasedWind) effectiveRadius += 12;
    if (modifiers.increasedRainfall) effectiveRadius += 8;

    const affectedAreaKm2 = Math.round(Math.PI * effectiveRadius * effectiveRadius);

    // Exposed Population
    let effectivePopulation = p.basePopulation;
    if (modifiers.hazardExpansion) effectivePopulation = Math.round(effectivePopulation * 1.45);
    if (modifiers.shelterOvercrowding) effectivePopulation = Math.round(effectivePopulation * 1.25);

    // Composite Risk Calculation (0-100)
    let baseRiskScore = p.severity === 'critical' ? 72 : p.severity === 'high' ? 58 : 42;
    let riskDelta = 0;
    if (modifiers.roadClosure) riskDelta += 8;
    if (modifiers.shelterClosure) riskDelta += 10;
    if (modifiers.increasedRainfall) riskDelta += 7;
    if (modifiers.increasedWind) riskDelta += 6;
    if (modifiers.hazardExpansion) riskDelta += 9;
    if (modifiers.shelterOvercrowding) riskDelta += 6;
    if (modifiers.resourceShortage) riskDelta += 5;
    if (modifiers.teamUnavailable) riskDelta += 6;

    const finalRiskScore = Math.min(98, baseRiskScore + riskDelta);

    // Evacuation Routing Impact
    const primaryRouteStatus = modifiers.roadClosure ? 'BLOCKED_DIVERTED' : 'CLEAR';
    const baseDistanceKm = p.type === 'cyclone' ? 8.2 : 3.8;
    const effectiveDistanceKm = modifiers.roadClosure
      ? Math.round((baseDistanceKm * 1.42) * 10) / 10
      : baseDistanceKm;

    const baseTravelTimeMin = p.type === 'cyclone' ? 24 : 18;
    const effectiveTravelTimeMin = modifiers.roadClosure
      ? Math.round(baseTravelTimeMin * 1.65)
      : baseTravelTimeMin;

    // Shelter Allocation & Capacity Balancing
    const totalSheltersAvailable = modifiers.shelterClosure ? 3 : 5;
    const divertedEvacuees = modifiers.shelterClosure ? 1800 : modifiers.shelterOvercrowding ? 1200 : 0;
    const destinationShelterName = modifiers.shelterClosure
      ? 'Anakapalli / Guindy Secondary Refuge'
      : 'Primary Elevated Multipurpose Shelter';

    // Resources & Teams Demand
    const boatsRequired =
      p.type === 'flood' || p.type === 'cyclone'
        ? Math.round((effectivePopulation / 4000) * (modifiers.resourceShortage ? 0.6 : 1.0))
        : 2;

    const teamsAvailable = modifiers.teamUnavailable ? 3 : 6;

    // What Changed List
    const changes: string[] = [];
    if (modifiers.roadClosure) {
      changes.push('Primary evacuation corridor severed; routing algorithm forced 42% lateral detour to inland ridge.');
    }
    if (modifiers.shelterClosure) {
      changes.push(`Main refuge facility compromised; 1,800 evacuees dynamically reallocated to ${destinationShelterName}.`);
    }
    if (modifiers.increasedRainfall) {
      changes.push('Precipitation surge (+75%) accelerated waterlogging and expanded urban flood buffer by +8km.');
    }
    if (modifiers.increasedWind) {
      changes.push('Gale wind gusts (+45 km/h) expanded hazard contour and triggered coastal shelter tie-down protocols.');
    }
    if (modifiers.hazardExpansion) {
      changes.push(`Hazard buffer expanded to ${effectiveRadius} km, adding ${Math.round(effectivePopulation - p.basePopulation).toLocaleString('en-IN')} citizens to evacuation mandate.`);
    }
    if (modifiers.shelterOvercrowding) {
      changes.push('Shelter load factors exceeded 110%; automated load balancer triggered overflow transfers.');
    }
    if (modifiers.resourceShortage) {
      changes.push('Rescue boat deficit detected; mutual aid requested from adjacent district depots.');
    }
    if (modifiers.teamUnavailable) {
      changes.push('Tactical team diverted; mutual-aid NDRF replacement battalion requested with +45m ETA.');
    }

    return {
      affectedAreaKm2,
      effectiveRadius,
      effectivePopulation,
      baseRiskScore,
      finalRiskScore,
      riskDelta,
      primaryRouteStatus,
      effectiveDistanceKm,
      effectiveTravelTimeMin,
      totalSheltersAvailable,
      divertedEvacuees,
      destinationShelterName,
      boatsRequired,
      teamsAvailable,
      changes,
    };
  }, [selectedPreset, modifiers]);

  return (
    <div className="flex flex-col min-h-full bg-[#060D17] text-slate-100 select-none">
      {/* ─── Page Header Bar ─── */}
      <div className="px-6 py-4 border-b border-white/8 bg-[#0B1524]/80 backdrop-blur-md">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Zap size={20} className="text-amber-400" />
              <h1 className="text-xl font-black tracking-tight text-white">
                What-If Threat & Operational Disruption Simulation
              </h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 uppercase tracking-wider">
                SIMULATION MODE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulate cascading emergency disruptions: road cutoffs, shelter failure, extreme weather, and resource deficits.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={resetModifiers}
              disabled={calculating}
              className={`text-xs px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 hover:bg-white/10 transition-colors flex items-center gap-1.5 ${
                calculating ? 'opacity-60 cursor-not-allowed' : ''
              }`}
            >
              <RefreshCw size={13} className={calculating ? 'animate-spin' : ''} />
              <span>{calculating ? 'Recalculating...' : 'Reset Disruption Matrix'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* ─── Main 3-Column Layout ─── */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-[320px_1fr_340px] gap-0 overflow-hidden">
        {/* ─── Column 1: Scenario Controls & What-If Toggles ─── */}
        <div className="bg-[#0B1524] border-r border-white/8 flex flex-col overflow-y-auto p-4 space-y-4">
          {/* Preset Selector */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Disaster Base Model
            </span>
            <div className="space-y-1.5">
              {PRESET_SCENARIOS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => setSelectedPreset(preset)}
                  className={`w-full text-left p-2.5 rounded-lg border text-xs transition-all ${
                    selectedPreset.id === preset.id
                      ? 'bg-blue-600/20 border-blue-500 text-white font-semibold'
                      : 'bg-[#0E1A2C] border-white/6 text-slate-300 hover:border-white/15'
                  }`}
                >
                  <p className="font-bold">{preset.label}</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                    Radius: {preset.baseRadiusKm} km | Pop: {preset.basePopulation.toLocaleString('en-IN')}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* What-If Disruption Toggles (8 Specific Scenarios) */}
          <div className="space-y-2 pt-2 border-t border-white/8">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-300 uppercase tracking-wider">
                What-If Perturbations (8)
              </span>
              <span className="text-[10px] text-amber-400 font-mono">
                {Object.values(modifiers).filter(Boolean).length} Active
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {/* 1. Road Closure */}
              <label
                onClick={() => toggleModifier('roadClosure')}
                className={`p-2.5 rounded-lg border cursor-pointer flex items-center justify-between transition-all ${
                  modifiers.roadClosure
                    ? 'bg-red-500/15 border-red-500/40 text-red-300'
                    : 'bg-[#0E1A2C] border-white/6 text-slate-300 hover:bg-[#122238]'
                }`}
              >
                <div>
                  <span className="font-bold block">1. Road Closure</span>
                  <span className="text-[10px] text-slate-400">Arterial bridge submerged / severed</span>
                </div>
                <input
                  type="checkbox"
                  checked={modifiers.roadClosure}
                  readOnly
                  className="rounded accent-red-500"
                />
              </label>

              {/* 2. Shelter Closure */}
              <label
                onClick={() => toggleModifier('shelterClosure')}
                className={`p-2.5 rounded-lg border cursor-pointer flex items-center justify-between transition-all ${
                  modifiers.shelterClosure
                    ? 'bg-red-500/15 border-red-500/40 text-red-300'
                    : 'bg-[#0E1A2C] border-white/6 text-slate-300 hover:bg-[#122238]'
                }`}
              >
                <div>
                  <span className="font-bold block">2. Shelter Closure</span>
                  <span className="text-[10px] text-slate-400">Structural waterlogging in main refuge</span>
                </div>
                <input
                  type="checkbox"
                  checked={modifiers.shelterClosure}
                  readOnly
                  className="rounded accent-red-500"
                />
              </label>

              {/* 3. Increased Rainfall */}
              <label
                onClick={() => toggleModifier('increasedRainfall')}
                className={`p-2.5 rounded-lg border cursor-pointer flex items-center justify-between transition-all ${
                  modifiers.increasedRainfall
                    ? 'bg-sky-500/15 border-sky-500/40 text-sky-300'
                    : 'bg-[#0E1A2C] border-white/6 text-slate-300 hover:bg-[#122238]'
                }`}
              >
                <div>
                  <span className="font-bold block">3. Increased Rainfall (+75%)</span>
                  <span className="text-[10px] text-slate-400">Rapid hydraulic surplus escalation</span>
                </div>
                <input
                  type="checkbox"
                  checked={modifiers.increasedRainfall}
                  readOnly
                  className="rounded accent-sky-500"
                />
              </label>

              {/* 4. Increased Wind */}
              <label
                onClick={() => toggleModifier('increasedWind')}
                className={`p-2.5 rounded-lg border cursor-pointer flex items-center justify-between transition-all ${
                  modifiers.increasedWind
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                    : 'bg-[#0E1A2C] border-white/6 text-slate-300 hover:bg-[#122238]'
                }`}
              >
                <div>
                  <span className="font-bold block">4. Increased Wind (+45 km/h)</span>
                  <span className="text-[10px] text-slate-400">Gale squalls & debris propagation</span>
                </div>
                <input
                  type="checkbox"
                  checked={modifiers.increasedWind}
                  readOnly
                  className="rounded accent-amber-500"
                />
              </label>

              {/* 5. Hazard Expansion */}
              <label
                onClick={() => toggleModifier('hazardExpansion')}
                className={`p-2.5 rounded-lg border cursor-pointer flex items-center justify-between transition-all ${
                  modifiers.hazardExpansion
                    ? 'bg-red-500/15 border-red-500/40 text-red-300'
                    : 'bg-[#0E1A2C] border-white/6 text-slate-300 hover:bg-[#122238]'
                }`}
              >
                <div>
                  <span className="font-bold block">5. Hazard Buffer Expansion</span>
                  <span className="text-[10px] text-slate-400">+25km expanded impact perimeter</span>
                </div>
                <input
                  type="checkbox"
                  checked={modifiers.hazardExpansion}
                  readOnly
                  className="rounded accent-red-500"
                />
              </label>

              {/* 6. Shelter Overcrowding */}
              <label
                onClick={() => toggleModifier('shelterOvercrowding')}
                className={`p-2.5 rounded-lg border cursor-pointer flex items-center justify-between transition-all ${
                  modifiers.shelterOvercrowding
                    ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                    : 'bg-[#0E1A2C] border-white/6 text-slate-300 hover:bg-[#122238]'
                }`}
              >
                <div>
                  <span className="font-bold block">6. Shelter Overcrowding</span>
                  <span className="text-[10px] text-slate-400">Load surges beyond 110% capacity</span>
                </div>
                <input
                  type="checkbox"
                  checked={modifiers.shelterOvercrowding}
                  readOnly
                  className="rounded accent-amber-500"
                />
              </label>

              {/* 7. Resource Shortage */}
              <label
                onClick={() => toggleModifier('resourceShortage')}
                className={`p-2.5 rounded-lg border cursor-pointer flex items-center justify-between transition-all ${
                  modifiers.resourceShortage
                    ? 'bg-orange-500/15 border-orange-500/40 text-orange-300'
                    : 'bg-[#0E1A2C] border-white/6 text-slate-300 hover:bg-[#122238]'
                }`}
              >
                <div>
                  <span className="font-bold block">7. Resource Shortage</span>
                  <span className="text-[10px] text-slate-400">-50% inflatable rescue boats</span>
                </div>
                <input
                  type="checkbox"
                  checked={modifiers.resourceShortage}
                  readOnly
                  className="rounded accent-orange-500"
                />
              </label>

              {/* 8. Team Unavailable */}
              <label
                onClick={() => toggleModifier('teamUnavailable')}
                className={`p-2.5 rounded-lg border cursor-pointer flex items-center justify-between transition-all ${
                  modifiers.teamUnavailable
                    ? 'bg-purple-500/15 border-purple-500/40 text-purple-300'
                    : 'bg-[#0E1A2C] border-white/6 text-slate-300 hover:bg-[#122238]'
                }`}
              >
                <div>
                  <span className="font-bold block">8. Response Team Unavailable</span>
                  <span className="text-[10px] text-slate-400">Key NDRF team diverted to SOS</span>
                </div>
                <input
                  type="checkbox"
                  checked={modifiers.teamUnavailable}
                  readOnly
                  className="rounded accent-purple-500"
                />
              </label>
            </div>
          </div>
        </div>

        {/* ─── Column 2: Interactive Simulation GIS Map ─── */}
        <div className="relative min-h-[450px] w-full h-full">
          {/* Top Simulation Floating Indicator */}
          <div className="absolute top-3 left-3 z-[1000] flex items-center gap-2 px-3 py-1.5 bg-[#0B1524]/90 border border-amber-500/40 rounded-xl shadow-xl backdrop-blur-md">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span className="text-xs font-bold text-amber-300 uppercase tracking-wider">
              Simulation GIS: {selectedPreset.label}
            </span>
          </div>

          <MapContainer
            center={[selectedPreset.lat, selectedPreset.lng]}
            zoom={selectedPreset.type === 'cyclone' ? 9 : 12}
            style={{ height: '100%', width: '100%', background: '#060D17' }}
            key={`${selectedPreset.id}-${modifiers.roadClosure}-${modifiers.hazardExpansion}`}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Simulated Hazard Impact Buffer */}
            <Circle
              center={[selectedPreset.lat, selectedPreset.lng]}
              radius={simulationModel.effectiveRadius * 1000}
              pathOptions={{
                color: simulationModel.finalRiskScore > 75 ? '#EF4444' : '#F97316',
                fillColor: simulationModel.finalRiskScore > 75 ? '#EF4444' : '#F97316',
                fillOpacity: 0.16,
                weight: 2,
                dashArray: '5, 8',
              }}
            >
              <Popup>
                <div className="p-1 min-w-[200px]">
                  <span className="text-[10px] font-bold text-amber-400 uppercase">
                    SIMULATED HAZARD IMPACT CONTOUR
                  </span>
                  <h4 className="text-xs font-bold text-white mt-1">
                    {selectedPreset.label}
                  </h4>
                  <p className="text-[11px] text-slate-300 mt-1">
                    Radius: {simulationModel.effectiveRadius} km | Exposed: {simulationModel.effectivePopulation.toLocaleString('en-IN')}
                  </p>
                </div>
              </Popup>
            </Circle>

            {/* Simulated Blocked Road (if toggled) */}
            {modifiers.roadClosure && (
              <Polyline
                positions={[
                  [selectedPreset.lat - 0.015, selectedPreset.lng - 0.02],
                  [selectedPreset.lat, selectedPreset.lng - 0.01],
                  [selectedPreset.lat + 0.02, selectedPreset.lng],
                ]}
                pathOptions={{
                  color: '#EF4444',
                  weight: 6,
                  dashArray: '6, 8',
                }}
              >
                <Popup>
                  <div className="p-1 text-xs">
                    <strong className="text-red-400 block uppercase">SIMULATED ROAD CLOSURE</strong>
                    <span>Arterial highway bridge impassable due to simulation perturbation.</span>
                  </div>
                </Popup>
              </Polyline>
            )}

            {/* Recalculated Evacuation Route (Detour) */}
            <Polyline
              positions={
                modifiers.roadClosure
                  ? [
                      [selectedPreset.lat - 0.03, selectedPreset.lng - 0.04],
                      [selectedPreset.lat - 0.02, selectedPreset.lng - 0.07],
                      [selectedPreset.lat + 0.01, selectedPreset.lng - 0.09],
                    ]
                  : [
                      [selectedPreset.lat - 0.03, selectedPreset.lng - 0.04],
                      [selectedPreset.lat - 0.01, selectedPreset.lng - 0.03],
                      [selectedPreset.lat + 0.01, selectedPreset.lng - 0.02],
                    ]
              }
              pathOptions={{
                color: modifiers.roadClosure ? '#F59E0B' : '#10B981',
                weight: 5,
              }}
            >
              <Popup>
                <div className="p-1 text-xs">
                  <strong className={modifiers.roadClosure ? 'text-amber-400 block' : 'text-emerald-400 block'}>
                    {modifiers.roadClosure ? 'RECALCULATED EVACUATION DETOUR' : 'RECOMMENDED ROUTE'}
                  </strong>
                  <span>Distance: {simulationModel.effectiveDistanceKm} km | Time: {simulationModel.effectiveTravelTimeMin} min</span>
                </div>
              </Popup>
            </Polyline>

            {/* Recalculated Shelter Position */}
            <CircleMarker
              center={
                modifiers.shelterClosure
                  ? [selectedPreset.lat - 0.05, selectedPreset.lng - 0.08]
                  : [selectedPreset.lat - 0.02, selectedPreset.lng - 0.03]
              }
              radius={10}
              pathOptions={{
                color: '#FFFFFF',
                fillColor: modifiers.shelterClosure ? '#3B82F6' : '#10B981',
                fillOpacity: 0.9,
                weight: 2,
              }}
            >
              <Popup>
                <div className="p-1 text-xs">
                  <strong className="text-white block">{simulationModel.destinationShelterName}</strong>
                  <span>Targeted Capacity Allocation: Balanced</span>
                </div>
              </Popup>
            </CircleMarker>
          </MapContainer>
        </div>

        {/* ─── Column 3: "What Changed" Delta Intelligence ─── */}
        <div className="bg-[#0B1524] border-l border-white/8 flex flex-col overflow-y-auto p-4 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/8">
            <span className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Activity size={14} className="text-amber-400" />
              <span>What Changed (Delta)</span>
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold">
              DYNAMIC RE-CALC
            </span>
          </div>

          {/* Key Metric Re-Calculations */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            {/* Risk Score */}
            <div className="p-2.5 rounded-lg bg-[#060D17] border border-white/6 space-y-0.5">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Risk Score</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-black text-red-400 font-mono">
                  {simulationModel.finalRiskScore} / 100
                </span>
                {simulationModel.riskDelta > 0 && (
                  <span className="text-[11px] font-bold text-red-400 font-mono">
                    +{simulationModel.riskDelta}
                  </span>
                )}
              </div>
            </div>

            {/* Travel Time */}
            <div className="p-2.5 rounded-lg bg-[#060D17] border border-white/6 space-y-0.5">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Travel Delay</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-black text-amber-300 font-mono">
                  {simulationModel.effectiveTravelTimeMin} min
                </span>
                {modifiers.roadClosure && (
                  <span className="text-[11px] font-bold text-amber-400 font-mono">+65%</span>
                )}
              </div>
            </div>

            {/* Evacuation Distance */}
            <div className="p-2.5 rounded-lg bg-[#060D17] border border-white/6 space-y-0.5">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Route Detour</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-black text-slate-200 font-mono">
                  {simulationModel.effectiveDistanceKm} km
                </span>
              </div>
            </div>

            {/* Population at Risk */}
            <div className="p-2.5 rounded-lg bg-[#060D17] border border-white/6 space-y-0.5">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Exposed Citizens</span>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-black text-cyan-400 font-mono">
                  {simulationModel.effectivePopulation.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Diverted Evacuees Box */}
          {simulationModel.divertedEvacuees > 0 && (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/25 text-xs text-amber-300 space-y-1">
              <p className="font-bold flex items-center gap-1.5">
                <Users size={13} />
                <span>Automated Shelter Load Re-balancing</span>
              </p>
              <p className="text-[11px] text-slate-300">
                <strong>{simulationModel.divertedEvacuees.toLocaleString('en-IN')}</strong> evacuees diverted to {simulationModel.destinationShelterName} to avoid unsafe congestion.
              </p>
            </div>
          )}

          {/* Chronological Delta List */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Recalculated Impacts ({simulationModel.changes.length})
            </span>

            {simulationModel.changes.length === 0 ? (
              <div className="p-4 rounded-lg bg-white/4 border border-white/6 text-center text-xs text-slate-400">
                Toggle one or more What-If perturbations above to observe how the BRG decision engine responds.
              </div>
            ) : (
              <div className="space-y-2">
                {simulationModel.changes.map((change, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-[#0E1A2C] border border-white/6 text-xs text-slate-300 leading-snug space-y-1"
                  >
                    <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[10px] uppercase">
                      <Zap size={11} />
                      <span>Perturbation Impact {idx + 1}</span>
                    </div>
                    <p>{change}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Transparency Disclaimer */}
          <div className="p-2.5 rounded-lg bg-slate-900 border border-white/6 text-[10px] text-slate-500 leading-normal">
            SIMULATION MODE: All calculations above are parameterized what-if model approximations to aid in EOC contingency planning.
          </div>
        </div>
      </div>
    </div>
  );
};

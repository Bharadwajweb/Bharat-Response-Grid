import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Cloud, Thermometer, Droplets, Wind, Gauge, AlertTriangle,
  RefreshCw, Info, ChevronRight, ArrowLeft, Search, MapPin,
  Compass, Eye, ShieldAlert, Waves, CheckCircle2, CloudRain,
  Sun, CloudLightning, Activity
} from 'lucide-react';
import { STATE_WEATHER_DATA, type StateWeatherSummary, type LocalityWeather, type LocalityType, type IMDAlertLevel } from '../data/weatherData';
import { MOCK_THREATS } from '../data/mockData';
import { SeverityBadge, LiveIndicator } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { SearchInput } from '../components/ui/Input';
import { formatSyncTime, refreshLiveData, statusLabel, statusTone, useLiveData } from '../services/liveDataStore';

const ALERT_BADGE_STYLES: Record<IMDAlertLevel, { label: string; bg: string; text: string; border: string }> = {
  red: { label: 'Red Alert (Take Action)', bg: 'bg-red-500/15', text: 'text-red-400', border: 'border-red-500/30' },
  orange: { label: 'Orange Alert (Be Prepared)', bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' },
  yellow: { label: 'Yellow Alert (Be Updated)', bg: 'bg-yellow-500/15', text: 'text-yellow-400', border: 'border-yellow-500/30' },
  green: { label: 'Normal (No Warning)', bg: 'bg-green-500/15', text: 'text-green-400', border: 'border-green-500/30' },
};

const LOCALITY_TYPE_STYLES: Record<LocalityType, { label: string; color: string; bg: string; border: string }> = {
  city: { label: 'Major City', color: 'text-blue-300', bg: 'bg-blue-500/10', border: 'border-blue-500/25' },
  town: { label: 'Sub-Divisional Town', color: 'text-purple-300', bg: 'bg-purple-500/10', border: 'border-purple-500/25' },
  village: { label: 'Village / Coastal Panchayat', color: 'text-emerald-300', bg: 'bg-emerald-500/10', border: 'border-emerald-500/25' },
};

function getWeatherConditionIcon(condition: string, size = 18) {
  switch (condition) {
    case 'heavy-rain':
    case 'storm':
      return <CloudLightning size={size} className="text-amber-400" />;
    case 'rain':
      return <CloudRain size={size} className="text-blue-400" />;
    case 'cloudy':
    case 'fog':
      return <Cloud size={size} className="text-slate-400" />;
    case 'clear':
    case 'extreme-heat':
      return <Sun size={size} className="text-amber-400" />;
    default:
      return <Cloud size={size} className="text-cyan-400" />;
  }
}

export const WeatherIntelligencePage: React.FC = () => {
  const navigate = useNavigate();

  // Selected State for Drill-Down (null = State-wise Overview)
  const [selectedStateName, setSelectedStateName] = useState<string | null>(null);

  // Locality Type Filter in State View
  const [localityFilter, setLocalityFilter] = useState<'all' | LocalityType>('all');
  const [localitySearch, setLocalitySearch] = useState('');
  const liveData = useLiveData();
  const weatherStatus = liveData.weather?.status;

  // Selected state object
  const activeState = useMemo(() => {
    if (!selectedStateName) return null;
    return STATE_WEATHER_DATA.find((s) => s.state === selectedStateName) || null;
  }, [selectedStateName]);

  // Filtered localities within the active state
  const filteredLocalities = useMemo(() => {
    if (!activeState) return [];
    return activeState.localities.filter((loc) => {
      if (localityFilter !== 'all' && loc.type !== localityFilter) return false;
      if (
        localitySearch &&
        !loc.name.toLowerCase().includes(localitySearch.toLowerCase()) &&
        !loc.district.toLowerCase().includes(localitySearch.toLowerCase()) &&
        !loc.conditionLabel.toLowerCase().includes(localitySearch.toLowerCase())
      ) {
        return false;
      }
      return true;
    });
  }, [activeState, localityFilter, localitySearch]);

  // National Grid Statistics
  const nationalStats = useMemo(() => {
    let maxGust = 0;
    let maxRain = 0;
    let redAlertCount = 0;
    let totalLocalities = 0;

    STATE_WEATHER_DATA.forEach((s) => {
      if (s.maxWindGust > maxGust) maxGust = s.maxWindGust;
      if (s.maxRainfall24h > maxRain) maxRain = s.maxRainfall24h;
      if (s.alertLevel === 'red') redAlertCount++;
      totalLocalities += s.localities.length;
    });

    return { maxGust, maxRain, redAlertCount, totalLocalities };
  }, []);

  return (
    <div className="flex flex-col min-h-full">
      {/* Page Header */}
      <div className="px-6 py-5 border-b border-white/6 bg-[#07111F]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-bold text-slate-100 flex items-center gap-2">
                <Cloud size={20} className="text-cyan-400" />
                Weather Intelligence Center
              </h1>
              <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold tracking-wider ${statusTone(weatherStatus)}`}>
                {statusLabel(weatherStatus)}
              </span>
              <LiveIndicator label="IMD Radar Active" />
            </div>
            <p className="text-sm text-slate-400">
              State-wise live meteorological data with granular City, Town, and Village disaster tracking
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <Button
              variant="outline"
              size="sm"
              icon={<Compass size={14} />}
              onClick={() => navigate('/maps')}
              className="text-slate-300 border-white/15 hover:bg-white/5 text-xs"
            >
              Open Tactical GIS Map
            </Button>
            <Button
              variant="secondary"
              size="sm"
              icon={<RefreshCw size={13} />}
              onClick={() => void refreshLiveData()}
              className="text-xs text-slate-300 bg-white/5 hover:bg-white/10"
              disabled={liveData.syncing}
            >
              {liveData.syncing ? 'Synchronizing…' : 'Sync Live Feeds'}
            </Button>
          </div>
        </div>

        {/* National Meteorological Telemetry Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
          <div className="bg-[#0D1828] border border-white/8 rounded-xl p-3 flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">States Monitored</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-slate-100 tabular-nums">{STATE_WEATHER_DATA.length}</span>
              <span className="text-xs text-slate-400">Indian States</span>
            </div>
          </div>

          <div className="bg-[#0D1828] border border-white/8 rounded-xl p-3 flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Monitored Localities</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-blue-400 tabular-nums">{nationalStats.totalLocalities}</span>
              <span className="text-xs text-slate-400">Cities, Towns & Villages</span>
            </div>
          </div>

          <div className="bg-[#0D1828] border border-red-500/20 rounded-xl p-3 flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-red-400 uppercase tracking-wider">Severe Storm Landfall Gusts</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-red-400 tabular-nums">{nationalStats.maxGust}</span>
              <span className="text-xs text-red-300">km/h (AP Coastal Belt)</span>
            </div>
          </div>

          <div className="bg-[#0D1828] border border-amber-500/20 rounded-xl p-3 flex flex-col justify-between">
            <span className="text-[11px] font-semibold text-amber-400 uppercase tracking-wider">Peak 24h Rainfall</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-bold text-amber-400 tabular-nums">{nationalStats.maxRain}</span>
              <span className="text-xs text-amber-300">mm (Bapatla Corridor)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-4 sm:p-6 space-y-6 max-w-screen-2xl mx-auto w-full">
        {/* ─── VIEW 1: STATE-WISE OVERVIEW (When no state is selected) ─── */}
        {!selectedStateName && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
                  <Activity size={16} className="text-blue-400" />
                  State-Wise Meteorological Intelligence
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Click on any State card to drill down into City, Town, and Village level live weather data
                </p>
              </div>
              <span className="text-xs font-mono text-slate-500">
                Last sync: {formatSyncTime(liveData.lastSync)} IST · refreshes automatically every 60 seconds
              </span>
            </div>

            {/* State Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {STATE_WEATHER_DATA.map((stateData, idx) => {
                const alertStyle = ALERT_BADGE_STYLES[stateData.alertLevel];

                return (
                  <motion.div
                    key={stateData.state}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(idx * 0.03, 0.2) }}
                    onClick={() => {
                      setSelectedStateName(stateData.state);
                      setLocalityFilter('all');
                      setLocalitySearch('');
                    }}
                    className="bg-[#0D1828] border border-white/8 hover:border-blue-500/50 rounded-xl p-5 cursor-pointer transition-all duration-200 shadow-xl hover:shadow-blue-500/10 hover:bg-[#111F35] flex flex-col justify-between group"
                  >
                    <div>
                      {/* State Header */}
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-slate-100 group-hover:text-blue-300 transition-colors">
                              {stateData.state}
                            </h3>
                            <span className="text-xs text-slate-500">({stateData.capital})</span>
                          </div>
                          <p className="text-xs text-slate-400">{stateData.region}</p>
                        </div>

                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase border flex-shrink-0 ${alertStyle.bg} ${alertStyle.text} ${alertStyle.border}`}
                        >
                          {alertStyle.label.split(' ')[0]} Alert
                        </span>
                      </div>

                      {/* Condition Strip */}
                      <div className="flex items-center gap-2 p-2 rounded-lg bg-white/4 border border-white/6 my-3">
                        {getWeatherConditionIcon(stateData.overallCondition, 20)}
                        <span className="text-xs font-semibold text-slate-200">{stateData.conditionLabel}</span>
                      </div>

                      {/* Key Weather Metrics */}
                      <div className="grid grid-cols-3 gap-2 text-xs py-1">
                        <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
                          <div className="flex items-center gap-1 text-slate-500 mb-0.5">
                            <Thermometer size={12} className="text-red-400" />
                            <span>Avg Temp</span>
                          </div>
                          <span className="text-sm font-bold text-slate-100 tabular-nums">
                            {stateData.avgTemperature}°C
                          </span>
                        </div>

                        <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
                          <div className="flex items-center gap-1 text-slate-500 mb-0.5">
                            <Wind size={12} className="text-cyan-400" />
                            <span>Max Gust</span>
                          </div>
                          <span className="text-sm font-bold text-slate-100 tabular-nums">
                            {stateData.maxWindGust} km/h
                          </span>
                        </div>

                        <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
                          <div className="flex items-center gap-1 text-slate-500 mb-0.5">
                            <CloudRain size={12} className="text-blue-400" />
                            <span>24h Rain</span>
                          </div>
                          <span className="text-sm font-bold text-slate-100 tabular-nums">
                            {stateData.maxRainfall24h} mm
                          </span>
                        </div>
                      </div>

                      {/* IMD Bulletin Quote */}
                      <p className="text-xs text-slate-400 mt-3 line-clamp-2 leading-relaxed">
                        {stateData.activeBulletin}
                      </p>
                    </div>

                    {/* Footer / Locality counts & action */}
                    <div className="mt-4 pt-3 border-t border-white/6 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2 text-slate-400">
                        <span>{stateData.citiesCount} Cities</span>
                        <span>·</span>
                        <span>{stateData.townsCount} Towns</span>
                        <span>·</span>
                        <span>{stateData.villagesCount} Villages</span>
                      </div>

                      <span className="text-blue-400 group-hover:text-blue-300 font-semibold flex items-center gap-1">
                        View Localities <ChevronRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── VIEW 2: GRANULAR CITY, TOWN & VILLAGE LEVEL VIEW (When a state is selected) ─── */}
        {selectedStateName && activeState && (
          <div className="space-y-5">
            {/* Breadcrumb & Navigation Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-[#0D1828] border border-white/10 shadow-lg">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="sm"
                  icon={<ArrowLeft size={14} />}
                  onClick={() => setSelectedStateName(null)}
                  className="border-white/15 text-slate-200 hover:bg-white/5 text-xs"
                >
                  All States
                </Button>

                <div className="h-5 w-px bg-white/10" />

                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-slate-100">{activeState.state}</h2>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        ALERT_BADGE_STYLES[activeState.alertLevel].bg
                      } ${ALERT_BADGE_STYLES[activeState.alertLevel].text} ${
                        ALERT_BADGE_STYLES[activeState.alertLevel].border
                      }`}
                    >
                      {activeState.alertLevel.toUpperCase()} ALERT
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {activeState.region} · Monitoring {activeState.localities.length} Local Jurisdictions
                  </p>
                </div>
              </div>

              {/* State Bulletin Text */}
              <div className="text-xs max-w-md text-slate-300 bg-white/4 p-2.5 rounded-lg border border-white/6">
                <span className="font-bold text-blue-400">Active IMD Bulletin: </span>
                {activeState.activeBulletin}
              </div>
            </div>

            {/* Filter Tabs & Locality Search */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 p-1 bg-[#0D1828] border border-white/8 rounded-xl overflow-x-auto">
                <button
                  onClick={() => setLocalityFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    localityFilter === 'all'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  All Localities ({activeState.localities.length})
                </button>

                <button
                  onClick={() => setLocalityFilter('city')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    localityFilter === 'city'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  🏙️ Major Cities ({activeState.citiesCount})
                </button>

                <button
                  onClick={() => setLocalityFilter('town')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    localityFilter === 'town'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  🏘️ Towns ({activeState.townsCount})
                </button>

                <button
                  onClick={() => setLocalityFilter('village')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    localityFilter === 'village'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  🌾 Coastal Villages ({activeState.villagesCount})
                </button>
              </div>

              {/* Instant Search in State */}
              <div className="w-full md:w-80">
                <SearchInput
                  placeholder={`Search in ${activeState.state} (e.g. Visakhapatnam, Bapatla)...`}
                  value={localitySearch}
                  onChange={(e) => setLocalitySearch(e.target.value)}
                />
              </div>
            </div>

            {/* Localities Grid */}
            {filteredLocalities.length === 0 ? (
              <div className="p-8 text-center bg-[#0D1828] border border-white/8 rounded-xl">
                <AlertTriangle size={32} className="text-amber-400 mx-auto mb-2" />
                <p className="text-sm font-semibold text-slate-200">No localities found</p>
                <p className="text-xs text-slate-500 mt-1">
                  Adjust your search filter or select another locality category.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredLocalities.map((loc, idx) => {
                  const typeStyle = LOCALITY_TYPE_STYLES[loc.type];
                  const alertStyle = ALERT_BADGE_STYLES[loc.alertLevel];

                  return (
                    <motion.div
                      key={loc.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(idx * 0.03, 0.2) }}
                      className="bg-[#0D1828] border border-white/8 rounded-xl p-4 space-y-3 shadow-lg hover:border-white/20 transition-all flex flex-col justify-between"
                    >
                      <div>
                        {/* Locality Header */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="text-base font-bold text-slate-100">{loc.name}</h4>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${typeStyle.bg} ${typeStyle.color} ${typeStyle.border}`}
                              >
                                {typeStyle.label}
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5">
                              <MapPin size={11} className="text-slate-500" />
                              <span>{loc.district} District · {loc.state}</span>
                            </div>
                          </div>

                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border flex-shrink-0 ${alertStyle.bg} ${alertStyle.text} ${alertStyle.border}`}
                          >
                            {loc.alertLevel}
                          </span>
                        </div>

                        {/* Condition Label */}
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-white/4 border border-white/6 my-2.5">
                          {getWeatherConditionIcon(loc.condition, 18)}
                          <span className="text-xs font-semibold text-slate-200">{loc.conditionLabel}</span>
                        </div>

                        {/* Meteorological Grid */}
                        <div className="grid grid-cols-4 gap-2 text-xs py-1 text-center">
                          <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
                            <span className="text-[10px] text-slate-500 block mb-0.5">Temp</span>
                            <span className="text-sm font-bold text-slate-100 tabular-nums">{loc.temperature}°C</span>
                            <span className="text-[9px] text-slate-500 block mt-0.5">Feels {loc.feelsLike}°</span>
                          </div>

                          <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
                            <span className="text-[10px] text-slate-500 block mb-0.5">Humidity</span>
                            <span className="text-sm font-bold text-blue-400 tabular-nums">{loc.humidity}%</span>
                            <span className="text-[9px] text-slate-500 block mt-0.5">Moisture</span>
                          </div>

                          <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
                            <span className="text-[10px] text-slate-500 block mb-0.5">Wind</span>
                            <span className="text-sm font-bold text-cyan-400 tabular-nums">{loc.windSpeed}</span>
                            <span className="text-[9px] text-slate-500 block mt-0.5">{loc.windDirection} km/h</span>
                          </div>

                          <div className="p-2 rounded-lg bg-white/[0.02] border border-white/5">
                            <span className="text-[10px] text-slate-500 block mb-0.5">24h Rain</span>
                            <span className={`text-sm font-bold tabular-nums ${loc.rainfall24h > 100 ? 'text-red-400' : loc.rainfall24h > 50 ? 'text-amber-400' : 'text-slate-100'}`}>
                              {loc.rainfall24h}
                            </span>
                            <span className="text-[9px] text-slate-500 block mt-0.5">mm</span>
                          </div>
                        </div>

                        {/* Barometric Pressure & Gusts */}
                        <div className="flex items-center justify-between text-xs text-slate-400 pt-2 border-t border-white/5">
                          <span>Pressure: <strong className="text-slate-300 tabular-nums">{loc.pressure} hPa</strong></span>
                          <span>Peak Gust: <strong className="text-amber-400 tabular-nums">{loc.windGust} km/h</strong></span>
                        </div>

                        {/* Specific Risk Note if present */}
                        {loc.riskNotes && (
                          <div className="mt-2.5 p-2 rounded-lg bg-red-500/10 border border-red-500/20 text-xs text-red-300 flex items-start gap-1.5">
                            <AlertTriangle size={13} className="text-red-400 flex-shrink-0 mt-0.5" />
                            <span>{loc.riskNotes}</span>
                          </div>
                        )}
                      </div>

                      {/* Locality Footer */}
                      <div className="pt-2.5 border-t border-white/5 flex items-center justify-between text-xs text-slate-500">
                        <span className="font-mono text-[10px]">
                          {loc.coordinates.lat.toFixed(4)}, {loc.coordinates.lng.toFixed(4)}
                        </span>
                        <button
                          onClick={() => navigate('/maps')}
                          className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
                        >
                          Locate on Map →
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ─── River Basin Inundation & Meteorological Warning Radar ─── */}
        <div className="pt-4 border-t border-white/10 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Waves size={15} className="text-blue-400" />
              Major River Basin Gauge Levels & Inundation Watch
            </h3>
            <span className="text-xs text-slate-500">Central Water Commission (CWC) Feeds</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {[
              {
                river: 'Godavari River',
                barrage: 'Dowleswaram Barrage (Rajahmundry)',
                state: 'Andhra Pradesh',
                currentLevel: '14.80 m',
                dangerLevel: '14.00 m',
                warningLevel: '13.00 m',
                status: 'Danger Threshold Exceeded',
                statusColor: 'text-red-400 bg-red-500/10 border-red-500/30',
                discharge: '14.2 Lakh Cusecs',
              },
              {
                river: 'Krishna River',
                barrage: 'Prakasam Barrage (Vijayawada)',
                state: 'Andhra Pradesh',
                currentLevel: '11.50 m',
                dangerLevel: '12.00 m',
                warningLevel: '10.50 m',
                status: 'First Warning Active',
                statusColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
                discharge: '2.8 Lakh Cusecs',
              },
              {
                river: 'Mahanadi River',
                barrage: 'Naraj Barrage (Cuttack)',
                state: 'Odisha',
                currentLevel: '26.10 m',
                dangerLevel: '26.41 m',
                warningLevel: '25.41 m',
                status: 'Surcharge Warning',
                statusColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
                discharge: '6.5 Lakh Cusecs',
              },
              {
                river: 'Beas River',
                barrage: 'Pandoh Dam (Mandi / Kullu)',
                state: 'Himachal Pradesh',
                currentLevel: '2,045 ft',
                dangerLevel: '2,050 ft',
                warningLevel: '2,035 ft',
                status: 'Regulated Spillway Release',
                statusColor: 'text-blue-400 bg-blue-500/10 border-blue-500/30',
                discharge: '45,000 Cusecs',
              },
            ].map((river) => (
              <div key={river.river} className="bg-[#0D1828] border border-white/8 rounded-xl p-4 space-y-2 shadow-md">
                <div className="flex items-start justify-between gap-1">
                  <div>
                    <h4 className="text-sm font-bold text-slate-100">{river.river}</h4>
                    <p className="text-xs text-slate-400">{river.barrage}</p>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${river.statusColor}`}>
                    {river.status}
                  </span>
                </div>

                <div className="pt-2 border-t border-white/5 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 block">Gauge Level</span>
                    <strong className="text-sm font-bold text-slate-200 tabular-nums">{river.currentLevel}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 block">Discharge Rate</span>
                    <strong className="text-sm font-bold text-blue-300 tabular-nums">{river.discharge}</strong>
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                  <span>Warning: {river.warningLevel}</span>
                  <span className="text-red-400 font-medium">Danger: {river.dangerLevel}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

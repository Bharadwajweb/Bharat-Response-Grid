import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Activity,
  Globe,
  RefreshCw,
  Info,
  MapPin,
  ExternalLink,
} from 'lucide-react';
import { fetchLiveEarthquakesApi } from '../utils/api';
import type { EarthquakeEvent } from '../types';
import { Button } from '../components/ui/Button';

export const EarthquakeIntelligencePage: React.FC = () => {
  const [minMagnitude, setMinMagnitude] = useState<number>(2.5);
  const [events, setEvents] = useState<EarthquakeEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [source, setSource] = useState<'LIVE' | 'CACHED' | 'OFFLINE'>('LIVE');
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [selectedEvent, setSelectedEvent] = useState<EarthquakeEvent | null>(null);
  const [disclaimerText, setDisclaimerText] = useState<string>('');

  const loadEarthquakes = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchLiveEarthquakesApi(minMagnitude);
      setEvents(res.events);
      setSource(res.source);
      setLastUpdated(res.lastUpdated);
      setDisclaimerText(res.disclaimer);
      if (res.events.length > 0) {
        setSelectedEvent((prev) => prev ?? res.events[0]);
      }
    } catch (err) {
      console.error('Failed to load earthquakes', err);
      setSource('OFFLINE');
    } finally {
      setLoading(false);
    }
  }, [minMagnitude]);

  useEffect(() => {
    let active = true;
    fetchLiveEarthquakesApi(minMagnitude)
      .then((res) => {
        if (!active) return;
        setEvents(res.events);
        setSource(res.source);
        setLastUpdated(res.lastUpdated);
        setDisclaimerText(res.disclaimer);
        if (res.events.length > 0) {
          setSelectedEvent((prev) => prev ?? res.events[0]);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load earthquakes', err);
        if (active) {
          setSource('OFFLINE');
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [minMagnitude]);

  // Statistics
  const stats = useMemo(() => {
    const total = events.length;
    const maxMag = events.length > 0 ? Math.max(...events.map((e) => e.magnitude)) : 0;
    const shallowCount = events.filter((e) => e.depthKm <= 35).length;
    const deepCount = events.filter((e) => e.depthKm > 70).length;
    return { total, maxMag, shallowCount, deepCount };
  }, [events]);

  const getMagColor = (mag: number) => {
    if (mag >= 6.0) return 'text-red-400 bg-red-500/15 border-red-500/30';
    if (mag >= 4.5) return 'text-amber-400 bg-amber-500/15 border-amber-500/30';
    if (mag >= 3.5) return 'text-yellow-400 bg-yellow-500/15 border-yellow-500/30';
    return 'text-blue-400 bg-blue-500/15 border-blue-500/30';
  };

  return (
    <div className="flex flex-col min-h-full bg-[#07111F] text-slate-100 p-4 sm:p-6 space-y-6 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/8 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Activity size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold tracking-tight text-white">Real-Time Earthquake Observations</h1>
                <span
                  className={`text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                    source === 'LIVE'
                      ? 'bg-green-500/15 text-green-400 border border-green-500/30'
                      : source === 'CACHED'
                      ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                      : 'bg-red-500/15 text-red-400 border border-red-500/30'
                  }`}
                >
                  ● {source} TELEMETRY
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                USGS Global Seismographic Network telemetry & South Asia seismic corridor monitoring
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-xs text-slate-400">
              Updated {new Date(lastUpdated).toLocaleTimeString('en-IN', { hour12: false })} IST
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={loadEarthquakes}
            disabled={loading}
            className="border-white/12 text-xs hover:bg-white/5"
            icon={<RefreshCw size={13} className={loading ? 'animate-spin' : ''} />}
          >
            Refresh Feed
          </Button>
        </div>
      </div>

      {/* Mandatory Scientific Disclaimer Banner */}
      <div className="p-3.5 bg-blue-950/20 border border-blue-500/30 rounded-xl flex items-start gap-3">
        <Info size={18} className="text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-slate-300 leading-relaxed">
          <strong className="text-blue-300 font-semibold">Important Scientific Transparency Notice: </strong>
          {disclaimerText ||
            'Earthquakes cannot be predicted by any scientific agency or AI model. BRG visualizes real-time seismic observations recorded by the USGS Global Seismographic Network. Impact radii represent empirical ground-motion attenuation estimates for emergency decision support.'}
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="bg-[#0D1828] border border-white/8 rounded-xl p-4">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Observed Events (24h)</span>
          <div className="text-2xl font-bold text-white font-mono mt-1">{stats.total}</div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Feed: M{minMagnitude}+</span>
        </div>

        <div className="bg-[#0D1828] border border-white/8 rounded-xl p-4">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Maximum Magnitude</span>
          <div className="text-2xl font-bold text-amber-400 font-mono mt-1">M {stats.maxMag.toFixed(1)}</div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Recorded peak</span>
        </div>

        <div className="bg-[#0D1828] border border-white/8 rounded-xl p-4">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Shallow Crustal (&lt;35km)</span>
          <div className="text-2xl font-bold text-cyan-400 font-mono mt-1">{stats.shallowCount}</div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Higher surface shaking</span>
        </div>

        <div className="bg-[#0D1828] border border-white/8 rounded-xl p-4">
          <span className="text-[11px] text-slate-400 uppercase tracking-wider block">Deep Focus (&gt;70km)</span>
          <div className="text-2xl font-bold text-purple-400 font-mono mt-1">{stats.deepCount}</div>
          <span className="text-[11px] text-slate-500 mt-0.5 block">Mantle subduction zones</span>
        </div>
      </div>

      {/* Main Grid: Left Event Table + Right Detail & Impact Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Event List (2 cols) */}
        <div className="lg:col-span-2 bg-[#0D1828] border border-white/8 rounded-xl overflow-hidden flex flex-col">
          {/* Filter Bar */}
          <div className="p-4 border-b border-white/6 flex items-center justify-between gap-3 flex-wrap">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Globe size={14} className="text-blue-400" />
              <span>Seismic Telemetry Feed</span>
            </span>

            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-400">Min Magnitude:</span>
              {[2.5, 4.0, 5.0].map((val) => (
                <button
                  key={val}
                  onClick={() => setMinMagnitude(val)}
                  className={`px-2.5 py-1 rounded font-mono text-xs transition-colors ${
                    minMagnitude === val
                      ? 'bg-blue-600 text-white font-bold'
                      : 'bg-[#132238] text-slate-400 hover:text-slate-200'
                  }`}
                >
                  M{val}+
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto divide-y divide-white/5 flex-1">
            {events.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-500">
                {loading ? 'Ingesting USGS seismic feeds...' : 'No earthquakes observed matching selected filters'}
              </div>
            ) : (
              events.map((evt) => {
                const isSelected = selectedEvent?.id === evt.id;
                return (
                  <div
                    key={evt.id}
                    onClick={() => setSelectedEvent(evt)}
                    className={`p-3.5 hover:bg-white/[0.03] transition-colors cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected ? 'bg-blue-500/10 border-l-2 border-blue-500' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-12 h-10 rounded-lg flex items-center justify-center font-mono font-extrabold text-sm border flex-shrink-0 ${getMagColor(
                          evt.magnitude
                        )}`}
                      >
                        {evt.magnitude.toFixed(1)}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-white truncate">{evt.place}</p>
                        <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-0.5">
                          <span>Depth: {evt.depthKm} km</span>
                          <span>·</span>
                          <span>
                            {evt.latitude.toFixed(2)}°, {evt.longitude.toFixed(2)}°
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="text-right flex-shrink-0 text-xs">
                      <span className="text-slate-400 block font-mono">
                        {new Date(evt.time).toLocaleTimeString('en-IN', { hour12: false })}
                      </span>
                      <span className="text-[10px] text-slate-500 block">
                        {new Date(evt.time).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Selected Event Inspector */}
        <div className="space-y-5">
          {selectedEvent ? (
            <div className="bg-[#0D1828] border border-white/8 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-white/6 pb-3">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Event Observation Details
                </span>
                <span className="text-xs font-mono text-slate-500">{selectedEvent.id}</span>
              </div>

              <div>
                <div
                  className={`inline-block px-3 py-1 rounded-lg text-lg font-bold font-mono border mb-2 ${getMagColor(
                    selectedEvent.magnitude
                  )}`}
                >
                  Magnitude {selectedEvent.magnitude.toFixed(1)}
                </div>
                <h3 className="text-sm font-bold text-white">{selectedEvent.place}</h3>
                <p className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
                  <MapPin size={13} className="text-slate-500" />
                  <span>
                    Lat: {selectedEvent.latitude.toFixed(4)}°, Lng: {selectedEvent.longitude.toFixed(4)}°
                  </span>
                </p>
              </div>

              <div className="space-y-2 pt-2 text-xs border-t border-white/6">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Focal Depth</span>
                  <span className="text-white font-mono font-semibold">{selectedEvent.depthKm} km</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Telemetry Source</span>
                  <span className="text-slate-300">{selectedEvent.source}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Tsunami Advisory</span>
                  <span className={selectedEvent.tsunami ? 'text-red-400 font-bold' : 'text-slate-400'}>
                    {selectedEvent.tsunami ? 'TSUNAMI THREAT MONITORED' : 'No Tsunami Risk Recorded'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Timestamp</span>
                  <span className="text-slate-300 font-mono">
                    {new Date(selectedEvent.time).toISOString().replace('T', ' ').substring(0, 19)} UTC
                  </span>
                </div>
              </div>

              {/* Modeled Impact Estimation (Notice: Clearly labeled) */}
              <div className="bg-[#132238] p-3.5 rounded-lg border border-white/6 space-y-2">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider block">
                  Model-Estimated Intensity Buffer
                </span>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Estimated perceptible shaking radius:{' '}
                  <strong className="text-white">
                    {Math.round(Math.pow(10, 0.43 * selectedEvent.magnitude))} km
                  </strong>{' '}
                  from epicenter based on Gutenberg-Richter attenuation curves.
                </p>
                <div className="text-[11px] text-slate-500 italic">
                  * Algorithmic decision buffer for district EOC dispatch. Not an official earthquake intensity map.
                </div>
              </div>

              <div className="pt-2">
                <a
                  href={selectedEvent.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium text-slate-200 border border-white/10 transition-colors"
                >
                  <span>View on USGS Official Repository</span>
                  <ExternalLink size={13} />
                </a>
              </div>
            </div>
          ) : (
            <div className="bg-[#0D1828] border border-white/8 rounded-xl p-8 text-center text-xs text-slate-500">
              Select an earthquake event from the list to view focal depth and attenuation radius.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

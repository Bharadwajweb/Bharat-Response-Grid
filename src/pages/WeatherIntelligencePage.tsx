import { useState } from 'react';
import useSWR from 'swr';
import { Activity, CloudRain, MapPin, RefreshCw, Wind, Waves } from 'lucide-react';
import { brgApi, type EarthquakeRecord, type WeatherDay, type WeatherHour, type WeatherPayload } from '../services/brgApi';

type Place = { id: string; label: string; state: string; latitude: number; longitude: number };

const places: Place[] = [
  { id: 'india-reference', label: 'India reference point', state: 'National model grid', latitude: 22.9734, longitude: 78.6569 },
  { id: 'delhi', label: 'Delhi', state: 'NCT of Delhi', latitude: 28.6139, longitude: 77.209 },
  { id: 'mumbai', label: 'Mumbai', state: 'Maharashtra', latitude: 19.076, longitude: 72.8777 },
  { id: 'chennai', label: 'Chennai', state: 'Tamil Nadu', latitude: 13.0827, longitude: 80.2707 },
  { id: 'kolkata', label: 'Kolkata', state: 'West Bengal', latitude: 22.5726, longitude: 88.3639 },
  { id: 'bengaluru', label: 'Bengaluru', state: 'Karnataka', latitude: 12.9716, longitude: 77.5946 },
  { id: 'hyderabad', label: 'Hyderabad', state: 'Telangana', latitude: 17.385, longitude: 78.4867 },
  { id: 'guwahati', label: 'Guwahati', state: 'Assam', latitude: 26.1445, longitude: 91.7362 },
  { id: 'srinagar', label: 'Srinagar', state: 'Jammu and Kashmir', latitude: 34.0837, longitude: 74.7973 },
];

function metric(value: number | null | undefined, suffix: string, fractionDigits = 0) {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  return `${new Intl.NumberFormat('en-IN', { maximumFractionDigits: fractionDigits }).format(value)}${suffix}`;
}

function dateTime(value: string | null | undefined) {
  if (!value) return 'Timestamp unavailable';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Timestamp unavailable' : date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

function sourceTone(status: string | undefined) {
  if (status === 'LIVE') return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300';
  if (status === 'CACHED' || status === 'DEGRADED') return 'border-amber-500/30 bg-amber-500/10 text-amber-200';
  if (status === 'OFFLINE' || status === 'ERROR') return 'border-rose-500/30 bg-rose-500/10 text-rose-300';
  return 'border-slate-500/30 bg-slate-500/10 text-slate-300';
}

function WeatherMetric({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Wind }) {
  return (
    <article className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.14em] text-slate-500"><Icon size={14} />{label}</div>
      <p className="mt-3 text-2xl font-semibold tabular-nums text-slate-100">{value}</p>
    </article>
  );
}

function HourlyRows({ rows }: { rows: WeatherHour[] }) {
  if (!rows.length) return <p className="py-6 text-sm text-slate-500">Hourly forecast is not available from the current response.</p>;
  return (
    <div className="divide-y divide-slate-800/80">
      {rows.slice(0, 8).map((row) => (
        <div key={row.time} className="grid grid-cols-4 items-center gap-3 py-3 text-sm">
          <span className="text-slate-400">{new Date(row.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
          <span className="text-slate-100">{metric(row.temperature, '°')}</span>
          <span className="text-sky-300">{metric(row.rainProbability, '%')}</span>
          <span className="text-slate-300">{metric(row.windKph, ' km/h')}</span>
        </div>
      ))}
    </div>
  );
}

function DailyRows({ rows }: { rows: WeatherDay[] }) {
  if (!rows.length) return <p className="py-6 text-sm text-slate-500">Daily forecast is not available from the current response.</p>;
  return (
    <div className="divide-y divide-slate-800/80">
      {rows.slice(0, 7).map((row) => (
        <div key={row.date} className="grid grid-cols-4 items-center gap-3 py-3 text-sm">
          <span className="text-slate-400">{new Date(`${row.date}T12:00:00`).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' })}</span>
          <span className="text-slate-100">{metric(row.highC, '°')}</span>
          <span className="text-slate-400">{metric(row.lowC, '°')}</span>
          <span className="text-sky-300">{metric(row.rainfallMm, ' mm')}</span>
        </div>
      ))}
    </div>
  );
}

export const WeatherIntelligencePage = () => {
  const [placeId, setPlaceId] = useState(places[0].id);
  const place = places.find((item) => item.id === placeId) ?? places[0];
  const weatherKey = `weather:${place.id}`;
  const weatherQuery = useSWR(weatherKey, () => brgApi.weather(place.latitude, place.longitude), {
    refreshInterval: 300_000,
    revalidateOnFocus: true,
    shouldRetryOnError: false,
  });
  const quakeQuery = useSWR('earthquakes:india', () => brgApi.earthquakes(), {
    refreshInterval: 300_000,
    revalidateOnFocus: true,
    shouldRetryOnError: false,
  });

  const snapshot = weatherQuery.data;
  const weather = snapshot?.data as WeatherPayload | null | undefined;
  const quakes = (quakeQuery.data?.data ?? []) as EarthquakeRecord[];
  const quakeStatus = quakeQuery.data?.status ?? 'OFFLINE';

  return (
    <div className="space-y-6 p-4 md:p-6">
      <header className="flex flex-col justify-between gap-4 border-b border-slate-800 pb-5 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-sky-300"><CloudRain size={14} /> Weather intelligence</div>
          <h1 className="mt-2 text-2xl font-semibold text-white md:text-3xl">Weather and seismic feeds</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">Source-labelled observations and forecasts. No state-wide values are inferred from a single model grid point.</p>
        </div>
        <label className="flex min-w-64 flex-col gap-1.5 text-xs text-slate-400">
          <span>Modelled grid point</span>
          <select value={placeId} onChange={(event) => setPlaceId(event.target.value)} className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-slate-100 outline-none focus:border-sky-400">
            {places.map((item) => <option key={item.id} value={item.id}>{item.label} · {item.state}</option>)}
          </select>
        </label>
      </header>

      <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-900/70 px-4 py-3" aria-live="polite">
        <div className="flex items-center gap-3">
          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-[0.16em] ${sourceTone(snapshot?.status)}`}>{snapshot?.status ?? (weatherQuery.isLoading ? 'LOADING' : 'OFFLINE')}</span>
          <span className="text-sm text-slate-300">{snapshot?.source ?? 'Open-Meteo'}</span>
          <span className="hidden text-xs text-slate-500 sm:inline">{place.label} · {place.latitude.toFixed(3)}, {place.longitude.toFixed(3)}</span>
        </div>
        <button type="button" onClick={() => void weatherQuery.mutate()} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400" aria-label="Refresh weather feed">
          <RefreshCw size={13} className={weatherQuery.isValidating ? 'animate-spin' : ''} /> Refresh
        </button>
      </section>

      {snapshot?.fallbackReason && <p className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-200">{snapshot.fallbackReason}</p>}

      <section aria-label="Current weather" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <WeatherMetric label="Temperature" value={metric(weather?.temperature, '°C', 1)} icon={Activity} />
        <WeatherMetric label="Relative humidity" value={metric(weather?.humidity, '%')} icon={Waves} />
        <WeatherMetric label="Wind speed" value={metric(weather?.windKph, ' km/h', 1)} icon={Wind} />
        <WeatherMetric label="Precipitation" value={metric(weather?.rainfallMm, ' mm', 1)} icon={CloudRain} />
      </section>

      <p className="text-xs leading-5 text-slate-500">Forecast values are Open-Meteo model output at the selected coordinates, not official IMD warnings or ground-station measurements. Confirm response decisions with authorized bulletins.</p>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 md:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-white">Next hours</h2>
              <p className="mt-1 text-xs text-slate-500">Temperature · rain probability · wind</p>
            </div>
            <span className="text-right text-xs text-slate-500">Updated<br />{dateTime(weather?.observedAt)}</span>
          </div>
          <div className="mt-3 grid grid-cols-4 border-b border-slate-800 pb-2 text-[10px] uppercase tracking-wider text-slate-500"><span>Time</span><span>Temp</span><span>Rain</span><span>Wind</span></div>
          <HourlyRows rows={weather?.hourly ?? []} />
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 md:p-5">
          <h2 className="text-base font-semibold text-white">7-day model outlook</h2>
          <p className="mt-1 text-xs text-slate-500">Daily high / low and precipitation</p>
          <div className="mt-4 grid grid-cols-4 border-b border-slate-800 pb-2 text-[10px] uppercase tracking-wider text-slate-500"><span>Day</span><span>High</span><span>Low</span><span>Rain</span></div>
          <DailyRows rows={weather?.daily ?? []} />
        </section>
      </div>

      <section className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 md:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2"><Activity size={16} className="text-amber-300" /><h2 className="text-base font-semibold text-white">Recent earthquakes · India region</h2></div>
            <p className="mt-1 text-xs text-slate-500">USGS ComCat feed · events are shown only when returned by the source.</p>
          </div>
          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-[0.16em] ${sourceTone(quakeStatus)}`}>{quakeStatus}</span>
        </div>
        {quakes.length ? (
          <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-3">
            {quakes.slice(0, 6).map((quake) => (
              <article key={quake.id} className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
                <div className="flex items-center justify-between gap-2"><strong className="text-sm text-amber-200">M{metric(quake.magnitude, '', 1)}</strong><span className="text-xs text-slate-500">{dateTime(quake.occurredAt)}</span></div>
                <p className="mt-2 text-sm text-slate-200">{quake.place}</p>
                <p className="mt-1 text-xs text-slate-500">Depth {metric(quake.depthKm, ' km', 1)} · {quake.latitude.toFixed(2)}, {quake.longitude.toFixed(2)}</p>
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-lg border border-dashed border-slate-800 px-4 py-8 text-center text-sm text-slate-500">
            {quakeQuery.isLoading ? 'Checking the USGS feed…' : 'No earthquake records are available from the current feed or cache.'}
          </div>
        )}
      </section>

      <footer className="flex items-start gap-2 border-t border-slate-800 pt-4 text-xs text-slate-500"><MapPin size={14} className="mt-0.5 shrink-0" /><p>Coordinates describe the provider grid point, not a district or state-wide average. No value is shown when a source or cache has no usable data.</p></footer>
    </div>
  );
};

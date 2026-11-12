import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { GeoJSON, MapContainer, TileLayer, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import { Layers3, MapPin, RefreshCw } from 'lucide-react';
import { brgApi, type MapFeatureCollection } from '../services/brgApi';
import { useAppStore } from '../store/appStore';
import 'leaflet/dist/leaflet.css';

type MapProperties = Record<string, unknown> & { kind?: string; title?: string; severity?: string; status?: string; source?: string };
type BrgFeatureCollection = FeatureCollection<Geometry, MapProperties>;

const layerKinds = [
  { id: 'incident', label: 'Incidents', color: '#ef4444' },
  { id: 'shelter', label: 'Shelters', color: '#22c55e' },
  { id: 'resource', label: 'Resources', color: '#38bdf8' },
  { id: 'earthquake', label: 'Earthquakes', color: '#f59e0b' },
  { id: 'risk_zone', label: 'Risk zones', color: '#a78bfa' },
];

function featureColor(kind: string | undefined) {
  return layerKinds.find((item) => item.id === kind)?.color ?? '#94a3b8';
}

function safePopup(feature: Feature<Geometry, MapProperties>, layer: L.Layer) {
  const properties = feature.properties ?? {};
  const container = document.createElement('div');
  const heading = document.createElement('strong');
  heading.textContent = String(properties.title ?? properties.kind ?? 'Map feature');
  container.appendChild(heading);
  for (const [label, value] of Object.entries(properties)) {
    if (['title', 'kind', 'geometry'].includes(label) || value === null || value === undefined || typeof value === 'object') continue;
    const row = document.createElement('p');
    row.textContent = `${label.replaceAll('_', ' ')}: ${String(value)}`;
    container.appendChild(row);
  }
  layer.bindPopup(container);
}

export const MapsTrackingPage = () => {
  const [enabledLayers, setEnabledLayers] = useState<Set<string>>(() => new Set(layerKinds.map((layer) => layer.id)));
  const connectionStatus = useAppStore((state) => state.connectionStatus);
  const { data: envelope, isLoading, isValidating, mutate } = useSWR('map-features', () => brgApi.mapFeatures(), {
    refreshInterval: 30_000,
    revalidateOnFocus: true,
    shouldRetryOnError: false,
  });
  const collection = (envelope?.data ?? { type: 'FeatureCollection', features: [] }) as MapFeatureCollection;
  const mapData = useMemo<BrgFeatureCollection>(() => ({
    type: 'FeatureCollection',
    features: collection.features.filter((feature) => enabledLayers.has(String(feature.properties.kind))) as BrgFeatureCollection['features'],
  }), [collection, enabledLayers]);

  useEffect(() => {
    const refresh = () => { void mutate(); };
    window.addEventListener('brg:realtime', refresh);
    return () => window.removeEventListener('brg:realtime', refresh);
  }, [mutate]);

  const counts = useMemo(() => layerKinds.map((layer) => ({
    ...layer,
    count: collection.features.filter((feature) => feature.properties.kind === layer.id).length,
  })), [collection]);

  const toggleLayer = (id: string) => {
    setEnabledLayers((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="space-y-5 p-4 md:p-6">
      <header className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-sky-300"><MapPin size={14} /> Operations map</div>
          <h1 className="mt-2 text-2xl font-semibold text-white md:text-3xl">Verified map layers</h1>
          <p className="mt-2 text-sm text-slate-400">Only records returned by the BRG API are plotted. Map tiles provide geographic context, not operational status.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold tracking-[0.14em] ${envelope?.status === 'LIVE' ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300' : envelope?.status === 'CACHED' ? 'border-amber-500/30 bg-amber-500/10 text-amber-200' : 'border-rose-500/30 bg-rose-500/10 text-rose-300'}`}>{envelope?.status ?? (isLoading ? 'LOADING' : 'OFFLINE')}</span>
          <button type="button" onClick={() => void mutate()} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-300 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400"><RefreshCw size={13} className={isValidating ? 'animate-spin' : ''} /> Refresh</button>
        </div>
      </header>

      {envelope?.fallbackReason && <p role="status" className="rounded-lg border border-amber-500/20 bg-amber-500/5 px-4 py-3 text-sm text-amber-200">{envelope.fallbackReason}</p>}

      <section className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5" aria-label="Map layer filters">
        {counts.map((layer) => (
          <button key={layer.id} type="button" onClick={() => toggleLayer(layer.id)} aria-pressed={enabledLayers.has(layer.id)} className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-left text-xs transition-colors focus:outline-none focus:ring-2 focus:ring-sky-400 ${enabledLayers.has(layer.id) ? 'border-slate-700 bg-slate-900 text-slate-100' : 'border-slate-800 bg-slate-950 text-slate-500'}`}>
            <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: layer.color }} />{layer.label}</span>
            <span className="font-mono tabular-nums">{layer.count}</span>
          </button>
        ))}
      </section>

      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950">
        <MapContainer center={[22.9734, 78.6569]} zoom={5} zoomControl={false} className="h-[460px] w-full md:h-[560px]" scrollWheelZoom>
          <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          <ZoomControl position="bottomright" />
          {mapData.features.length > 0 && (
            <GeoJSON
              key={`${envelope?.updatedAt ?? 'map'}-${enabledLayers.size}`}
              data={mapData}
              pointToLayer={(feature, latlng) => L.circleMarker(latlng, {
                radius: feature.properties?.kind === 'earthquake' ? 8 : 7,
                color: featureColor(String(feature.properties?.kind ?? '')),
                weight: 2,
                fillColor: featureColor(String(feature.properties?.kind ?? '')),
                fillOpacity: 0.75,
              })}
              style={(feature) => ({ color: featureColor(String(feature?.properties?.kind ?? '')), weight: 2, fillOpacity: 0.2 })}
              onEachFeature={safePopup}
            />
          )}
        </MapContainer>
        {collection.features.length === 0 && (
          <div className="border-t border-slate-800 px-4 py-3 text-sm text-slate-400" role="status">
            {isLoading ? 'Loading map records…' : 'No operational records are available from the API or cache.'}
          </div>
        )}
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span className="inline-flex items-center gap-2"><Layers3 size={14} /> {collection.features.length} records returned by source</span>
        <span>Realtime transport: {connectionStatus === 'connected' ? 'connected' : 'disconnected'} · map records refresh when events arrive</span>
      </footer>
    </div>
  );
};

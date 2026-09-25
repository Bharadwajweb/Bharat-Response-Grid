import { useSyncExternalStore } from 'react';
import { brgApi, type DataEnvelope } from './brgApi';

type LiveSnapshot = {
  weather: DataEnvelope<{ temperature: number; humidity: number; windKph: number; rainfallMm: number }> | null;
  earthquakes: DataEnvelope<unknown[]> | null;
  shelters: DataEnvelope<unknown[]> | null;
  lastSync: string | null;
  syncing: boolean;
};

const initialSnapshot: LiveSnapshot = { weather: null, earthquakes: null, shelters: null, lastSync: null, syncing: false };
let snapshot = initialSnapshot;
const listeners = new Set<() => void>();
let timer: ReturnType<typeof setInterval> | undefined;
let loading: Promise<void> | null = null;

function emit() { listeners.forEach((listener) => listener()); }

export async function refreshLiveData() {
  if (loading) return loading;
  snapshot = { ...snapshot, syncing: true };
  emit();
  loading = Promise.all([brgApi.weather(), brgApi.earthquakes(), brgApi.shelters()])
    .then(([weather, earthquakes, shelters]) => {
      snapshot = { weather, earthquakes, shelters, lastSync: new Date().toISOString(), syncing: false };
      emit();
    })
    .catch(() => {
      snapshot = { ...snapshot, syncing: false, lastSync: new Date().toISOString() };
      emit();
    })
    .finally(() => { loading = null; });
  return loading;
}

function ensurePolling() {
  if (timer) return;
  void refreshLiveData();
  timer = setInterval(() => void refreshLiveData(), 60_000);
}

export function subscribeLiveData(listener: () => void) {
  listeners.add(listener);
  ensurePolling();
  return () => {
    listeners.delete(listener);
    if (!listeners.size && timer) {
      clearInterval(timer);
      timer = undefined;
    }
  };
}

export function getLiveDataSnapshot() { return snapshot; }

export function useLiveData() {
  return useSyncExternalStore(subscribeLiveData, getLiveDataSnapshot, getLiveDataSnapshot);
}

export function formatSyncTime(value: string | null) {
  if (!value) return 'Awaiting first sync';
  return new Intl.DateTimeFormat('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }).format(new Date(value));
}

export function statusLabel(status: DataEnvelope<unknown>['status'] | undefined) {
  return status ?? 'SYNCING';
}

export function statusTone(status: DataEnvelope<unknown>['status'] | undefined) {
  if (status === 'LIVE') return 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10';
  if (status === 'CACHED') return 'text-amber-300 border-amber-400/30 bg-amber-400/10';
  if (status === 'OFFLINE') return 'text-red-300 border-red-400/30 bg-red-400/10';
  return 'text-cyan-300 border-cyan-400/30 bg-cyan-400/10';
}

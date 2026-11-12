import React, { useCallback, useEffect } from 'react';
import { Link, Outlet } from 'react-router-dom';
import useSWR from 'swr';
import { Sidebar, MobileSidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';
import { useAppStore } from '../../store/appStore';
import { brgApi, connectToEvents, type SystemStatus } from '../../services/brgApi';
import { getAuthToken } from '../../services/neonAuth';
import { brgSocket } from '../../utils/socket';

const DataModeBanner: React.FC = () => {
  const { data } = useSWR<SystemStatus>('system-status', async () => (await brgApi.systemStatus()).data, {
    refreshInterval: 15_000,
    revalidateOnFocus: true,
    shouldRetryOnError: false,
  });
  const overall = data?.overall ?? 'OFFLINE';
  const style = overall === 'ONLINE'
    ? 'border-emerald-400/20 bg-emerald-400/[0.05] text-emerald-200'
    : overall === 'DEGRADED'
      ? 'border-amber-400/20 bg-amber-400/[0.05] text-amber-100'
      : 'border-rose-400/20 bg-rose-400/[0.05] text-rose-200';
  const message = overall === 'ONLINE'
    ? 'SYSTEM ONLINE · Only LIVE/CACHED source-labelled records are operational; other panels remain prototype context.'
    : overall === 'DEGRADED'
      ? 'SYSTEM DEGRADED · Verify source status; some feeds or operational records are unavailable. Unlabelled dashboard panels are prototype context.'
      : 'BACKEND OFFLINE · Dashboard sample content is not operational data.';

  return (
    <div className={`flex flex-wrap items-center justify-between gap-2 border-b px-4 py-2 text-[10px] font-semibold tracking-wide sm:px-6 ${style}`} role="status" aria-live="polite">
      <span>{message}</span>
      <Link to="/data-sources" className="underline decoration-current/40 underline-offset-2 hover:decoration-current">View source health</Link>
    </div>
  );
};

export const AppShell: React.FC = () => {
  const setConnectionStatus = useAppStore((state) => state.setConnectionStatus);
  const { data: token, mutate: refreshToken } = useSWR('brg-websocket-token', getAuthToken, {
    revalidateOnFocus: true,
    revalidateOnReconnect: true,
    shouldRetryOnError: false,
    dedupingInterval: 3_000,
  });

  const onEvent = useCallback((event: unknown) => {
    if (!event || typeof event !== 'object') return;
    const message = event as { type?: unknown; data?: unknown };
    if (typeof message.type === 'string') {
      brgSocket.emit(message.type, message.data);
      window.dispatchEvent(new CustomEvent('brg:realtime', { detail: event }));
    }
  }, []);

  const onSocketStatus = useCallback((connected: boolean) => {
    setConnectionStatus(connected ? 'connected' : 'disconnected');
    if (!connected) window.setTimeout(() => void refreshToken(), 2_000);
  }, [refreshToken, setConnectionStatus]);

  useEffect(() => {
    if (!token) {
      setConnectionStatus('disconnected');
      return;
    }
    return connectToEvents(token, onEvent, onSocketStatus);
  }, [token, onEvent, onSocketStatus, setConnectionStatus]);

  return (
    <div className="flex h-screen overflow-hidden bg-[#07111F]">
      <Sidebar />
      <MobileSidebar />
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <TopNavbar />
        <DataModeBanner />
        <main className="flex-1 overflow-x-hidden overflow-y-auto" id="main-content" tabIndex={-1}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

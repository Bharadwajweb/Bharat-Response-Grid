import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useSWR, { useSWRConfig } from 'swr';
import { Menu, Bell, Sun, Moon, Globe, ChevronDown, LogOut, User, Settings, Wifi, WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../store/appStore';
import { UserAvatar } from '../ui/Overlay';
import { Badge } from '../ui/Badge';
import { brgApi } from '../../services/brgApi';
import { endAuthSession } from '../../services/authSession';

export const TopNavbar: React.FC = () => {
  const { i18n } = useTranslation();
  const { currentUser, theme, toggleTheme, setLanguage, language, setSidebarMobileOpen, connectionStatus } = useAppStore();
  const navigate = useNavigate();
  const { mutate } = useSWRConfig();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [time, setTime] = useState(new Date());
  const { data: notificationEnvelope, isLoading: notificationsLoading, mutate: refreshNotifications } = useSWR('brg-notifications', brgApi.notifications, {
    refreshInterval: 30_000,
    revalidateOnFocus: true,
    shouldRetryOnError: false,
  });
  const notifications = notificationEnvelope?.data ?? [];
  const notificationCount = notificationEnvelope?.status === 'LIVE'
    ? notifications.filter((item) => !item.readAt).length
    : 0;

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLanguageChange = (lang: 'en' | 'te') => {
    i18n.changeLanguage(lang);
    setLanguage(lang);
    setLangOpen(false);
  };

  const signOut = async () => {
    try { await endAuthSession(); } finally {
      useAppStore.getState().logout();
      await mutate('brg-current-user', undefined, { revalidate: false });
      await mutate('brg-websocket-token', null, { revalidate: false });
      await mutate('brg-notifications', undefined, { revalidate: false });
      navigate('/login', { replace: true });
      setUserMenuOpen(false);
    }
  };

  const connectionIcon = connectionStatus === 'connected'
    ? <Wifi size={13} className="text-emerald-400" />
    : <WifiOff size={13} className="text-slate-500" />;

  return (
    <header className="sticky top-0 z-30 flex h-14 flex-shrink-0 items-center justify-between border-b border-white/8 bg-[#07111F]/95 px-4 backdrop-blur-sm">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => setSidebarMobileOpen(true)} className="rounded p-1.5 text-slate-500 transition-colors hover:bg-white/8 hover:text-slate-300 lg:hidden" aria-label="Open navigation"><Menu size={18} /></button>
        <div className="hidden items-center gap-2 text-xs font-medium tracking-wide sm:flex">
          <span className="font-semibold uppercase tracking-widest text-slate-300">{currentUser?.role?.replaceAll('_', ' ') ?? 'Command workspace'}</span>
          <span className="text-slate-700" aria-hidden="true">·</span>
          <span className="flex items-center gap-1.5" role="status" aria-label={`Realtime events ${connectionStatus}`}>
            {connectionIcon}
            <span className={connectionStatus === 'connected' ? 'text-emerald-300' : 'text-slate-500'}>EVENTS {connectionStatus === 'connected' ? 'CONNECTED' : 'DISCONNECTED'}</span>
          </span>
        </div>
      </div>

      <div className="hidden flex-col items-center md:flex">
        <span className="font-mono-data tabular-nums text-sm font-semibold text-slate-300">{time.toLocaleTimeString('en-IN', { hour12: false })}</span>
        <span className="-mt-0.5 text-xs text-slate-600">{time.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} IST</span>
      </div>

      <div className="flex items-center gap-1">
        <div className="relative">
          <button type="button" onClick={() => setLangOpen((open) => !open)} className="flex items-center gap-1 rounded px-2 py-1.5 text-xs font-medium text-slate-500 transition-colors hover:bg-white/6 hover:text-slate-200" aria-label="Choose language" aria-expanded={langOpen}>
            <Globe size={14} /><span className="hidden uppercase sm:inline">{language}</span>
          </button>
          {langOpen && <div className="absolute right-0 top-full z-50 mt-1 w-32 overflow-hidden rounded-lg border border-white/12 bg-[#132238] shadow-xl">
            {[{ code: 'en', label: 'English' }, { code: 'te', label: 'తెలుగు' }].map((item) => <button type="button" key={item.code} onClick={() => handleLanguageChange(item.code as 'en' | 'te')} className={`w-full px-3 py-2 text-left text-sm transition-colors ${language === item.code ? 'bg-blue-500/10 text-blue-300' : 'text-slate-300 hover:bg-white/6'}`}>{item.label}</button>)}
          </div>}
        </div>

        <button type="button" onClick={toggleTheme} className="rounded p-1.5 text-slate-500 transition-colors hover:bg-white/6 hover:text-slate-200" aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>{theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}</button>

        <div className="relative">
          <button type="button" onClick={() => setNotifOpen((open) => !open)} className="relative rounded p-1.5 text-slate-500 transition-colors hover:bg-white/6 hover:text-slate-200" aria-label={`${notificationCount} unread notifications`} aria-expanded={notifOpen}>
            <Bell size={16} />
            {notificationCount > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[9px] font-bold leading-none text-white">{notificationCount > 9 ? '9+' : notificationCount}</span>}
          </button>
          {notifOpen && <div className="absolute right-0 top-full z-50 mt-1 w-[min(20rem,calc(100vw-2rem))] overflow-hidden rounded-xl border border-white/12 bg-[#132238] shadow-2xl">
            <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
              <span className="text-sm font-semibold text-slate-200">Notifications</span>
              <button type="button" onClick={() => void refreshNotifications()} className="text-xs text-blue-400 hover:text-blue-300">Refresh</button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              {notificationsLoading && <p className="px-4 py-6 text-center text-xs text-slate-500">Checking notification feed…</p>}
              {!notificationsLoading && notifications.length === 0 && <p className="px-4 py-6 text-center text-xs text-slate-500">{notificationEnvelope?.status === 'LIVE' ? 'No notifications recorded.' : 'Notification feed unavailable; no sample notices are shown.'}</p>}
              {notifications.map((item) => <div key={item.id} className="border-b border-white/5 px-4 py-3">
                <p className="text-xs text-slate-300">{item.message}</p>
                <p className="mt-1 text-[10px] text-slate-600">{item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Time unavailable'}</p>
              </div>)}
            </div>
          </div>}
        </div>

        {currentUser && <div className="relative ml-1">
          <button type="button" onClick={() => setUserMenuOpen((open) => !open)} className="flex items-center gap-2 rounded-md px-2 py-1 transition-colors hover:bg-white/6" aria-expanded={userMenuOpen} aria-label="Open account menu">
            <UserAvatar initials={currentUser.avatarInitials} size="xs" online={connectionStatus === 'connected'} />
            <div className="hidden text-left sm:block"><p className="text-xs font-medium leading-none text-slate-300">{currentUser.name.split(' ')[0]}</p></div>
            <ChevronDown size={12} className="hidden text-slate-600 sm:block" />
          </button>
          {userMenuOpen && <div className="absolute right-0 top-full z-50 mt-1 w-52 overflow-hidden rounded-xl border border-white/12 bg-[#132238] shadow-2xl">
            <div className="border-b border-white/8 px-4 py-3">
              <p className="text-sm font-semibold text-slate-200">{currentUser.name}</p><p className="mt-0.5 text-xs text-slate-500">{currentUser.email}</p>
              <Badge variant="primary" size="xs" className="mt-1 capitalize">{currentUser.role.replaceAll('_', ' ')}</Badge>
            </div>
            <div className="p-1">
              {[{ icon: User, label: 'Profile', to: '/profile' }, { icon: Settings, label: 'Settings', to: '/settings' }].map(({ icon: Icon, label, to }) => <button type="button" key={to} onClick={() => { navigate(to); setUserMenuOpen(false); }} className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-white/6 hover:text-slate-200"><Icon size={14} />{label}</button>)}
              <div className="mt-1 border-t border-white/8 pt-1"><button type="button" onClick={() => void signOut()} className="flex w-full items-center gap-2 rounded px-3 py-2 text-sm text-red-400 transition-colors hover:bg-red-500/8 hover:text-red-300"><LogOut size={14} />Sign out</button></div>
            </div>
          </div>}
        </div>}
      </div>
    </header>
  );
};

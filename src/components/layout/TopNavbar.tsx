import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu, Search, Bell, Sun, Moon, Globe, ChevronDown,
  LogOut, User, Settings, Wifi, WifiOff
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../store/appStore';
import { UserAvatar } from '../ui/Overlay';
import { Badge } from '../ui/Badge';

export const TopNavbar: React.FC = () => {
  const { i18n, t } = useTranslation();
  const {
    currentUser, theme, toggleTheme, setLanguage, language,
    setSidebarMobileOpen, connectionStatus, activeCommandLabel, onlineResponders, notificationCount,
  } = useAppStore();
  const navigate = useNavigate();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLanguageChange = (lang: 'en' | 'te') => {
    i18n.changeLanguage(lang);
    setLanguage(lang);
    setLangOpen(false);
  };

  const connectionIcon = connectionStatus === 'connected'
    ? <Wifi size={13} className="text-green-500" />
    : <WifiOff size={13} className="text-red-500 animate-pulse" />;

  return (
    <header className="h-14 flex-shrink-0 flex items-center justify-between px-4 border-b border-white/8 bg-[#07111F]/95 backdrop-blur-sm sticky top-0 z-30">
      {/* Left: Mobile menu + Command info */}
      <div className="flex items-center gap-3">
        {/* Mobile hamburger */}
        <button
          onClick={() => setSidebarMobileOpen(true)}
          className="lg:hidden p-1.5 rounded text-slate-500 hover:text-slate-300 hover:bg-white/8 transition-colors"
          aria-label="Open navigation"
        >
          <Menu size={18} />
        </button>

        {/* Command status strip */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-500 font-medium tracking-wide">
          <span className="text-slate-300 font-semibold uppercase tracking-widest">{activeCommandLabel}</span>
          <span className="text-slate-700">•</span>
          <span className="flex items-center gap-1">
            {connectionIcon}
            <span className={connectionStatus === 'connected' ? 'text-green-400' : 'text-red-400'}>
              {connectionStatus === 'connected' ? 'OPERATIONAL' : connectionStatus.toUpperCase()}
            </span>
          </span>
          <span className="text-slate-700">•</span>
          <span className="text-slate-400">{onlineResponders} RESPONDERS ONLINE</span>
        </div>
      </div>

      {/* Center: Clock */}
      <div className="hidden md:flex flex-col items-center">
        <span className="text-sm font-semibold text-slate-300 font-mono-data tabular-nums">
          {time.toLocaleTimeString('en-IN', { hour12: false })}
        </span>
        <span className="text-xs text-slate-600 -mt-0.5">
          {time.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} IST
        </span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        {/* Language */}
        <div className="relative">
          <button
            onClick={() => setLangOpen(!langOpen)}
            className="flex items-center gap-1 px-2 py-1.5 rounded text-slate-500 hover:text-slate-200 hover:bg-white/6 text-xs font-medium transition-colors"
            aria-label="Language"
          >
            <Globe size={14} />
            <span className="hidden sm:inline uppercase">{language}</span>
          </button>
          {langOpen && (
            <div className="absolute right-0 top-full mt-1 w-32 bg-[#132238] border border-white/12 rounded-lg shadow-xl z-50 overflow-hidden">
              {[{ code: 'en', label: 'English' }, { code: 'te', label: 'తెలుగు' }].map((l) => (
                <button
                  key={l.code}
                  onClick={() => handleLanguageChange(l.code as 'en' | 'te')}
                  className={`w-full text-left px-3 py-2 text-sm transition-colors ${language === l.code ? 'text-blue-400 bg-blue-500/10' : 'text-slate-300 hover:bg-white/6'}`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="p-1.5 rounded text-slate-500 hover:text-slate-200 hover:bg-white/6 transition-colors"
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-1.5 rounded text-slate-500 hover:text-slate-200 hover:bg-white/6 transition-colors"
            aria-label={`${notificationCount} notifications`}
          >
            <Bell size={16} />
            {notificationCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold leading-none">
                {notificationCount > 9 ? '9+' : notificationCount}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-full mt-1 w-80 bg-[#132238] border border-white/12 rounded-xl shadow-2xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between">
                <span className="text-sm font-semibold text-slate-200">Notifications</span>
                <button onClick={() => setNotifOpen(false)} className="text-xs text-blue-400 hover:text-blue-300">Mark all read</button>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {[
                  { id: 1, msg: 'CRITICAL: New flood alert — Adyar, Chennai', time: '2m ago', type: 'critical' },
                  { id: 2, msg: 'Cyclone MICHAUNG tracking update issued', time: '8m ago', type: 'warning' },
                  { id: 3, msg: 'NDRF Bn-6 deployed to INC-2024-001', time: '15m ago', type: 'info' },
                  { id: 4, msg: 'Shelter capacity alert — Saidapet Hall at 99%', time: '22m ago', type: 'warning' },
                  { id: 5, msg: 'New message in National Command room', time: '35m ago', type: 'info' },
                ].map((n) => (
                  <div key={n.id} className="px-4 py-3 border-b border-white/5 hover:bg-white/4 transition-colors">
                    <div className="flex items-start gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${n.type === 'critical' ? 'bg-red-500' : n.type === 'warning' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                      <div>
                        <p className="text-xs text-slate-300">{n.msg}</p>
                        <p className="text-xs text-slate-600 mt-0.5">{n.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User menu */}
        {currentUser && (
          <div className="relative ml-1">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-white/6 transition-colors"
            >
              <UserAvatar initials={currentUser.avatarInitials} size="xs" online />
              <div className="hidden sm:block text-left">
                <p className="text-xs font-medium text-slate-300 leading-none">{currentUser.name.split(' ')[0]}</p>
              </div>
              <ChevronDown size={12} className="text-slate-600 hidden sm:block" />
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-52 bg-[#132238] border border-white/12 rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-white/8">
                  <p className="text-sm font-semibold text-slate-200">{currentUser.name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{currentUser.email}</p>
                  <Badge variant="primary" size="xs" className="mt-1 capitalize">{currentUser.role.replace('_', ' ')}</Badge>
                </div>
                <div className="p-1">
                  {[
                    { icon: User, label: 'Profile', to: '/profile' },
                    { icon: Settings, label: 'Settings', to: '/settings' },
                  ].map(({ icon: Icon, label, to }) => (
                    <button key={to} onClick={() => { navigate(to); setUserMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded text-sm text-slate-400 hover:text-slate-200 hover:bg-white/6 transition-colors">
                      <Icon size={14} />
                      {label}
                    </button>
                  ))}
                  <div className="border-t border-white/8 mt-1 pt-1">
                    <button onClick={() => { useAppStore.getState().logout(); navigate('/login'); setUserMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded text-sm text-red-400 hover:text-red-300 hover:bg-red-500/8 transition-colors">
                      <LogOut size={14} />
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};

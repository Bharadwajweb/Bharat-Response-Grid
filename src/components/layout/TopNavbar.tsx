import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu, Bell, Sun, Moon, Globe, ChevronDown,
  LogOut, User, Settings, Wifi, WifiOff, MapPin, AlertCircle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../store/appStore';
import { UserAvatar } from '../ui/Overlay';
import { Badge } from '../ui/Badge';
import { JURISDICTION_PRESETS } from '../../data/mockData';
import type { JurisdictionScope } from '../../types';

export const TopNavbar: React.FC = () => {
  const { i18n } = useTranslation();
  const {
    currentUser, theme, toggleTheme, setLanguage, language,
    setSidebarMobileOpen, webSocketStatus, activeJurisdiction, setJurisdiction,
    onlineResponders, notificationCount,
  } = useAppStore();
  const navigate = useNavigate();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [scopeMenuOpen, setScopeMenuOpen] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLanguageChange = (lang: 'en' | 'te' | 'hi' | 'ta') => {
    i18n.changeLanguage(lang);
    setLanguage(lang);
    setLangOpen(false);
  };

  const handleSelectJurisdiction = (scope: JurisdictionScope) => {
    setJurisdiction(scope);
    setScopeMenuOpen(false);
  };

  // True WebSocket status rendering (never fake)
  const renderConnectionBadge = () => {
    if (webSocketStatus === 'LIVE') {
      return (
        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/25">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <Wifi size={11} />
          <span>LIVE</span>
        </span>
      );
    }
    if (webSocketStatus === 'CONNECTION DEGRADED') {
      return (
        <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/25">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          <AlertCircle size={11} />
          <span>CONNECTION DEGRADED</span>
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-semibold bg-red-500/10 text-red-400 border border-red-500/25">
        <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
        <WifiOff size={11} />
        <span>OFFLINE</span>
      </span>
    );
  };

  return (
    <header className="h-14 flex-shrink-0 flex items-center justify-between px-3 sm:px-4 border-b border-white/8 bg-[#07111F]/95 backdrop-blur-sm sticky top-0 z-30">
      {/* Left: Mobile menu + Command scope & Demo notice */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          onClick={() => setSidebarMobileOpen(true)}
          className="lg:hidden p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-white/8 transition-colors flex-shrink-0"
          aria-label="Open navigation"
        >
          <Menu size={18} />
        </button>

        {/* Demo System Watermark */}
        <div className="hidden xl:flex items-center gap-1 px-2 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-300 text-[10px] font-bold tracking-wider uppercase flex-shrink-0">
          <span>DEMO / RESEARCH SYSTEM</span>
        </div>

        {/* Command Scope Dropdown */}
        <div className="relative">
          <button
            onClick={() => setScopeMenuOpen(!scopeMenuOpen)}
            className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#0F1E33] hover:bg-[#152843] border border-cyan-500/30 text-xs font-semibold text-cyan-300 transition-colors shadow-sm"
            title="Switch Command Jurisdiction Scope"
          >
            <MapPin size={13} className="text-cyan-400 flex-shrink-0" />
            <span className="tracking-wide uppercase truncate max-w-[150px] sm:max-w-[240px]">
              {activeJurisdiction?.label || 'COMMAND SCOPE: INDIA'}
            </span>
            <ChevronDown size={13} className="text-cyan-400/80 flex-shrink-0" />
          </button>

          {scopeMenuOpen && (
            <div className="absolute left-0 top-full mt-1.5 w-72 bg-[#0F1E33] border border-cyan-500/30 rounded-xl shadow-2xl z-50 overflow-hidden divide-y divide-white/5 animate-in fade-in duration-100">
              <div className="px-3 py-2 bg-[#0A1627] text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Select Command Scope</span>
                <span className="text-cyan-400 text-[10px]">India Hierarchy</span>
              </div>
              <div className="max-h-72 overflow-y-auto p-1">
                {JURISDICTION_PRESETS.map((p) => {
                  const isSelected = activeJurisdiction?.id === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={() => handleSelectJurisdiction(p)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center justify-between ${
                        isSelected
                          ? 'bg-cyan-500/15 text-cyan-200 font-bold border border-cyan-500/30'
                          : 'text-slate-300 hover:bg-white/5'
                      }`}
                    >
                      <div>
                        <p className="leading-tight">{p.shortLabel}</p>
                        <p className="text-[10px] text-slate-500 truncate max-w-[190px]">{p.description}</p>
                      </div>
                      <span className="text-[9px] uppercase px-1.5 py-0.5 rounded bg-white/5 text-slate-400 font-mono">
                        {p.level}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Real WebSocket status */}
        <div className="hidden sm:block flex-shrink-0">
          {renderConnectionBadge()}
        </div>

        <span className="hidden lg:inline text-xs text-slate-500">
          {onlineResponders} RESPONDERS
        </span>
      </div>

      {/* Center: Clock */}
      <div className="hidden md:flex flex-col items-center flex-shrink-0">
        <span className="text-xs font-semibold text-slate-300 font-mono tabular-nums">
          {time.toLocaleTimeString('en-IN', { hour12: false })} IST
        </span>
        <span className="text-[10px] text-slate-500 -mt-0.5">
          {time.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
        </span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Language */}
        <div className="relative">
          <button
            onClick={() => setLangOpen(!langOpen)}
            className="flex items-center gap-1 px-2 py-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-white/6 text-xs font-medium transition-colors"
            aria-label="Language"
          >
            <Globe size={14} />
            <span className="hidden sm:inline uppercase text-[11px]">{language}</span>
          </button>
          {langOpen && (
            <div className="absolute right-0 top-full mt-1 w-32 bg-[#132238] border border-white/12 rounded-lg shadow-xl z-50 overflow-hidden">
              {[
                { code: 'en', label: 'English' },
                { code: 'hi', label: 'हिन्दी' },
                { code: 'ta', label: 'தமிழ்' },
                { code: 'te', label: 'తెలుగు' }
              ].map((l) => (
                <button
                  key={l.code}
                  onClick={() => handleLanguageChange(l.code as 'en' | 'te' | 'hi' | 'ta')}
                  className={`w-full text-left px-3 py-2 text-xs transition-colors ${language === l.code ? 'text-blue-400 bg-blue-500/10' : 'text-slate-300 hover:bg-white/6'}`}
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
          className="p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-white/6 transition-colors"
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
        </button>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-1.5 rounded text-slate-400 hover:text-slate-200 hover:bg-white/6 transition-colors"
            aria-label={`${notificationCount} notifications`}
          >
            <Bell size={15} />
            {notificationCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold leading-none">
                {notificationCount}
              </span>
            )}
          </button>
          {notifOpen && (
            <div className="absolute right-0 top-full mt-1 w-80 bg-[#132238] border border-white/12 rounded-xl shadow-2xl z-50 overflow-hidden">
              <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">Operational Alerts</span>
                <button onClick={() => setNotifOpen(false)} className="text-[11px] text-blue-400 hover:text-blue-300">Dismiss</button>
              </div>
              <div className="max-h-80 overflow-y-auto divide-y divide-white/5">
                {[
                  { id: 1, msg: 'CRITICAL: Inundation overflow on GST Road corridor', time: '1m ago', type: 'critical' },
                  { id: 2, msg: 'Closed-Loop re-route active: Alternate high ground safe zone engaged', time: '3m ago', type: 'warning' },
                  { id: 3, msg: 'NDRF Bn-6 reported on-scene at Saidapet', time: '12m ago', type: 'info' },
                  { id: 4, msg: 'Shelter capacity update: Anakapalli refuge 32% occupied', time: '18m ago', type: 'info' },
                ].map((n) => (
                  <div key={n.id} className="px-4 py-2.5 hover:bg-white/4 transition-colors">
                    <div className="flex items-start gap-2">
                      <span className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${n.type === 'critical' ? 'bg-red-500' : n.type === 'warning' ? 'bg-amber-500' : 'bg-blue-400'}`} />
                      <div>
                        <p className="text-xs text-slate-300 leading-snug">{n.msg}</p>
                        <p className="text-[10px] text-slate-500 mt-0.5">{n.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User menu with fictional demo identity display */}
        {currentUser && (
          <div className="relative ml-1">
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-white/6 transition-colors border border-transparent hover:border-white/10"
            >
              <UserAvatar initials={currentUser.avatarInitials} size="xs" online />
              <div className="hidden sm:block text-left">
                <p className="text-xs font-semibold text-slate-200 leading-none">{currentUser.name.split(' ')[0]}</p>
                <p className="text-[10px] text-slate-400 leading-none mt-0.5 capitalize">{currentUser.role.replace(/_/g, ' ')}</p>
              </div>
              <ChevronDown size={12} className="text-slate-500 hidden sm:block" />
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 top-full mt-1 w-64 bg-[#132238] border border-white/12 rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="px-4 py-3 border-b border-white/8 bg-[#0D1828]">
                  <p className="text-xs font-bold text-slate-200">{currentUser.name}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5">{currentUser.email}</p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <Badge variant="primary" size="xs" className="capitalize">{currentUser.role.replace(/_/g, ' ')}</Badge>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-bold">DEMO ACCOUNT</span>
                  </div>
                </div>
                <div className="p-1">
                  {[
                    { icon: User, label: 'My Profile', to: '/profile' },
                    { icon: Settings, label: 'Settings', to: '/settings' },
                  ].map(({ icon: Icon, label, to }) => (
                    <button key={to} onClick={() => { navigate(to); setUserMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded text-xs text-slate-300 hover:text-slate-100 hover:bg-white/6 transition-colors">
                      <Icon size={14} />
                      {label}
                    </button>
                  ))}
                  <div className="border-t border-white/8 mt-1 pt-1">
                    <button onClick={() => { useAppStore.getState().logout(); navigate('/login'); setUserMenuOpen(false); }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded text-xs text-red-400 hover:text-red-300 hover:bg-red-500/8 transition-colors">
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

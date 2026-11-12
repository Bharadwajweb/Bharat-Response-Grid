import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import useSWR from 'swr';
import { motion } from 'framer-motion';
import { Activity, AlertTriangle, BarChart3, BellRing, CloudSun, Crosshair, Database, Gauge, Globe2, Layers3, LogOut, Menu, Radio, Settings, Shield, Siren, Users, X, Zap } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useSWRConfig } from 'swr';
import { brgApi } from '../../services/brgApi';
import { endAuthSession } from '../../services/authSession';
import { useAppStore } from '../../store/appStore';

type NavItem = { to: string; label: string; icon: LucideIcon };
const primary: NavItem[] = [
  { to: '/', label: 'Command center', icon: Gauge },
  { to: '/live-map', label: 'Operational map', icon: Globe2 },
  { to: '/incidents', label: 'Incident command', icon: AlertTriangle },
  { to: '/weather-intelligence', label: 'Weather intelligence', icon: CloudSun },
  { to: '/earthquake-intelligence', label: 'Earthquake intelligence', icon: Activity },
  { to: '/risk-analysis', label: 'Decision support', icon: Crosshair },
  { to: '/evacuation', label: 'Evacuation planning', icon: Siren },
];
const operations: NavItem[] = [
  { to: '/operations', label: 'Operations', icon: Radio },
  { to: '/resources', label: 'Resources & shelters', icon: Layers3 },
  { to: '/communications', label: 'Alerts & notifications', icon: BellRing },
  { to: '/simulation', label: 'Scenario lab', icon: Zap },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
];
const systemItems: NavItem[] = [
  { to: '/data-sources', label: 'System health & sources', icon: Database },
  { to: '/users', label: 'Access management', icon: Users },
  { to: '/settings', label: 'System settings', icon: Settings },
];

interface Props { collapsed: boolean; onClose?: () => void }

const SidebarContent: React.FC<Props> = ({ collapsed, onClose }) => {
  const { currentUser, toggleSidebar, logout } = useAppStore();
  const navigate = useNavigate();
  const { mutate } = useSWRConfig();
  const { data: system } = useSWR('system-status', async () => (await brgApi.systemStatus()).data, {
    refreshInterval: 15_000,
    shouldRetryOnError: false,
  });
  const overall = system?.overall ?? 'OFFLINE';
  const stateTone = overall === 'ONLINE' ? 'text-emerald-300' : overall === 'DEGRADED' ? 'text-amber-300' : 'text-slate-400';

  const signOut = async () => {
    try { await endAuthSession(); } finally {
      logout();
      await mutate('brg-current-user', undefined, { revalidate: false });
      navigate('/login', { replace: true });
      onClose?.();
    }
  };

  const LinkGroup = ({ items, title }: { items: NavItem[]; title: string }) => (
    <div className="mb-5">
      {!collapsed && <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">{title}</p>}
      <div className="space-y-1">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} end={to === '/'} title={collapsed ? label : undefined} onClick={onClose} className={({ isActive }) => `group flex items-center gap-3 rounded-xl border px-3 py-2.5 text-[12px] font-medium transition-all ${collapsed ? 'justify-center px-0' : ''} ${isActive ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-200 shadow-[inset_3px_0_0_#22d3ee]' : 'border-transparent text-slate-500 hover:border-white/10 hover:bg-white/[0.04] hover:text-slate-200'}`}>
            <Icon size={16} className="text-slate-600 group-hover:text-slate-300" />{!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex h-full flex-col border-r border-white/10 bg-[#07101d]">
      <div className={`flex items-center border-b border-white/10 py-5 ${collapsed ? 'justify-center' : 'justify-between px-4'}`}>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400 text-[#07101d] shadow-lg shadow-cyan-400/20"><Shield size={19} /></div>
          {!collapsed && <div><p className="text-sm font-black tracking-[0.18em] text-white">BRG</p><p className="text-[9px] uppercase tracking-widest text-cyan-300/70">Response grid</p></div>}
        </div>
        {onClose ? <button type="button" onClick={onClose} className="rounded p-1 text-slate-500 hover:bg-white/5 hover:text-white" aria-label="Close navigation"><X size={16} /></button> : !collapsed && <button type="button" onClick={toggleSidebar} className="rounded p-1 text-slate-600 hover:text-white" aria-label="Collapse navigation"><Menu size={16} /></button>}
      </div>

      {!collapsed && (
        <div className="mx-3 mt-4 rounded-xl border border-white/10 bg-white/[0.025] px-3 py-2.5" role="status">
          <div className={`flex items-center gap-2 text-[11px] font-semibold ${stateTone}`}><span className={`h-1.5 w-1.5 rounded-full ${overall === 'ONLINE' ? 'bg-emerald-400' : overall === 'DEGRADED' ? 'bg-amber-400' : 'bg-slate-500'}`} />System {overall.toLowerCase()}</div>
          <p className="mt-1 text-[10px] text-slate-600">Live status from BRG API</p>
        </div>
      )}

      <nav className="flex-1 overflow-y-auto px-3 py-5" aria-label="Main navigation">
        <LinkGroup items={primary} title="Situation room" />
        <LinkGroup items={operations} title="Coordination" />
        <LinkGroup items={systemItems} title="Administration" />
      </nav>

      <div className="border-t border-white/10 p-3">
        <NavLink to="/citizen" onClick={onClose} className="mb-2 flex items-center gap-3 rounded-xl border border-cyan-400/15 bg-cyan-400/[0.04] px-3 py-2.5 text-xs text-cyan-100"><Users size={15} />{!collapsed && 'Citizen safety portal'}</NavLink>
        {currentUser && <button type="button" onClick={() => void signOut()} className="mt-1 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs text-slate-500 hover:bg-red-500/10 hover:text-red-300"><LogOut size={15} />{!collapsed && 'Sign out'}</button>}
      </div>
    </div>
  );
};

export const Sidebar: React.FC = () => {
  const { sidebarCollapsed } = useAppStore();
  return <motion.aside animate={{ width: sidebarCollapsed ? 68 : 258 }} className="hidden h-screen flex-shrink-0 lg:flex"><SidebarContent collapsed={sidebarCollapsed} /></motion.aside>;
};

export const MobileSidebar: React.FC = () => {
  const { sidebarMobileOpen, setSidebarMobileOpen } = useAppStore();
  if (!sidebarMobileOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex lg:hidden">
      <button type="button" className="absolute inset-0 bg-black/70" onClick={() => setSidebarMobileOpen(false)} aria-label="Close navigation overlay" />
      <div className="relative w-72"><SidebarContent collapsed={false} onClose={() => setSidebarMobileOpen(false)} /></div>
    </div>
  );
};

export default Sidebar;

import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Activity, AlertTriangle, BarChart3, BellRing, CloudSun, Compass, Crosshair, Gauge, Globe2, Layers3, LogOut, Menu, Radio, Settings, Shield, Siren, Users, X, Zap } from 'lucide-react';
import { useAppStore } from '../../store/appStore';

const primary = [
  { to: '/', label: 'Command center', icon: Gauge },
  { to: '/live-map', label: 'Live GIS map', icon: Globe2 },
  { to: '/incidents', label: 'Incident command', icon: AlertTriangle },
  { to: '/weather-intelligence', label: 'Weather intelligence', icon: CloudSun },
  { to: '/earthquake-intelligence', label: 'Earthquake intelligence', icon: Activity },
  { to: '/risk-analysis', label: 'Decision intelligence', icon: Crosshair },
  { to: '/evacuation', label: 'Evacuation command', icon: Siren },
];
const operations = [
  { to: '/operations', label: 'Operations', icon: Radio },
  { to: '/resources', label: 'Resources & shelters', icon: Layers3 },
  { to: '/communications', label: 'Alert center', icon: BellRing },
  { to: '/simulation', label: 'Simulation lab', icon: Zap },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
];

interface Props { collapsed: boolean; onClose?: () => void }
const SidebarContent: React.FC<Props> = ({ collapsed, onClose }) => {
  const { currentUser, toggleSidebar, logout } = useAppStore();
  const navigate = useNavigate();
  const LinkGroup = ({ items, title }: { items: typeof primary; title: string }) => (
    <div className="mb-5">
      {!collapsed && <p className="px-3 mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600">{title}</p>}
      <div className="space-y-1">
        {items.map(({ to, label, icon: Icon }) => <NavLink key={to} to={to} end={to === '/'} title={collapsed ? label : undefined} className={({ isActive }) => `group flex items-center gap-3 rounded-xl border px-3 py-2.5 text-[12px] font-medium transition-all ${collapsed ? 'justify-center px-0' : ''} ${isActive ? 'border-cyan-400/30 bg-cyan-400/10 text-cyan-200 shadow-[inset_3px_0_0_#22d3ee]' : 'border-transparent text-slate-500 hover:border-white/10 hover:bg-white/[0.04] hover:text-slate-200'}`}><Icon size={16} className="text-slate-600 group-hover:text-slate-300" />{!collapsed && <span>{label}</span>}</NavLink>)}
      </div>
    </div>
  );
  return <div className="flex h-full flex-col border-r border-white/10 bg-[#07101d]">
    <div className={`flex items-center border-b border-white/10 py-5 ${collapsed ? 'justify-center' : 'justify-between px-4'}`}>
      <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-400 text-[#07101d] shadow-lg shadow-cyan-400/20"><Shield size={19} /></div>{!collapsed && <div><p className="text-sm font-black tracking-[0.18em] text-white">BRG</p><p className="text-[9px] uppercase tracking-widest text-cyan-300/70">Response grid</p></div>}</div>
      {onClose ? <button onClick={onClose} className="text-slate-500"><X size={16} /></button> : !collapsed && <button onClick={toggleSidebar} className="text-slate-600 hover:text-white"><Menu size={16} /></button>}
    </div>
    {!collapsed && <div className="mx-3 mt-4 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] px-3 py-2.5"><div className="flex items-center gap-2 text-[11px] font-semibold text-emerald-300"><span className="live-dot" /> National grid operational</div><p className="mt-1 text-[10px] text-slate-600">12 data feeds · 47 responders</p></div>}
    <nav className="flex-1 overflow-y-auto px-3 py-5"><LinkGroup items={primary} title="Situation room" /><LinkGroup items={operations} title="Coordination" /></nav>
    <div className="border-t border-white/10 p-3"><NavLink to="/citizen" className="mb-2 flex items-center gap-3 rounded-xl border border-emerald-400/20 bg-emerald-400/[0.05] px-3 py-2.5 text-xs text-emerald-200"><Users size={15} />{!collapsed && 'Citizen safety portal'}</NavLink><NavLink to="/settings" className="flex items-center gap-3 rounded-xl px-3 py-2 text-xs text-slate-500 hover:bg-white/5 hover:text-white"><Settings size={15} />{!collapsed && 'System settings'}</NavLink>{!collapsed && currentUser && <button onClick={() => { logout(); navigate('/login'); }} className="mt-2 flex w-full items-center gap-3 rounded-xl px-3 py-2 text-xs text-slate-600 hover:bg-red-500/10 hover:text-red-300"><LogOut size={15} />Sign out</button>}</div>
  </div>;
};
export const Sidebar: React.FC = () => { const { sidebarCollapsed } = useAppStore(); return <motion.aside animate={{ width: sidebarCollapsed ? 68 : 258 }} className="hidden h-screen flex-shrink-0 lg:flex"><SidebarContent collapsed={sidebarCollapsed} /></motion.aside>; };
export const MobileSidebar: React.FC = () => { const { sidebarMobileOpen, setSidebarMobileOpen } = useAppStore(); return sidebarMobileOpen ? <div className="fixed inset-0 z-50 flex lg:hidden"><div className="absolute inset-0 bg-black/70" onClick={() => setSidebarMobileOpen(false)} /><div className="relative w-72"><SidebarContent collapsed={false} onClose={() => setSidebarMobileOpen(false)} /></div></div> : null; };
export default Sidebar;

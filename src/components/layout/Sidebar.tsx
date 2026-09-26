import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, AlertTriangle, Radio, Map, Cloud, Zap, Package,
  MessageSquare, BarChart3, Users, Settings, Shield, ChevronLeft,
  ChevronRight, LogOut, X, Activity, Compass, FlaskConical, Server,
  Home, HeartPulse, Route, Bell, History, FileText
} from 'lucide-react';
import { useAppStore } from '../../store/appStore';
import { UserAvatar } from '../ui/Overlay';

interface NavSection {
  title: string;
  items: {
    to: string;
    icon: React.ComponentType<{ size?: number; className?: string }>;
    label: string;
    roles?: string[]; // If undefined, all authority roles
    badge?: string;
  }[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'COMMAND',
    items: [
      { to: '/', icon: LayoutDashboard, label: 'Command Center' },
      { to: '/operations', icon: Radio, label: 'Live Operations' },
      { to: '/maps', icon: Map, label: 'Live Map' },
    ],
  },
  {
    title: 'INTELLIGENCE',
    items: [
      { to: '/incidents', icon: AlertTriangle, label: 'Incidents' },
      { to: '/risk-intelligence', icon: Compass, label: 'Risk Intelligence' },
      { to: '/weather', icon: Cloud, label: 'Weather' },
      { to: '/earthquakes', icon: Activity, label: 'Earthquakes' },
      { to: '/decision-support', icon: Compass, label: 'Decision Support' },
    ],
  },
  {
    title: 'RESPONSE',
    items: [
      { to: '/evacuation', icon: Route, label: 'Evacuation' },
      { to: '/shelters', icon: Home, label: 'Shelters' },
      { to: '/teams', icon: Shield, label: 'Response Teams' },
      { to: '/resources', icon: Package, label: 'Resources' },
      { to: '/hospitals', icon: HeartPulse, label: 'Hospitals' },
    ],
  },
  {
    title: 'COMMUNICATION',
    items: [
      { to: '/alerts', icon: Bell, label: 'Alerts' },
      { to: '/communications', icon: MessageSquare, label: 'Communications' },
      { to: '/citizen-reports', icon: FileText, label: 'Citizen Reports' },
    ],
  },
  {
    title: 'SIMULATION',
    items: [
      { to: '/simulation', icon: Zap, label: 'What-If Simulation' },
      { to: '/disaster-replay', icon: History, label: 'Disaster Replay' },
    ],
  },
  {
    title: 'ANALYTICS',
    items: [
      { to: '/analytics', icon: BarChart3, label: 'Analytics' },
      { to: '/research', icon: FlaskConical, label: 'Research' },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      { to: '/users', icon: Users, label: 'Users', roles: ['central_authority', 'national_admin', 'state_authority', 'state_admin'] },
      { to: '/system-status', icon: Server, label: 'System Status' },
      { to: '/settings', icon: Settings, label: 'Settings' },
    ],
  },
];

interface SidebarContentProps { collapsed: boolean; onClose?: () => void; }

const SidebarContent: React.FC<SidebarContentProps> = ({ collapsed, onClose }) => {
  const { currentUser, toggleSidebar, logout, activeJurisdiction } = useAppStore();
  const navigate = useNavigate();

  const isCitizen = currentUser?.role === 'citizen';

  return (
    <div className="flex flex-col h-full bg-[#07111F] border-r border-white/8 select-none">
      {/* Brand Header */}
      <div className={`flex items-center ${collapsed ? 'justify-center px-0' : 'justify-between px-3.5'} py-3.5 border-b border-white/8 flex-shrink-0`}>
        {!collapsed && (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-500/20">
              <Shield size={16} className="text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-white tracking-widest leading-none">BRG</span>
                <span className="text-[10px] text-cyan-400 font-mono font-bold tracking-tight">GRID</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-tight mt-0.5 truncate">Bharat Response Grid</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-md shadow-blue-500/20">
            <Shield size={16} className="text-white" />
          </div>
        )}
        {onClose ? (
          <button onClick={onClose} className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-white/8">
            <X size={16} />
          </button>
        ) : !collapsed ? (
          <button onClick={toggleSidebar} className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-white/6 transition-colors" aria-label="Collapse sidebar">
            <ChevronLeft size={16} />
          </button>
        ) : null}
      </div>

      {/* Active Jurisdiction Scope Indicator */}
      {!collapsed && (
        <div className="px-3.5 py-2.5 border-b border-white/6 bg-[#0B1728]/80">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Scope</span>
            <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-500/10 text-cyan-300 font-bold uppercase">
              {activeJurisdiction?.level || 'NATIONAL'}
            </span>
          </div>
          <p className="text-xs font-semibold text-slate-200 truncate mt-0.5">
            {activeJurisdiction?.shortLabel || 'INDIA'}
          </p>
        </div>
      )}

      {/* Main Navigation (7 Hierarchical Categories) */}
      <nav className="flex-1 px-2 py-3 space-y-4 overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-slate-800" aria-label="Main navigation">
        {NAV_SECTIONS.map((section) => {
          // If citizen user, only show public safety sections
          if (isCitizen && section.title !== 'COMMAND' && section.title !== 'INTELLIGENCE' && section.title !== 'COMMUNICATION') {
            return null;
          }

          const filteredItems = section.items.filter((item) => {
            if (isCitizen) {
              return ['/', '/weather', '/earthquakes', '/alerts', '/citizen-reports'].includes(item.to);
            }
            if (!item.roles) return true;
            return item.roles.includes(currentUser?.role || '');
          });

          if (filteredItems.length === 0) return null;

          return (
            <div key={section.title} className="space-y-0.5">
              {!collapsed && (
                <div className="px-2 pb-1">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    {section.title}
                  </span>
                </div>
              )}
              {filteredItems.map(({ to, icon: Icon, label, badge }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  className={({ isActive }) =>
                    `flex items-center gap-2.5 rounded-lg transition-all duration-150 font-medium text-xs group relative
                    ${collapsed ? 'justify-center px-0 py-2 mx-auto w-10' : 'px-2.5 py-1.5'}
                    ${isActive
                      ? 'text-white bg-blue-600/20 border border-blue-500/30 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5 border border-transparent'
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      <Icon size={15} className={`flex-shrink-0 ${isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-200'}`} />
                      {!collapsed && (
                        <div className="flex items-center justify-between flex-1 min-w-0">
                          <span className="truncate">{label}</span>
                          {badge && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-500/15 text-blue-300 font-bold">
                              {badge}
                            </span>
                          )}
                        </div>
                      )}
                      {collapsed && (
                        <div className="absolute left-full ml-2 px-2 py-1 bg-[#132238] border border-white/15 rounded text-xs text-slate-200 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 transition-opacity shadow-xl">
                          {label}
                        </div>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          );
        })}

        {/* Public Citizen Portal quick transition */}
        <div className="pt-2 border-t border-white/8">
          <NavLink
            to="/citizen"
            className={({ isActive }) =>
              `flex items-center gap-2.5 rounded-lg transition-all text-xs font-semibold
              ${collapsed ? 'justify-center px-0 py-2 mx-auto w-10' : 'px-2.5 py-2'}
              ${isActive
                ? 'text-emerald-300 bg-emerald-500/15 border border-emerald-500/30'
                : 'text-emerald-400/90 hover:text-emerald-300 hover:bg-emerald-500/10 border border-emerald-500/20'}`
            }
          >
            <Users size={15} className="flex-shrink-0 text-emerald-400" />
            {!collapsed && (
              <div className="flex items-center justify-between flex-1 min-w-0">
                <span className="truncate">Citizen Portal</span>
                <span className="text-[9px] px-1 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold uppercase tracking-wider">
                  Public
                </span>
              </div>
            )}
            {collapsed && (
              <div className="absolute left-full ml-2 px-2 py-1 bg-[#132238] border border-white/15 rounded text-xs text-emerald-300 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 shadow-xl">
                Citizen Safety Portal
              </div>
            )}
          </NavLink>
        </div>
      </nav>

      {/* User profile & Sign Out at bottom */}
      <div className="p-2 border-t border-white/8 bg-[#091424]">
        {!collapsed && currentUser && (
          <div className="flex items-center justify-between gap-2 px-1 py-1">
            <div className="flex items-center gap-2 min-w-0">
              <UserAvatar initials={currentUser.avatarInitials} size="sm" online />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-200 truncate leading-tight">{currentUser.name}</p>
                <p className="text-[10px] text-slate-400 truncate leading-tight capitalize mt-0.5">{currentUser.role.replace(/_/g, ' ')}</p>
              </div>
            </div>
            <button
              onClick={() => { logout(); navigate('/login'); }}
              aria-label="Logout"
              title="Sign Out"
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors flex-shrink-0"
            >
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export const Sidebar: React.FC = () => {
  const { sidebarCollapsed } = useAppStore();

  return (
    <>
      <motion.aside
        animate={{ width: sidebarCollapsed ? 58 : 240 }}
        transition={{ type: 'spring', damping: 25, stiffness: 250 }}
        className="hidden lg:flex flex-col flex-shrink-0 overflow-hidden relative z-20"
        style={{ height: '100vh', position: 'sticky', top: 0 }}
      >
        <SidebarContent collapsed={sidebarCollapsed} />
      </motion.aside>

      {sidebarCollapsed && (
        <button
          onClick={() => useAppStore.getState().toggleSidebar()}
          className="hidden lg:flex absolute left-12 top-4 z-30 w-5 h-5 rounded-full bg-blue-600 items-center justify-center shadow-lg text-white hover:bg-blue-500 transition-colors"
          aria-label="Expand sidebar"
        >
          <ChevronRight size={12} />
        </button>
      )}
    </>
  );
};

export const MobileSidebar: React.FC = () => {
  const { sidebarMobileOpen, setSidebarMobileOpen } = useAppStore();

  return (
    <AnimatePresence>
      {sidebarMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setSidebarMobileOpen(false)}
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="relative w-64 flex-shrink-0 flex flex-col"
          >
            <SidebarContent collapsed={false} onClose={() => setSidebarMobileOpen(false)} />
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

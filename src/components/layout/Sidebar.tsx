import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, AlertTriangle, Radio, Map, Cloud, Zap, Package,
  MessageSquare, BarChart3, Users, User, Settings, Shield, ChevronLeft,
  ChevronRight, LogOut, X, Activity
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAppStore } from '../../store/appStore';
import { UserAvatar } from '../ui/Overlay';
import { Badge } from '../ui/Badge';

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: 'nav.overview', roles: ['national_admin', 'state_admin', 'district_admin', 'responder'] },
  { to: '/incidents', icon: AlertTriangle, label: 'nav.incidents', roles: ['national_admin', 'state_admin', 'district_admin', 'responder'] },
  { to: '/operations', icon: Radio, label: 'nav.operations', roles: ['national_admin', 'state_admin', 'district_admin', 'responder'] },
  { to: '/maps', icon: Map, label: 'nav.maps', roles: ['national_admin', 'state_admin', 'district_admin', 'responder'] },
  { to: '/weather', icon: Cloud, label: 'nav.weather', roles: ['national_admin', 'state_admin', 'district_admin', 'responder'] },
  { to: '/simulation', icon: Zap, label: 'nav.simulation', roles: ['national_admin', 'state_admin'] },
  { to: '/resources', icon: Package, label: 'nav.resources', roles: ['national_admin', 'state_admin', 'district_admin', 'responder'] },
  { to: '/communications', icon: MessageSquare, label: 'nav.communications', roles: ['national_admin', 'state_admin', 'district_admin', 'responder'] },
  { to: '/analytics', icon: BarChart3, label: 'nav.analytics', roles: ['national_admin', 'state_admin'] },
  { to: '/users', icon: Users, label: 'nav.users', roles: ['national_admin'] },
];

const BOTTOM_NAV_ITEMS = [
  { to: '/profile', icon: User, label: 'nav.profile' },
  { to: '/settings', icon: Settings, label: 'nav.settings' },
];

interface SidebarContentProps { collapsed: boolean; onClose?: () => void; }

const SidebarContent: React.FC<SidebarContentProps> = ({ collapsed, onClose }) => {
  const { t } = useTranslation();
  const { currentUser, toggleSidebar, logout } = useAppStore();
  const navigate = useNavigate();

  const visibleItems = NAV_ITEMS.filter(
    (item) => !currentUser || item.roles.includes(currentUser.role)
  );

  return (
    <div className="flex flex-col h-full bg-[#07111F] border-r border-white/8">
      {/* Logo / Brand */}
      <div className={`flex items-center ${collapsed ? 'justify-center px-0' : 'justify-between px-4'} py-4 border-b border-white/8 flex-shrink-0`}>
        {!collapsed && (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-blue-500/20">
              <Shield size={16} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white leading-none tracking-wider">BRG</p>
              <p className="text-xs text-slate-500 leading-none mt-0.5 truncate">Bharat Response Grid</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Shield size={16} className="text-white" />
          </div>
        )}
        {onClose ? (
          <button onClick={onClose} className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-white/8">
            <X size={16} />
          </button>
        ) : !collapsed ? (
          <button onClick={toggleSidebar} className="p-1 rounded text-slate-600 hover:text-slate-400 hover:bg-white/6 transition-colors" aria-label="Collapse sidebar">
            <ChevronLeft size={16} />
          </button>
        ) : null}
      </div>

      {/* Command Room */}
      {!collapsed && (
        <div className="px-4 py-3 border-b border-white/6">
          <div className="flex items-center gap-2">
            <Activity size={12} className="text-green-400 flex-shrink-0" />
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider truncate">National Command</span>
          </div>
        </div>
      )}

      {/* Main Navigation */}
      <nav className="flex-1 px-2 py-3 space-y-0.5 overflow-y-auto" aria-label="Main navigation">
        {visibleItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md transition-all duration-150 font-medium text-sm group relative
              ${collapsed ? 'justify-center px-0 py-2.5 mx-auto w-10' : 'px-3 py-2'}
              ${isActive
                ? 'text-white bg-blue-500/15 border border-blue-500/25 shadow-sm'
                : 'text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={16} className={`flex-shrink-0 ${isActive ? 'text-blue-400' : ''}`} />
                {!collapsed && <span className="truncate">{t(label)}</span>}
                {/* Tooltip for collapsed */}
                {collapsed && (
                  <div className="absolute left-full ml-2 px-2 py-1 bg-[#1A2E48] border border-white/15 rounded text-xs text-slate-200 whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none z-50 transition-opacity shadow-lg">
                    {t(label)}
                  </div>
                )}
              </>
            )}
          </NavLink>
        ))}

        {/* Divider + Citizen Portal */}
        <div className="pt-2 mt-2 border-t border-white/6">
          <NavLink
            to="/citizen"
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md transition-all duration-150 font-medium text-sm
              ${collapsed ? 'justify-center px-0 py-2.5 mx-auto w-10' : 'px-3 py-2'}
              ${isActive
                ? 'text-green-300 bg-green-500/10 border border-green-500/20'
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent'}`
            }
          >
            {!collapsed && (
              <>
                <Users size={16} className="flex-shrink-0" />
                <span className="truncate">{t('nav.citizen')}</span>
                <Badge variant="success" size="xs" className="ml-auto">Portal</Badge>
              </>
            )}
            {collapsed && <Users size={16} />}
          </NavLink>
        </div>
      </nav>

      {/* System Status */}
      {!collapsed && (
        <div className="mx-3 mb-2 px-3 py-2 rounded-md bg-green-500/6 border border-green-500/15">
          <div className="flex items-center gap-2">
            <span className="live-dot" />
            <span className="text-xs text-green-400 font-medium">System Operational</span>
          </div>
          <p className="text-xs text-slate-600 mt-0.5">All nodes online · 47 responders</p>
        </div>
      )}

      {/* Bottom Nav */}
      <div className="px-2 py-2 border-t border-white/8 space-y-0.5">
        {BOTTOM_NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-md transition-all duration-150 text-sm font-medium
              ${collapsed ? 'justify-center px-0 py-2.5 mx-auto w-10' : 'px-3 py-2'}
              ${isActive
                ? 'text-white bg-white/8 border border-white/12'
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent'}`
            }
          >
            <Icon size={15} className="flex-shrink-0" />
            {!collapsed && <span className="truncate">{t(label)}</span>}
          </NavLink>
        ))}

        {/* User + Logout */}
        {!collapsed && currentUser && (
          <div className="flex items-center gap-2 px-2 py-2 mt-1">
            <UserAvatar initials={currentUser.avatarInitials} size="sm" online />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-slate-300 truncate">{currentUser.name}</p>
              <p className="text-xs text-slate-600 truncate capitalize">{currentUser.role.replace('_', ' ')}</p>
            </div>
            <button
              onClick={() => { logout(); navigate('/login'); }}
              aria-label="Logout"
              className="p-1.5 rounded text-slate-600 hover:text-red-400 hover:bg-red-500/8 transition-colors"
            >
              <LogOut size={14} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Sidebar Component ───
export const Sidebar: React.FC = () => {
  const { sidebarCollapsed } = useAppStore();

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: sidebarCollapsed ? 64 : 256 }}
        transition={{ type: 'spring', damping: 25, stiffness: 250 }}
        className="hidden lg:flex flex-col flex-shrink-0 overflow-hidden relative z-20"
        style={{ height: '100vh', position: 'sticky', top: 0 }}
      >
        <SidebarContent collapsed={sidebarCollapsed} />
      </motion.aside>

      {/* Collapsed expand button */}
      {sidebarCollapsed && (
        <button
          onClick={() => useAppStore.getState().toggleSidebar()}
          className="hidden lg:flex absolute left-14 top-[4.5rem] z-30 w-5 h-5 rounded-full bg-blue-600 items-center justify-center shadow-lg text-white hover:bg-blue-500 transition-colors"
          aria-label="Expand sidebar"
        >
          <ChevronRight size={12} />
        </button>
      )}
    </>
  );
};

// ─── Mobile Drawer Sidebar ───
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
            className="absolute inset-0 bg-black/60"
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

import React from 'react';
import type { Severity, IncidentStatus, DisasterType } from '../../types';

// ─── Severity Badge ───
export const SEVERITY_STYLES: Record<Severity, string> = {
  critical: 'bg-red-500/15 text-red-400 border border-red-500/30',
  high: 'bg-orange-500/15 text-orange-400 border border-orange-500/30',
  medium: 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30',
  low: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
};

export const SEVERITY_DOT: Record<Severity, string> = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-blue-400',
};

export const SEVERITY_LABELS: Record<Severity, string> = {
  critical: 'CRITICAL',
  high: 'HIGH',
  medium: 'MEDIUM',
  low: 'LOW',
};

interface SeverityBadgeProps {
  severity: Severity;
  size?: 'sm' | 'md';
  dot?: boolean;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({ severity, size = 'sm', dot = true }) => {
  const base = size === 'sm'
    ? 'inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wider'
    : 'inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-sm font-bold uppercase tracking-wider';
  return (
    <span className={`${base} ${SEVERITY_STYLES[severity]}`} role="status" aria-label={`Severity: ${severity}`}>
      {dot && <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${SEVERITY_DOT[severity]}`} aria-hidden />}
      {SEVERITY_LABELS[severity]}
    </span>
  );
};

// ─── Status Badge ───
const STATUS_STYLES: Record<IncidentStatus, string> = {
  reported: 'bg-slate-500/15 text-slate-400 border border-slate-500/30',
  verified: 'bg-blue-500/15 text-blue-400 border border-blue-500/30',
  responding: 'bg-primary-500/15 text-primary-400 border border-primary-500/30',
  contained: 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30',
  resolved: 'bg-green-500/15 text-green-400 border border-green-500/30',
};

const STATUS_LABELS: Record<IncidentStatus, string> = {
  reported: 'Reported',
  verified: 'Verified',
  responding: 'Responding',
  contained: 'Contained',
  resolved: 'Resolved',
};

interface StatusBadgeProps {
  status: IncidentStatus;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'sm' }) => {
  const base = size === 'sm'
    ? 'inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold'
    : 'inline-flex items-center px-3 py-1 rounded-md text-sm font-semibold';
  return (
    <span className={`${base} ${STATUS_STYLES[status]}`} role="status" aria-label={`Status: ${status}`}>
      {STATUS_LABELS[status]}
    </span>
  );
};

// ─── Generic Badge ───
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'primary' | 'critical' | 'warning' | 'success' | 'info' | 'ghost';
  size?: 'xs' | 'sm' | 'md';
  className?: string;
}

const BADGE_VARIANTS = {
  default: 'bg-slate-500/15 text-slate-400 border border-slate-500/20',
  primary: 'bg-primary-500/15 text-primary-400 border border-primary-500/25',
  critical: 'bg-red-500/15 text-red-400 border border-red-500/30',
  warning: 'bg-amber-500/15 text-amber-400 border border-amber-500/30',
  success: 'bg-green-500/15 text-green-400 border border-green-500/30',
  info: 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30',
  ghost: 'bg-white/5 text-slate-400 border border-white/10',
};

const BADGE_SIZES = {
  xs: 'px-1.5 py-0.5 text-xs rounded',
  sm: 'px-2 py-0.5 text-xs font-medium rounded',
  md: 'px-3 py-1 text-sm font-medium rounded-md',
};

export const Badge: React.FC<BadgeProps> = ({ children, variant = 'default', size = 'sm', className = '' }) => (
  <span className={`inline-flex items-center ${BADGE_SIZES[size]} ${BADGE_VARIANTS[variant]} ${className}`}>
    {children}
  </span>
);

// ─── Disaster Type Badge ───
const TYPE_ICONS: Record<DisasterType, string> = {
  flood: '🌊', cyclone: '🌀', earthquake: '⚡', fire: '🔥', landslide: '⛰️',
  drought: '☀️', heatwave: '🌡️', tsunami: '🌊', industrial: '🏭', other: '⚠️',
};

const TYPE_LABELS: Record<DisasterType, string> = {
  flood: 'Flood', cyclone: 'Cyclone', earthquake: 'Earthquake', fire: 'Fire',
  landslide: 'Landslide', drought: 'Drought', heatwave: 'Heatwave',
  tsunami: 'Tsunami', industrial: 'Industrial', other: 'Other',
};

interface TypeBadgeProps { type: DisasterType; showIcon?: boolean; }
export const TypeBadge: React.FC<TypeBadgeProps> = ({ type, showIcon = true }) => (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-white/5 text-slate-300 border border-white/10">
    {showIcon && <span aria-hidden className="text-xs">{TYPE_ICONS[type]}</span>}
    {TYPE_LABELS[type]}
  </span>
);

// ─── Live indicator ───
interface LiveIndicatorProps { label?: string; critical?: boolean; }
export const LiveIndicator: React.FC<LiveIndicatorProps> = ({ label = 'LIVE', critical = false }) => (
  <span className="inline-flex items-center gap-1.5">
    <span className={critical ? 'live-dot-critical' : 'live-dot'} aria-hidden />
    <span className={`text-xs font-bold uppercase tracking-widest ${critical ? 'text-red-400' : 'text-green-400'}`}>
      {label}
    </span>
  </span>
);

// ─── Connection status dot ───
interface ConnectionDotProps { status: 'connected' | 'disconnected' | 'reconnecting'; }
export const ConnectionDot: React.FC<ConnectionDotProps> = ({ status }) => {
  const styles = {
    connected: 'bg-green-500',
    disconnected: 'bg-red-500',
    reconnecting: 'bg-amber-500 animate-pulse',
  };
  const labels = {
    connected: 'System Operational',
    disconnected: 'Disconnected',
    reconnecting: 'Reconnecting',
  };
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${styles[status]}`} aria-hidden />
      <span className="text-xs font-medium text-slate-400">{labels[status]}</span>
    </span>
  );
};

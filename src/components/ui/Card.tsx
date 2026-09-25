import React from 'react';

// ─── Card ───
interface CardProps { children: React.ReactNode; className?: string; onClick?: () => void; }

export const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => (
  <div
    className={`bg-[#0D1828] border border-white/8 rounded-lg ${onClick ? 'cursor-pointer hover:border-white/15 transition-colors' : ''} ${className}`}
    onClick={onClick}
  >
    {children}
  </div>
);

// ─── Elevated Card ───
export const ElevatedCard: React.FC<CardProps> = ({ children, className = '', onClick }) => (
  <div
    className={`bg-[#132238] border border-white/8 rounded-lg shadow-lg ${onClick ? 'cursor-pointer hover:border-white/15 transition-all' : ''} ${className}`}
    onClick={onClick}
  >
    {children}
  </div>
);

// ─── Panel ───
interface PanelProps { children: React.ReactNode; className?: string; title?: string; subtitle?: string; action?: React.ReactNode; }

export const Panel: React.FC<PanelProps> = ({ children, className = '', title, subtitle, action }) => (
  <div className={`bg-[#0D1828] border border-white/8 rounded-lg flex flex-col ${className}`}>
    {(title || action) && (
      <div className="flex items-start justify-between px-4 py-3 border-b border-white/6">
        <div>
          {title && <h3 className="text-sm font-semibold text-slate-200">{title}</h3>}
          {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        {action && <div className="flex-shrink-0 ml-2">{action}</div>}
      </div>
    )}
    <div className="flex-1 min-h-0">
      {children}
    </div>
  </div>
);

// ─── Stat / Metric Card ───
interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  iconColor?: string;
  trend?: string;
  trendUp?: boolean;
  sub?: string;
  critical?: boolean;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  label, value, icon, iconColor = 'text-blue-400', trend, trendUp, sub, critical, className = '',
}) => (
  <div className={`
    bg-[#0D1828] border rounded-lg p-4 flex flex-col gap-3 relative overflow-hidden
    ${critical ? 'border-red-500/25 bg-red-950/20' : 'border-white/8'}
    ${className}
  `}>
    {critical && (
      <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent pointer-events-none rounded-lg" />
    )}
    <div className="flex items-start justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{label}</p>
      </div>
      <div className={`p-2 rounded-md bg-white/5 ${iconColor}`}>
        {icon}
      </div>
    </div>
    <div>
      <p className={`text-3xl font-bold tabular-nums leading-none ${critical ? 'text-red-400' : 'text-slate-100'}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-slate-500 mt-1">{sub}</p>}
    </div>
    {trend && (
      <div className={`text-xs font-medium ${trendUp ? 'text-green-400' : 'text-red-400'}`}>
        {trendUp ? '↑' : '↓'} {trend}
      </div>
    )}
  </div>
);

// ─── Progress Bar ───
interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  label?: string;
  showValue?: boolean;
  size?: 'xs' | 'sm' | 'md';
  color?: 'blue' | 'green' | 'red' | 'amber' | 'auto';
  className?: string;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value, max = 100, label, showValue = false, size = 'sm', color = 'auto', className = '',
}) => {
  const pct = Math.round((value / max) * 100);
  const autoColor = pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-blue-500';
  const colorClass = color === 'auto' ? autoColor
    : color === 'green' ? 'bg-green-500'
    : color === 'red' ? 'bg-red-500'
    : color === 'amber' ? 'bg-amber-500'
    : 'bg-blue-500';
  const heights = { xs: 'h-1', sm: 'h-1.5', md: 'h-2' };
  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {(label || showValue) && (
        <div className="flex items-center justify-between">
          {label && <span className="text-xs text-slate-500">{label}</span>}
          {showValue && <span className="text-xs font-medium text-slate-400">{pct}%</span>}
        </div>
      )}
      <div className={`w-full bg-white/8 rounded-full overflow-hidden ${heights[size]}`}>
        <div
          className={`${colorClass} ${heights[size]} rounded-full transition-all duration-500`}
          style={{ width: `${Math.min(pct, 100)}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
    </div>
  );
};

// ─── Skeleton ───
interface SkeletonProps { className?: string; }
export const Skeleton: React.FC<SkeletonProps> = ({ className = '' }) => (
  <div className={`skeleton ${className}`} aria-hidden />
);

// ─── Empty State ───
interface EmptyStateProps { icon?: React.ReactNode; title: string; description?: string; action?: React.ReactNode; }
export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
    {icon && <div className="text-slate-600 mb-4">{icon}</div>}
    <h3 className="text-sm font-semibold text-slate-400">{title}</h3>
    {description && <p className="text-xs text-slate-600 mt-1 max-w-xs">{description}</p>}
    {action && <div className="mt-4">{action}</div>}
  </div>
);

// ─── Divider ───
interface DividerProps { label?: string; className?: string; }
export const Divider: React.FC<DividerProps> = ({ label, className = '' }) => (
  <div className={`flex items-center gap-2 ${className}`}>
    <div className="flex-1 h-px bg-white/8" />
    {label && <span className="text-xs text-slate-600 uppercase tracking-wider flex-shrink-0">{label}</span>}
    <div className="flex-1 h-px bg-white/8" />
  </div>
);

import React from 'react';
import { Loader2 } from 'lucide-react';

// ─── Button ───
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'warning' | 'outline' | 'success';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-blue-600 text-white hover:bg-blue-500 focus-visible:ring-blue-500 border border-blue-500/50',
  secondary: 'bg-white/8 text-slate-200 hover:bg-white/12 border border-white/10',
  ghost: 'text-slate-400 hover:text-slate-100 hover:bg-white/6 border border-transparent',
  danger: 'bg-red-600 text-white hover:bg-red-500 focus-visible:ring-red-500 border border-red-500/50',
  warning: 'bg-amber-600 text-white hover:bg-amber-500 focus-visible:ring-amber-500 border border-amber-500/50',
  outline: 'bg-transparent text-slate-300 hover:bg-white/6 border border-white/15 hover:border-white/25',
  success: 'bg-green-600/20 text-green-400 hover:bg-green-600/30 border border-green-500/30',
};

const SIZES: Record<ButtonSize, string> = {
  xs: 'px-2.5 py-1 text-xs gap-1 rounded',
  sm: 'px-3 py-1.5 text-sm gap-1.5 rounded-md',
  md: 'px-4 py-2 text-sm gap-2 rounded-md',
  lg: 'px-6 py-3 text-base gap-2 rounded-lg',
};

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children, variant = 'primary', size = 'md', loading = false, icon, iconRight,
  fullWidth, className = '', disabled, ...props
}) => (
  <button
    className={`
      inline-flex items-center justify-center font-medium transition-all duration-150
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07111F]
      disabled:opacity-50 disabled:pointer-events-none select-none
      ${SIZES[size]} ${VARIANTS[variant]}
      ${fullWidth ? 'w-full' : ''}
      ${className}
    `}
    disabled={disabled || loading}
    {...props}
  >
    {loading ? <Loader2 size={14} className="animate-spin flex-shrink-0" /> : icon && <span className="flex-shrink-0">{icon}</span>}
    {children && <span>{children}</span>}
    {iconRight && !loading && <span className="flex-shrink-0">{iconRight}</span>}
  </button>
);

// ─── Icon Button ───
interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  label: string;
  size?: ButtonSize;
  variant?: ButtonVariant;
  active?: boolean;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon, label, size = 'sm', variant = 'ghost', active = false, className = '', ...props
}) => (
  <button
    aria-label={label}
    title={label}
    className={`
      inline-flex items-center justify-center rounded-md transition-all duration-150
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 focus-visible:ring-offset-[#07111F]
      disabled:opacity-50 disabled:pointer-events-none
      ${size === 'xs' ? 'w-7 h-7' : size === 'sm' ? 'w-8 h-8' : size === 'md' ? 'w-9 h-9' : 'w-11 h-11'}
      ${VARIANTS[variant]}
      ${active ? 'text-blue-400 bg-blue-500/10 border-blue-500/25' : ''}
      ${className}
    `}
    {...props}
  >
    {icon}
  </button>
);

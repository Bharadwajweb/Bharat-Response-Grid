import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, WifiOff, Wifi, X } from 'lucide-react';
import type { ConnectionStatus } from '../../types';

interface ConnectionBannerProps {
  status: ConnectionStatus;
  visible: boolean;
  onDismiss?: () => void;
}

export const ConnectionBanner: React.FC<ConnectionBannerProps> = ({ status, visible, onDismiss }) => {
  const configs = {
    disconnected: {
      bg: 'bg-red-950/95 border-red-500/50',
      icon: <WifiOff size={15} className="text-red-400 flex-shrink-0" />,
      text: 'Connection interrupted — attempting to reconnect',
      textColor: 'text-red-200',
      dot: 'bg-red-500 animate-pulse',
    },
    reconnecting: {
      bg: 'bg-amber-950/95 border-amber-500/50',
      icon: <WifiOff size={15} className="text-amber-400 flex-shrink-0 animate-pulse" />,
      text: 'Reconnecting to command network...',
      textColor: 'text-amber-200',
      dot: 'bg-amber-500 animate-pulse',
    },
    connected: {
      bg: 'bg-green-950/95 border-green-500/50',
      icon: <Wifi size={15} className="text-green-400 flex-shrink-0" />,
      text: 'Connection restored',
      textColor: 'text-green-200',
      dot: 'bg-green-500',
    },
  };

  const config = configs[status];

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className={`fixed top-0 left-0 right-0 z-[100] flex items-center justify-center gap-2 px-4 py-2 border-b ${config.bg} backdrop-blur-sm`}
          role="alert"
          aria-live="assertive"
        >
          {config.icon}
          <span className={`text-xs font-semibold ${config.textColor}`}>{config.text}</span>
          {onDismiss && (
            <button
              onClick={onDismiss}
              aria-label="Dismiss"
              className="ml-2 p-0.5 rounded hover:bg-white/10 transition-colors text-slate-400"
            >
              <X size={12} />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ─── Toast ───
export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  id: string;
  message: string;
  variant?: ToastVariant;
  onDismiss: (id: string) => void;
}

const TOAST_STYLES: Record<ToastVariant, string> = {
  success: 'bg-green-950/95 border-green-500/40 text-green-100',
  error: 'bg-red-950/95 border-red-500/40 text-red-100',
  warning: 'bg-amber-950/95 border-amber-500/40 text-amber-100',
  info: 'bg-blue-950/95 border-blue-500/40 text-blue-100',
};

const TOAST_ICONS: Record<ToastVariant, React.ReactNode> = {
  success: <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />,
  error: <AlertTriangle size={14} className="text-red-400 flex-shrink-0" />,
  warning: <AlertTriangle size={14} className="text-amber-400 flex-shrink-0" />,
  info: <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />,
};

export const Toast: React.FC<ToastProps> = ({ id, message, variant = 'info', onDismiss }) => (
  <motion.div
    initial={{ opacity: 0, x: 50, scale: 0.96 }}
    animate={{ opacity: 1, x: 0, scale: 1 }}
    exit={{ opacity: 0, x: 50, scale: 0.96 }}
    className={`flex items-center gap-2 px-4 py-3 rounded-lg border shadow-xl max-w-sm backdrop-blur-sm ${TOAST_STYLES[variant]}`}
    role="alert"
  >
    {TOAST_ICONS[variant]}
    <span className="text-sm font-medium flex-1">{message}</span>
    <button onClick={() => onDismiss(id)} aria-label="Dismiss" className="text-current opacity-50 hover:opacity-100 transition-opacity ml-1">
      <X size={14} />
    </button>
  </motion.div>
);

// ─── Toast Container ───
interface ToastItem { id: string; message: string; variant?: ToastVariant; }
interface ToastContainerProps { toasts: ToastItem[]; onDismiss: (id: string) => void; }

export const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, onDismiss }) => (
  <div className="fixed bottom-4 right-4 z-[90] flex flex-col gap-2" aria-live="polite">
    <AnimatePresence>
      {toasts.map((t) => (
        <Toast key={t.id} {...t} onDismiss={onDismiss} />
      ))}
    </AnimatePresence>
  </div>
);

// ─── User Avatar ───
interface UserAvatarProps { initials: string; size?: 'xs' | 'sm' | 'md' | 'lg'; online?: boolean; className?: string; }
export const UserAvatar: React.FC<UserAvatarProps> = ({ initials, size = 'sm', online, className = '' }) => {
  const sizes = { xs: 'w-6 h-6 text-xs', sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-12 h-12 text-base' };
  return (
    <div className={`relative flex-shrink-0 ${className}`}>
      <div className={`${sizes[size]} rounded-full bg-blue-500/20 border border-blue-500/30 flex items-center justify-center font-semibold text-blue-400 select-none`}>
        {initials}
      </div>
      {online !== undefined && (
        <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#07111F] ${online ? 'bg-green-500' : 'bg-slate-600'}`} />
      )}
    </div>
  );
};

// ─── Presence Indicator ───
interface PresenceIndicatorProps { online: boolean; label?: string; }
export const PresenceIndicator: React.FC<PresenceIndicatorProps> = ({ online, label }) => (
  <span className="inline-flex items-center gap-1.5">
    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${online ? 'bg-green-500' : 'bg-slate-600'}`} />
    {label && <span className={`text-xs ${online ? 'text-green-400' : 'text-slate-600'}`}>{label}</span>}
  </span>
);

// ─── Timeline ───
interface TimelineEvent { id: string; label: string; timestamp: string; actor: string; active?: boolean; completed?: boolean; }
interface TimelineProps { events: TimelineEvent[]; }

export const Timeline: React.FC<TimelineProps> = ({ events }) => (
  <ol className="relative">
    {events.map((event, idx) => (
      <li key={event.id} className="flex gap-3 pb-5 last:pb-0">
        {/* Line + dot */}
        <div className="flex flex-col items-center">
          <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 border-2 z-10 ${event.completed ? 'bg-green-500 border-green-500' : event.active ? 'bg-blue-500 border-blue-500' : 'bg-transparent border-slate-600'}`} />
          {idx < events.length - 1 && <div className="w-px flex-1 bg-white/8 mt-1" />}
        </div>
        {/* Content */}
        <div className="pb-1">
          <p className="text-sm font-medium text-slate-200">{event.label}</p>
          <p className="text-xs text-slate-500 mt-0.5">{event.actor}</p>
          <p className="text-xs text-slate-600 mt-0.5">{event.timestamp}</p>
        </div>
      </li>
    ))}
  </ol>
);

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';
import { Button } from './Button';

// ─── Modal ───
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  footer?: React.ReactNode;
}

const MODAL_SIZES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-2xl',
};

export const Modal: React.FC<ModalProps> = ({ open, onClose, title, subtitle, size = 'md', children, footer }) => {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
          <motion.div
            ref={overlayRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: 8 }}
            transition={{ duration: 0.2 }}
            className={`relative w-full ${MODAL_SIZES[size]} bg-[#132238] border border-white/12 rounded-xl shadow-2xl flex flex-col max-h-[90vh]`}
          >
            {/* Header */}
            {(title || subtitle) && (
              <div className="flex items-start justify-between px-5 py-4 border-b border-white/8 flex-shrink-0">
                <div>
                  {title && <h2 className="text-base font-semibold text-slate-100">{title}</h2>}
                  {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
                </div>
                <button
                  onClick={onClose}
                  aria-label="Close"
                  className="p-1 rounded text-slate-500 hover:text-slate-200 hover:bg-white/8 transition-colors ml-3 flex-shrink-0"
                >
                  <X size={18} />
                </button>
              </div>
            )}
            {/* Body */}
            <div className="flex-1 overflow-y-auto px-5 py-4 min-h-0">
              {children}
            </div>
            {/* Footer */}
            {footer && (
              <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-white/8 flex-shrink-0">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// ─── Confirm Dialog ───
interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'primary';
  loading?: boolean;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open, onClose, onConfirm, title, message, confirmLabel = 'Confirm',
  cancelLabel = 'Cancel', variant = 'danger', loading = false,
}) => (
  <Modal open={open} onClose={onClose} size="sm"
    footer={
      <>
        <Button variant="ghost" size="sm" onClick={onClose} disabled={loading}>{cancelLabel}</Button>
        <Button variant={variant} size="sm" onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
      </>
    }
  >
    <div className="flex gap-4">
      {variant === 'danger' && (
        <div className="flex-shrink-0 p-2 rounded-full bg-red-500/15">
          <AlertTriangle size={20} className="text-red-400" />
        </div>
      )}
      <div>
        <h3 className="text-sm font-semibold text-slate-100 mb-1">{title}</h3>
        <p className="text-sm text-slate-400">{message}</p>
      </div>
    </div>
  </Modal>
);

// ─── Drawer ───
interface DrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  side?: 'left' | 'right';
  width?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Drawer: React.FC<DrawerProps> = ({
  open, onClose, title, subtitle, side = 'right', width = 'w-[480px]', children, footer,
}) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const variants = {
    hidden: { x: side === 'right' ? '100%' : '-100%', opacity: 0 },
    visible: { x: 0, opacity: 1 },
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-40 flex" role="dialog" aria-modal="true">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60"
            onClick={onClose}
          />
          <motion.div
            initial="hidden"
            animate="visible"
            exit="hidden"
            variants={variants}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className={`absolute ${side === 'right' ? 'right-0' : 'left-0'} top-0 bottom-0 ${width} max-w-full bg-[#0D1828] border-${side === 'right' ? 'l' : 'r'} border-white/8 flex flex-col shadow-2xl`}
          >
            {/* Header */}
            <div className="flex items-start justify-between px-5 py-4 border-b border-white/8 flex-shrink-0">
              <div>
                {title && <h2 className="text-base font-semibold text-slate-100">{title}</h2>}
                {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
              </div>
              <button onClick={onClose} aria-label="Close drawer" className="p-1.5 rounded text-slate-500 hover:text-slate-200 hover:bg-white/8 transition-colors">
                <X size={16} />
              </button>
            </div>
            {/* Body */}
            <div className="flex-1 overflow-y-auto min-h-0">
              {children}
            </div>
            {/* Footer */}
            {footer && (
              <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-white/8 flex-shrink-0">
                {footer}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

// ─── Tabs ───
interface Tab { id: string; label: string; icon?: React.ReactNode; count?: number; }

interface TabsProps {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, active, onChange, className = '' }) => (
  <div className={`flex items-center gap-0.5 border-b border-white/8 ${className}`} role="tablist">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        role="tab"
        aria-selected={active === tab.id}
        onClick={() => onChange(tab.id)}
        className={`
          inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium border-b-2 -mb-px transition-all duration-150 whitespace-nowrap
          ${active === tab.id
            ? 'border-blue-500 text-blue-400'
            : 'border-transparent text-slate-500 hover:text-slate-300 hover:border-white/20'}
        `}
      >
        {tab.icon && <span className="opacity-80">{tab.icon}</span>}
        {tab.label}
        {tab.count !== undefined && (
          <span className={`text-xs px-1.5 py-0.5 rounded-full ${active === tab.id ? 'bg-blue-500/20 text-blue-300' : 'bg-white/8 text-slate-500'}`}>
            {tab.count}
          </span>
        )}
      </button>
    ))}
  </div>
);

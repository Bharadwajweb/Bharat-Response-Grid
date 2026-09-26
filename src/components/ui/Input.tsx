import React, { forwardRef } from 'react';
import { Search, ChevronDown } from 'lucide-react';

// ─── Input ───
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label, error, icon, iconRight, className = '', id, ...props
}, ref) => (
  <div className="flex flex-col gap-1">
    {label && (
      <label htmlFor={id} className="text-xs font-medium text-slate-400 uppercase tracking-wider">
        {label}
      </label>
    )}
    <div className="relative">
      {icon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
          {icon}
        </div>
      )}
      <input
        ref={ref}
        id={id}
        className={`
          w-full bg-[#132238] border border-white/10 rounded-md text-sm text-slate-200 placeholder-slate-600
          focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all
          ${icon ? 'pl-9' : 'pl-3'} ${iconRight ? 'pr-9' : 'pr-3'} py-2
          disabled:opacity-50 disabled:cursor-not-allowed
          ${error ? 'border-red-500/50 focus:ring-red-500/50' : ''}
          ${className}
        `}
        {...props}
      />
      {iconRight && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
          {iconRight}
        </div>
      )}
    </div>
    {error && <p className="text-xs text-red-400">{error}</p>}
  </div>
));
Input.displayName = 'Input';

// ─── Textarea ───
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({
  label, error, className = '', id, ...props
}, ref) => (
  <div className="flex flex-col gap-1">
    {label && (
      <label htmlFor={id} className="text-xs font-medium text-slate-400 uppercase tracking-wider">
        {label}
      </label>
    )}
    <textarea
      ref={ref}
      id={id}
      className={`
        w-full bg-[#132238] border border-white/10 rounded-md text-sm text-slate-200 placeholder-slate-600
        focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all
        px-3 py-2 resize-none
        ${error ? 'border-red-500/50' : ''}
        ${className}
      `}
      {...props}
    />
    {error && <p className="text-xs text-red-400">{error}</p>}
  </div>
));
Textarea.displayName = 'Textarea';

// ─── Select ───
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({
  label, error, options, className = '', id, ...props
}, ref) => (
  <div className="flex flex-col gap-1">
    {label && (
      <label htmlFor={id} className="text-xs font-medium text-slate-400 uppercase tracking-wider">
        {label}
      </label>
    )}
    <div className="relative">
      <select
        ref={ref}
        id={id}
        className={`
          w-full bg-[#132238] border border-white/10 rounded-md text-sm text-slate-200
          focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all
          pl-3 pr-8 py-2 appearance-none
          ${error ? 'border-red-500/50' : ''}
          ${className}
        `}
        {...props}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-[#132238]">{o.label}</option>
        ))}
      </select>
      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
    </div>
    {error && <p className="text-xs text-red-400">{error}</p>}
  </div>
));
Select.displayName = 'Select';

// ─── Search Input ───
interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
}

export const SearchInput: React.FC<SearchInputProps> = ({ className = '', value, onClear, ...props }) => (
  <div className="relative">
    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
    <input
      type="search"
      className={`
        w-full bg-[#132238] border border-white/10 rounded-md text-sm text-slate-200 placeholder-slate-600
        focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all
        pl-9 pr-${onClear && value ? '8' : '3'} py-2
        ${className}
      `}
      value={value}
      {...props}
    />
    {onClear && value ? (
      <button
        type="button"
        onClick={onClear}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 text-xs px-1 rounded"
      >
        ×
      </button>
    ) : null}
  </div>
);

'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';

interface BaseFieldProps {
  label: string;
  required?: boolean;
  error?: string;
  helperText?: string;
}

export interface FormInputProps
  extends BaseFieldProps,
    React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ComponentType<{ className?: string }>;
}

export const FormInput = React.forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, name, required = false, error, helperText, icon: Icon, className = '', ...props }, ref) => {
    return (
      <div className="space-y-1.5 w-full">
        <label htmlFor={name} className="flex items-center gap-1 text-xs font-medium text-slate-300">
          <span>{label}</span>
          {required && <span className="text-rose-400 font-bold">*</span>}
        </label>

        <div className="relative">
          {Icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
              <Icon className="h-4 w-4" />
            </div>
          )}
          <input
            id={name}
            name={name}
            ref={ref}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${name}-error` : undefined}
            className={`w-full py-2 bg-slate-950/70 border rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition ${
              Icon ? 'pl-9 pr-3' : 'px-3'
            } ${
              error
                ? 'border-rose-500 focus:border-rose-400 focus:ring-1 focus:ring-rose-500/30'
                : 'border-slate-800 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30'
            } ${className}`}
            {...props}
          />
        </div>

        {error ? (
          <p id={`${name}-error`} className="flex items-center gap-1 text-[11px] text-rose-400 font-medium">
            <AlertCircle className="h-3 w-3 shrink-0" />
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p className="text-[11px] text-slate-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
FormInput.displayName = 'FormInput';

export interface FormSelectProps
  extends BaseFieldProps,
    React.SelectHTMLAttributes<HTMLSelectElement> {
  options: Array<{ label: string; value: string | number }>;
  placeholder?: string;
}

export const FormSelect = React.forwardRef<HTMLSelectElement, FormSelectProps>(
  ({ label, name, required = false, error, helperText, options, placeholder = 'Select an option', className = '', ...props }, ref) => {
    return (
      <div className="space-y-1.5 w-full">
        <label htmlFor={name} className="flex items-center gap-1 text-xs font-medium text-slate-300">
          <span>{label}</span>
          {required && <span className="text-rose-400 font-bold">*</span>}
        </label>

        <select
          id={name}
          name={name}
          ref={ref}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${name}-error` : undefined}
          className={`w-full px-3 py-2 bg-slate-950/70 border rounded-xl text-xs text-slate-100 focus:outline-none transition cursor-pointer ${
            error
              ? 'border-rose-500 focus:border-rose-400'
              : 'border-slate-800 focus:border-indigo-500'
          } ${className}`}
          {...props}
        >
          <option value="" disabled>
            {placeholder}
          </option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {error ? (
          <p id={`${name}-error`} className="flex items-center gap-1 text-[11px] text-rose-400 font-medium">
            <AlertCircle className="h-3 w-3 shrink-0" />
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p className="text-[11px] text-slate-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
FormSelect.displayName = 'FormSelect';

export interface FormTextareaProps
  extends BaseFieldProps,
    React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const FormTextarea = React.forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ label, name, required = false, error, helperText, className = '', ...props }, ref) => {
    return (
      <div className="space-y-1.5 w-full">
        <label htmlFor={name} className="flex items-center gap-1 text-xs font-medium text-slate-300">
          <span>{label}</span>
          {required && <span className="text-rose-400 font-bold">*</span>}
        </label>

        <textarea
          id={name}
          name={name}
          ref={ref}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${name}-error` : undefined}
          rows={3}
          className={`w-full px-3 py-2 bg-slate-950/70 border rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none transition ${
            error
              ? 'border-rose-500 focus:border-rose-400'
              : 'border-slate-800 focus:border-indigo-500'
          } ${className}`}
          {...props}
        />

        {error ? (
          <p id={`${name}-error`} className="flex items-center gap-1 text-[11px] text-rose-400 font-medium">
            <AlertCircle className="h-3 w-3 shrink-0" />
            <span>{error}</span>
          </p>
        ) : helperText ? (
          <p className="text-[11px] text-slate-500">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
FormTextarea.displayName = 'FormTextarea';

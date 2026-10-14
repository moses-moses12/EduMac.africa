'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  title: string;
  message?: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, 'id'>) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
  dismissToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    ({ title, message, type = 'info', duration = 4000 }: Omit<Toast, 'id'>) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
      const newToast: Toast = { id, title, message, type, duration };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }
    },
    [dismissToast]
  );

  const success = useCallback((title: string, message?: string) => showToast({ title, message, type: 'success' }), [showToast]);
  const error = useCallback((title: string, message?: string) => showToast({ title, message, type: 'error' }), [showToast]);
  const warning = useCallback((title: string, message?: string) => showToast({ title, message, type: 'warning' }), [showToast]);
  const info = useCallback((title: string, message?: string) => showToast({ title, message, type: 'info' }), [showToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, success, error, warning, info, dismissToast }}>
      {children}
      {/* Toast viewport */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none p-2">
        {toasts.map((t) => {
          const config = {
            success: {
              icon: CheckCircle2,
              border: 'border-emerald-500/30',
              bg: 'bg-slate-900/95 text-slate-100',
              iconColor: 'text-emerald-400',
            },
            error: {
              icon: AlertCircle,
              border: 'border-rose-500/30',
              bg: 'bg-slate-900/95 text-slate-100',
              iconColor: 'text-rose-400',
            },
            warning: {
              icon: AlertTriangle,
              border: 'border-amber-500/30',
              bg: 'bg-slate-900/95 text-slate-100',
              iconColor: 'text-amber-400',
            },
            info: {
              icon: Info,
              border: 'border-indigo-500/30',
              bg: 'bg-slate-900/95 text-slate-100',
              iconColor: 'text-indigo-400',
            },
          }[t.type];

          const IconComponent = config.icon;

          return (
            <div
              key={t.id}
              className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border ${config.border} ${config.bg} shadow-xl backdrop-blur-md transition-all duration-200 animate-in fade-in slide-in-from-bottom-3`}
            >
              <IconComponent className={`h-5 w-5 ${config.iconColor} shrink-0 mt-0.5`} />
              <div className="flex-1 text-xs">
                <p className="font-semibold text-slate-100">{t.title}</p>
                {t.message && <p className="text-slate-400 mt-0.5 leading-relaxed">{t.message}</p>}
              </div>
              <button
                onClick={() => dismissToast(t.id)}
                className="text-slate-400 hover:text-slate-200 p-0.5 rounded transition shrink-0 cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

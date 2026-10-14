'use client';

import React from 'react';
import { Dialog } from './dialog';
import { AlertTriangle, Trash2, RefreshCw } from 'lucide-react';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm Action',
  cancelLabel = 'Cancel',
  isDestructive = true,
  isLoading = false,
}: ConfirmDialogProps) {
  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="md"
      footer={
        <>
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 transition cursor-pointer disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition cursor-pointer disabled:opacity-50 ${
              isDestructive
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-sm'
                : 'bg-indigo-600 hover:bg-indigo-500 text-white'
            }`}
          >
            {isLoading ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : isDestructive ? (
              <Trash2 className="h-3.5 w-3.5" />
            ) : null}
            {confirmLabel}
          </button>
        </>
      }
    >
      <div className="flex items-start gap-4 py-2">
        <div
          className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
            isDestructive ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-amber-500/10 text-amber-400'
          }`}
        >
          <AlertTriangle className="h-5 w-5" />
        </div>
        <div className="space-y-1">
          <p className="text-sm text-slate-300 leading-relaxed">{message}</p>
          <p className="text-xs text-slate-500">This action cannot be undone. Please proceed with caution.</p>
        </div>
      </div>
    </Dialog>
  );
}

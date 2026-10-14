'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  fallbackMessage?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Enterprise React Error Boundary
 * Catches unhandled component errors in React trees, logs diagnostics,
 * prevents white screens of death, and presents a friendly recovery UI with retry options.
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    // In enterprise environments, forward client errors to an audit/monitoring endpoint
    if (process.env.NODE_ENV === 'development') {
      console.error('[ErrorBoundary caught error]:', error, errorInfo);
    }
  }

  public handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  public handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      const {
        fallbackTitle = 'Something unexpected occurred',
        fallbackMessage = 'The application encountered an error while rendering this section. Your session data remains safe.',
      } = this.props;

      return (
        <div className="w-full min-h-[360px] flex items-center justify-center p-6 bg-slate-50/50 rounded-2xl border border-slate-200">
          <div className="max-w-md w-full bg-white rounded-2xl p-6 shadow-sm border border-slate-200/80 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 tracking-tight">{fallbackTitle}</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{fallbackMessage}</p>
            </div>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="text-left bg-slate-900 text-slate-200 p-3 rounded-xl font-mono text-[11px] overflow-x-auto max-h-36">
                <p className="text-rose-400 font-bold">{this.state.error.name}: {this.state.error.message}</p>
                {this.state.errorInfo?.componentStack && (
                  <pre className="text-slate-400 text-[10px] mt-1 whitespace-pre-wrap">
                    {this.state.errorInfo.componentStack.slice(0, 400)}...
                  </pre>
                )}
              </div>
            )}

            <div className="flex items-center justify-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={this.handleRetry}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white shadow-xs transition cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Retry Component
              </button>
              <button
                type="button"
                onClick={this.handleReload}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                Reload View
              </button>
            </div>

            <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 pt-1">
              <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
              <span>Zero-traceback guarantee • Production safe</span>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

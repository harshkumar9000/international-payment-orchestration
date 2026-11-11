import React from 'react';
import { RefreshCw, Home, ShieldAlert, ChevronDown } from 'lucide-react';
import { sanitizeErrorDetails } from '../utils/routeUtils';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Filter out benign browser extension warnings or CSP inject notices from crashing UI
    const errorStr = (error?.message || '').toLowerCase();
    if (errorStr.includes('extension') || errorStr.includes('content-security-policy')) {
      console.warn('[ATLAS.PAY ErrorBoundary] Non-critical browser environment notice:', error);
    } else {
      console.error('[ATLAS.PAY ErrorBoundary caught component exception]:', error, errorInfo);
    }
    this.setState({ errorInfo });
  }

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  handleReset = () => {
    try {
      localStorage.removeItem('atlas_auth_token');
      localStorage.removeItem('atlas_merchant');
      sessionStorage.clear();
    } catch (_) {
      // ignore storage access errors
    }
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  render() {
    if (this.state.hasError) {
      const { message, componentStack } = sanitizeErrorDetails(
        this.state.error,
        this.state.errorInfo
      );

      const isDev = Boolean(typeof import.meta !== 'undefined' && import.meta.env?.DEV);

      return (
        <div className="min-h-screen bg-[#0A0E17] text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-lg w-full bg-[#111827] border border-rose-500/30 rounded-2xl p-6 shadow-2xl text-center space-y-5">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-bold tracking-tight text-white">Something went wrong</h1>
              <p className="text-xs text-slate-400 leading-relaxed">
                An unexpected interface issue occurred. Your secure payments, API configurations, and merchant credentials remain protected.
              </p>
              {message && (
                <div className="p-3 mt-2 rounded-xl bg-slate-900/90 border border-slate-800 text-[11px] font-mono text-rose-300 text-left overflow-x-auto whitespace-pre-wrap">
                  {message}
                </div>
              )}
            </div>

            {/* Diagnostic Component Stack for Development */}
            {(isDev || componentStack) && (
              <details className="text-left bg-black/40 rounded-xl p-3 border border-slate-800 group">
                <summary className="text-[11px] font-mono text-slate-400 cursor-pointer select-none flex items-center justify-between">
                  <span>Technical Diagnostics (Component Stack)</span>
                  <ChevronDown className="w-3.5 h-3.5 group-open:rotate-180 transition-transform" />
                </summary>
                <pre className="mt-2 text-[10px] font-mono text-slate-400/90 overflow-x-auto whitespace-pre-wrap max-h-48 scrollbar-thin">
                  {componentStack || 'No component stack captured.'}
                </pre>
              </details>
            )}

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-semibold text-xs transition-colors shadow-lg shadow-teal-900/30 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload App</span>
              </button>
              <button
                type="button"
                onClick={this.handleReset}
                className="flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs transition-colors border border-slate-700 cursor-pointer"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Reset & Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

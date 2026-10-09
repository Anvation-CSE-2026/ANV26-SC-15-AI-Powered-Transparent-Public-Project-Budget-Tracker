import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertOctagon, RotateCw, Home } from 'lucide-react';

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorId: string;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    errorId: '',
  };

  public static getDerivedStateFromError(error?: Error): ErrorBoundaryState {
    void error;
    const errorId = `ERR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    return { hasError: true, errorId };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log sanitized error telemetry internally without exposing secrets or stack traces to end users
    console.error('[CivicSight ErrorBoundary caught runtime exception]:', {
      message: error.message,
      componentStack: errorInfo.componentStack,
    });
  }

  private handleReload = (): void => {
    if (this.props.onReset) {
      this.props.onReset();
    }
    this.setState({ hasError: false, errorId: '' });
    window.location.reload();
  };

  private handleGoHome = (): void => {
    if (this.props.onReset) {
      this.props.onReset();
    }
    this.setState({ hasError: false, errorId: '' });
    window.location.href = '/';
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 sm:p-6 text-slate-100">
          <div className="w-full max-w-md bg-slate-800/90 border border-slate-700/80 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 mx-auto flex items-center justify-center">
              <AlertOctagon className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold text-white tracking-tight">
                Temporary Interface Disruption
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                CivicSight encountered an unexpected presentation error while rendering this view.
                Your data and sessions are secure.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/50 text-[11px] text-slate-400 font-mono">
              Reference: <span className="text-slate-300 font-semibold">{this.state.errorId}</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:flex-1 py-2.5 px-4 rounded-xl font-semibold text-xs text-white bg-blue-600 hover:bg-blue-500 transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-600/20"
              >
                <RotateCw className="w-4 h-4" />
                <span>Reload Page</span>
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="w-full sm:flex-1 py-2.5 px-4 rounded-xl font-semibold text-xs text-slate-300 bg-slate-700/80 hover:bg-slate-700 hover:text-white transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                <Home className="w-4 h-4" />
                <span>Return to Portal</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

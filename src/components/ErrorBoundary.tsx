import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';
import { motion } from 'motion/react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-[40px] p-8 shadow-2xl border border-slate-100 dark:border-slate-800"
          >
            <div className="w-20 h-20 bg-red-50 dark:bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-6 text-red-500">
              <AlertTriangle className="w-10 h-10" />
            </div>
            <h1 className="text-2xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">
              Oops! Something broke
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm mb-8 leading-relaxed">
              We encountered an unexpected error. Don't worry, your data is safe.
            </p>
            
            <div className="space-y-3">
              <button
                onClick={() => window.location.reload()}
                className="w-full py-4 bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-2xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all"
              >
                <RotateCcw className="w-4 h-4" />
                Retry Loading
              </button>
              <button
                onClick={this.handleReset}
                className="w-full py-4 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-2xl font-bold uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all"
              >
                <Home className="w-4 h-4" />
                Go to Home
              </button>
            </div>
          </motion.div>
          
          <div className="mt-8 text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-full">
            ERROR_CODE: {this.state.error?.name || 'UNKNOWN_RUNTIME_ERROR'}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

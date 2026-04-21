// ════════════════════════════════════════════════════
// ERROR BOUNDARY — Catches React runtime errors
// v2 [BUG-10C]: Go Home link alongside reload
// Complements src/app/error.tsx (Next.js app-level error)
// ════════════════════════════════════════════════════

'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import * as Sentry from '@sentry/nextjs';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
    Sentry.captureException(error, {
      contexts: { react: { componentStack: errorInfo.componentStack ?? undefined } },
    });
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen p-8 bg-surface-deep">
          <div className="text-center max-w-md">
            <div className="text-6xl mb-4 font-display font-bold text-neon-blue/30">
              &#x26A1;
            </div>
            <h1 className="font-display text-2xl font-bold text-white mb-2">
              Oops! Something went wrong
            </h1>
            <p className="font-body text-sm text-white/70 mb-6">
              Don&apos;t worry — this happens sometimes.
              Let&apos;s get you back on track!
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <pre className="text-left text-xs text-red-400/60 bg-red-500/5 border border-red-500/10 rounded-xl p-4 mb-6 overflow-auto max-h-40">
                {this.state.error.message}
              </pre>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <motion.button
                onClick={this.handleReload}
                className="px-6 py-3 rounded-xl bg-gradient-to-r from-spark-blue to-blue-600 text-white font-display font-bold text-sm"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Try Again
              </motion.button>
              <Link
                href="/"
                className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white/60 font-display font-bold text-sm hover:bg-white/10 transition-colors text-center"
              >
                Go Home
              </Link>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

'use client';

import { useEffect } from 'react';
import { motion } from 'motion/react';
import * as Sentry from '@sentry/nextjs';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Global error:', error);
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-surface-deep flex items-center justify-center px-4">
      <motion.div
        className="text-center max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="text-6xl mb-6">⚡</div>
        <h1 className="font-display text-2xl font-bold text-white mb-3">
          Something went wrong
        </h1>
        <p className="font-body text-white/50 text-sm mb-4">
          {"Don't worry — your progress is safe. This is just a temporary hiccup."}
        </p>
        {/* DIAGNOSTIC: temporarily expose the error message + digest so we can
            see what's throwing on production from a regular device (no USB
            Safari Web Inspector needed). Remove after the root cause is fixed. */}
        <details className="mb-6 text-left text-xs">
          <summary className="cursor-pointer text-white/40 hover:text-white/60">
            Technical details (tap to expand)
          </summary>
          <div className="mt-2 rounded-lg bg-black/40 p-3 font-mono text-[10px] text-amber-200/90 break-all">
            <div>
              <span className="text-white/40">message:</span> {error.message || '(no message)'}
            </div>
            {error.digest && (
              <div className="mt-1">
                <span className="text-white/40">digest:</span> {error.digest}
              </div>
            )}
            {error.name && (
              <div className="mt-1">
                <span className="text-white/40">name:</span> {error.name}
              </div>
            )}
            {error.stack && (
              <div className="mt-1">
                <span className="text-white/40">stack:</span>
                <pre className="mt-1 whitespace-pre-wrap break-all">
                  {error.stack.split('\n').slice(0, 5).join('\n')}
                </pre>
              </div>
            )}
          </div>
        </details>
        <motion.button
          onClick={reset}
          className="px-8 py-3 rounded-xl bg-gradient-to-r from-spark-purple to-spark-blue text-white font-display font-bold text-sm"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          Try Again
        </motion.button>
      </motion.div>
    </div>
  );
}

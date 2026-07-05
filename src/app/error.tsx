'use client';

import { useEffect } from 'react';
import { motion } from 'motion/react';
import { RotateCcw } from 'lucide-react';
import * as Sentry from '@sentry/nextjs';
import { SparkyCore } from '@/components/sparky/SparkyCore';

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
    <div className="relative min-h-screen bg-surface-deep flex items-center justify-center px-4 overflow-hidden">
      {/* Ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
        style={{
          width: 'min(520px, 80vw)',
          height: 'min(520px, 80vw)',
          background:
            'radial-gradient(circle, rgba(255,217,61,0.08) 0%, rgba(233,69,245,0.05) 45%, transparent 72%)',
        }}
      />
      <motion.div
        className="relative text-center max-w-md"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        {/* Sparky — puzzling over the hiccup */}
        <div aria-hidden="true" className="flex justify-center mb-4">
          <SparkyCore expression="thinking" size="xl" />
        </div>
        <h1 className="font-display text-2xl font-bold text-white mb-3">
          Something went wrong
        </h1>
        <p className="font-body text-sm mb-4" style={{ color: 'rgba(255,255,255,0.72)' }}>
          {"Don't worry — your progress is safe. This is just a temporary hiccup."}
        </p>
        {/* DIAGNOSTIC: temporarily expose the error message + digest so we can
            see what's throwing on production from a regular device (no USB
            Safari Web Inspector needed). Remove after the root cause is fixed. */}
        <details className="mb-6 text-left text-xs">
          <summary className="cursor-pointer text-white/60 hover:text-white transition-colors">
            Technical details (tap to expand)
          </summary>
          <div className="mt-2 rounded-lg bg-black/40 p-3 font-mono text-[10px] text-amber-200/90 break-all">
            <div>
              <span className="text-white/60">message:</span> {error.message || '(no message)'}
            </div>
            {error.digest && (
              <div className="mt-1">
                <span className="text-white/60">digest:</span> {error.digest}
              </div>
            )}
            {error.name && (
              <div className="mt-1">
                <span className="text-white/60">name:</span> {error.name}
              </div>
            )}
            {error.stack && (
              <div className="mt-1">
                <span className="text-white/60">stack:</span>
                <pre className="mt-1 whitespace-pre-wrap break-all">
                  {error.stack.split('\n').slice(0, 5).join('\n')}
                </pre>
              </div>
            )}
          </div>
        </details>
        <motion.button
          onClick={reset}
          className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl text-white font-display font-bold text-sm transition-all focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          style={{
            background: 'linear-gradient(135deg, #E945F5, #4F6EF7)',
            boxShadow: '0 4px 20px rgba(233,69,245,0.30)',
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <RotateCcw className="w-4 h-4" aria-hidden="true" />
          Try Again
        </motion.button>
      </motion.div>
    </div>
  );
}

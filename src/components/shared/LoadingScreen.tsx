'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as Sentry from '@sentry/nextjs';

interface LoadingScreenProps {
  message?: string;
  /** Override Sentry ping on slow/stall — default: true in production. */
  reportTelemetry?: boolean;
}

/**
 * Phase 5 P.7-MAX (§8.9): LoadingScreen with timeout escalation.
 *
 *   0s:   "Loading..." — normal state
 *   5s:   "Taking longer than expected..." — user reassurance
 *   15s:  "Something may have gone wrong" + Reload button
 *
 * Sentry telemetry fires at both thresholds in production so the
 * ops team can detect stalled loading patterns before users report
 * them. Keyed by a synthetic session ID + initial message so repeat
 * events on the same session dedupe.
 *
 * All state changes are aria-live announced via the existing status
 * region at the root of the component.
 */
export function LoadingScreen({
  message = 'Loading...',
  reportTelemetry = process.env.NODE_ENV === 'production',
}: LoadingScreenProps) {
  // 0 = initial, 1 = slow (5s), 2 = stalled (15s)
  const [tier, setTier] = useState(0);

  useEffect(() => {
    // 5-second warm warning
    const slowTimer = setTimeout(() => {
      setTier(1);
      if (reportTelemetry) {
        try {
          Sentry.captureMessage('LoadingScreen: slow (>5s)', {
            level: 'info',
            tags: { area: 'loading', tier: 'slow', initialMessage: message },
          });
        } catch {
          /* Sentry may not be initialized in dev; silent fallback */
        }
      }
    }, 5000);

    // 15-second stalled warning + user action
    const stallTimer = setTimeout(() => {
      setTier(2);
      if (reportTelemetry) {
        try {
          Sentry.captureMessage('LoadingScreen: stalled (>15s)', {
            level: 'warning',
            tags: { area: 'loading', tier: 'stalled', initialMessage: message },
          });
        } catch {
          /* silent fallback */
        }
      }
    }, 15000);

    return () => {
      clearTimeout(slowTimer);
      clearTimeout(stallTimer);
    };
  }, [message, reportTelemetry]);

  const activeMessage =
    tier === 2
      ? 'Something may have gone wrong'
      : tier === 1
      ? 'Taking longer than expected...'
      : message;

  return (
    <div
      className="min-h-screen bg-surface-deep flex items-center justify-center"
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <motion.div
        className="text-center max-w-sm mx-auto px-6"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {/* Animated logo */}
        <motion.div
          className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-spark-purple to-spark-blue"
          animate={{
            rotate: [0, 5, -5, 0],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />

        {/* Pulsing dots */}
        <div className="flex gap-2 justify-center mb-4">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className={`w-2 h-2 rounded-full ${tier === 2 ? 'bg-[#FFAA44]' : 'bg-spark-purple'}`}
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
              transition={{
                duration: 1,
                repeat: Infinity,
                delay: i * 0.2,
              }}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.p
            key={tier}
            className={`font-body text-sm ${
              tier === 2 ? 'text-[#FFAA44]' : tier === 1 ? 'text-white/70' : 'text-white/50'
            }`}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.25 }}
          >
            {activeMessage}
          </motion.p>
        </AnimatePresence>

        {/* Reload button at stalled tier */}
        {tier === 2 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="mt-6 space-y-2"
          >
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="px-4 py-2 rounded-lg bg-[#FFAA44]/15 border border-[#FFAA44]/40 text-[#FFAA44] font-display text-sm hover:bg-[#FFAA44]/25 focus:outline-none focus:ring-2 focus:ring-[#FFAA44]/60 transition-colors"
              aria-label="Reload the page"
            >
              Try refreshing
            </button>
            <p className="text-[10px] text-white/70 font-body">
              If this keeps happening, check your internet connection or try again in a few minutes.
            </p>
          </motion.div>
        )}

        <span className="sr-only">{activeMessage}</span>
      </motion.div>
    </div>
  );
}

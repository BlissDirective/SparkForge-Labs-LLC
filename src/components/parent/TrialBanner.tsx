// ════════════════════════════════════════════════════
// TRIAL BANNER — Countdown for active trial subscriptions
// v3 Gap 2: Shows days/hours remaining, turns urgent red
// under 2 days. Matches DemoSessionBanner visual language.
// ════════════════════════════════════════════════════
'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { Clock, Crown, X, ExternalLink } from 'lucide-react';
import { useTrialStatus } from '@/hooks/useTrialStatus';
import { getTierDisplayName } from '@/lib/tier-config';

interface TrialBannerProps {
  /** Position variant. "fixed" = viewport top overlay (global),
   * "inline" = sits in page flow (subscription page header). */
  variant?: 'fixed' | 'inline';
  /** Allow the user to temporarily dismiss the fixed banner. */
  dismissible?: boolean;
}

function formatRemaining(days: number, ms: number): string {
  if (ms <= 0) return '0:00:00';
  if (days >= 2) return `${days} days`;
  // Under 2 days — show H:MM:SS
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function TrialBanner({ variant = 'fixed', dismissible = true }: TrialBannerProps) {
  const { isInTrial, daysRemaining, msRemaining, isUrgent, tier } = useTrialStatus();
  const [dismissed, setDismissed] = useState(false);

  if (!isInTrial) return null;
  if (dismissed && variant === 'fixed') return null;

  const tierName = getTierDisplayName(tier);
  const remaining = formatRemaining(daysRemaining, msRemaining);

  if (variant === 'inline') {
    return (
      <motion.div
        className={`bg-[var(--surface-card)] rounded-xl p-4 mb-4 border ${
          isUrgent
            ? 'border-red-500/30 bg-red-500/5'
            : 'border-spark-blue/20 bg-spark-blue/5'
        }`}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-full flex items-center justify-center ${
              isUrgent ? 'bg-red-500/10' : 'bg-spark-blue/10'
            }`}
          >
            {isUrgent ? (
              <Clock className="w-5 h-5 text-red-400 animate-pulse" />
            ) : (
              <Crown className="w-5 h-5 text-spark-blue" />
            )}
          </div>
          <div className="flex-1">
            <div className="font-display text-sm font-bold text-white">
              {isUrgent ? 'Trial ending soon' : `You're on a free trial of ${tierName}`}
            </div>
            <div className="font-body text-xs text-white/50">
              <span className={`font-data tabular-nums ${isUrgent ? 'text-red-300' : 'text-spark-green'}`}>
                {remaining}
              </span>{' '}
              remaining. You won't be charged until your trial ends.
            </div>
          </div>
          <Link
            href="/parent/subscription"
            className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 font-body text-xs transition-all"
          >
            Manage
            <ExternalLink className="w-3 h-3" />
          </Link>
        </div>
      </motion.div>
    );
  }

  // ── Fixed top-of-viewport banner ──
  return (
    <AnimatePresence>
      <motion.div
        className={`fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 py-2 text-sm font-body ${
          isUrgent
            ? 'bg-gradient-to-r from-red-900/90 to-orange-900/90 border-b border-red-500/30 backdrop-blur-md'
            : 'bg-gradient-to-r from-spark-blue/20 to-spark-purple/20 border-b border-white/10 backdrop-blur-md'
        }`}
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -40, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-2">
          <Clock className={`w-4 h-4 ${isUrgent ? 'text-red-400 animate-pulse' : 'text-spark-blue'}`} />
          <span className={isUrgent ? 'text-red-200' : 'text-white/70'}>
            {tierName} Trial
          </span>
          <span className={`font-data font-bold tabular-nums ${isUrgent ? 'text-red-300' : 'text-spark-green'}`}>
            {remaining}
          </span>
          <span className={isUrgent ? 'text-red-300/60' : 'text-white/70'}>remaining</span>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/parent/subscription"
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-spark-blue/20 border border-spark-blue/30 text-spark-blue text-xs font-semibold hover:bg-spark-blue/30 transition-colors"
          >
            <Crown className="w-3 h-3" />
            Manage Trial
          </Link>
          {dismissible && (
            <button
              onClick={() => setDismissed(true)}
              className="text-white/60 hover:text-white/60 transition-colors"
              aria-label="Dismiss trial banner"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

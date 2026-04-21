'use client';

import { motion, useReducedMotion } from 'motion/react';

interface GameProgressTrackerProps {
  current: number;
  total: number;
  tier?: string;
  className?: string;
  labColor?: string;
}

/**
 * Round/level progress bar with tier indicator.
 * Shows current position in a game's content pool.
 */
export function GameProgressTracker({
  current,
  total,
  tier,
  className = '',
  labColor = '#00BBFF',
}: GameProgressTrackerProps) {
  const prefersReducedMotion = useReducedMotion();
  const progress = total > 0 ? Math.min((current / total) * 100, 100) : 0;

  return (
    <div className={`flex items-center gap-2 ${className}`} role="progressbar" aria-valuenow={current} aria-valuemin={0} aria-valuemax={total} aria-label={`Progress: ${current} of ${total}`}>
      {tier && (
        <span className="px-1.5 py-0.5 rounded text-[10px] font-data uppercase tracking-wider bg-white/6 text-white/50 border border-white/6">
          {tier}
        </span>
      )}
      <div className="flex-1 h-1.5 rounded-full bg-white/6 overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: labColor }}
          initial={prefersReducedMotion ? { width: `${progress}%` } : { width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.4, ease: 'easeOut' }}
        />
      </div>
      <span className="text-[10px] font-data text-white/70 tabular-nums min-w-[3ch] text-right">
        {current}/{total}
      </span>
    </div>
  );
}

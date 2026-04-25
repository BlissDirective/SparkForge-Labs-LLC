// ════════════════════════════════════════════════════
// USAGE METER — Frost-Prismatic chrome progress bar
// v3 Gap 4: Reusable progress bar used by UsageDashboard.
// Color shifts: neon-blue → amber at 80% → red at 100%.
// Renders unlimited state as a steady green bar.
// Accessibility: ARIA progressbar with valuenow/valuemax.
// ════════════════════════════════════════════════════
'use client';

import { motion } from 'motion/react';

interface UsageMeterProps {
  label: string;
  /** Current usage. */
  value: number;
  /** Limit. Pass null for "unlimited". */
  max: number | null;
  /** Optional right-side helper text (e.g. "Resets in 6h"). */
  hint?: string;
  /** Force the bar to "muted" gray (e.g. free tier feature not accessible). */
  muted?: boolean;
  /** Size variant. */
  size?: 'sm' | 'md';
}

export function UsageMeter({
  label,
  value,
  max,
  hint,
  muted = false,
  size = 'md',
}: UsageMeterProps) {
  const unlimited = max === null;
  const pct = unlimited ? 0 : max > 0 ? Math.min(100, (value / max) * 100) : 0;

  // Color tiers
  let color = '#00BBFF'; // default neon-blue
  let glow = 'rgba(0, 187, 255, 0.35)';
  if (muted) {
    color = '#64748B';
    glow = 'rgba(100, 116, 139, 0.2)';
  } else if (unlimited) {
    color = '#00FF88';
    glow = 'rgba(0, 255, 136, 0.35)';
  } else if (pct >= 100) {
    color = '#EF4444';
    glow = 'rgba(239, 68, 68, 0.4)';
  } else if (pct >= 80) {
    color = '#FFAA44';
    glow = 'rgba(255, 170, 68, 0.4)';
  }

  const barHeight = size === 'sm' ? 'h-1.5' : 'h-2';
  const valueText = unlimited ? '∞' : max;

  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between mb-1.5">
        <span className={`font-body ${size === 'sm' ? 'text-2xs' : 'text-xs'} text-white/60`}>
          {label}
        </span>
        <div className="flex items-center gap-2">
          {hint && (
            <span className="font-body text-2xs text-white/60">{hint}</span>
          )}
          <span
            className={`font-data tabular-nums ${
              size === 'sm' ? 'text-2xs' : 'text-xs'
            } font-semibold`}
            style={{ color }}
          >
            {value}
            <span className="text-white/60">/{valueText}</span>
          </span>
        </div>
      </div>

      <div
        className={`relative ${barHeight} rounded-full overflow-hidden bg-white/5 border border-white/10`}
        role="progressbar"
        aria-label={label}
        aria-valuenow={value}
        aria-valuemax={typeof max === 'number' ? max : undefined}
        aria-valuemin={0}
      >
        {/* Chrome bezel inner ring */}
        <div className="absolute inset-0 rounded-full pointer-events-none shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]" />

        {unlimited ? (
          // Unlimited: soft breathing glow, no fill
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: `linear-gradient(90deg, transparent, ${glow}, transparent)`,
            }}
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
          />
        ) : (
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              backgroundColor: color,
              boxShadow: `0 0 8px ${glow}`,
            }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        )}
      </div>
    </div>
  );
}

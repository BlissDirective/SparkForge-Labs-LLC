'use client';

// ════════════════════════════════════════════════════════════════
// MoltenProgress — Forge F1 (Concept 10 §4.3) — signature progress
// ════════════════════════════════════════════════════════════════
// Determinate: molten fill with drifting gradient + bright heat tip;
// completes with an amber→green "tempered" transition.
// Indeterminate (value = -1): sweeping molten segment, "Forging…".
// Reduced-motion: static gradient, no drift/sweep.

import { useEffect, useState } from 'react';
import { useReducedMotion } from '@/hooks/useReducedMotion';

export interface MoltenProgressProps {
  /** 0..1, or -1 for indeterminate ("Forging…"). */
  value: number;
  /** Track height in px (default 8). */
  height?: number;
  /** Accessible label — required when no visible label exists. */
  label?: string;
  /** Bright leading edge (default true). */
  showHeatTip?: boolean;
  className?: string;
}

export function MoltenProgress({
  value,
  height = 8,
  label = 'Progress',
  showHeatTip = true,
  className = '',
}: MoltenProgressProps) {
  const reducedMotion = useReducedMotion();
  const indeterminate = value < 0;
  const clamped = indeterminate ? 0 : Math.min(1, Math.max(0, value));
  const complete = !indeterminate && clamped >= 1;

  // Hold the "tempered" green state briefly after completion.
  const [tempered, setTempered] = useState(false);
  useEffect(() => {
    if (complete) {
      const t = setTimeout(() => setTempered(true), 600);
      return () => clearTimeout(t);
    }
    setTempered(false);
  }, [complete]);

  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={indeterminate ? undefined : Math.round(clamped * 100)}
      aria-valuetext={indeterminate ? 'Forging…' : undefined}
      className={`relative w-full overflow-hidden rounded-full ${className}`}
      style={{
        height,
        backgroundColor: 'rgb(var(--sf-surface-muted) / 1)',
        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.25)',
      }}
    >
      {indeterminate ? (
        reducedMotion ? (
          <div
            className="h-full w-full rounded-full forge-molten-fill"
            style={{ opacity: 0.45 }}
          />
        ) : (
          <div
            className="absolute inset-y-0 w-[30%] rounded-full forge-molten-fill"
            style={{ animation: 'forge-indeterminate-sweep 1.6s ease-in-out infinite' }}
          />
        )
      ) : (
        <div
          className={`h-full rounded-r-full ${reducedMotion || complete ? '' : 'forge-anim'} ${complete ? '' : 'forge-molten-fill'}`}
          style={{
            width: `${clamped * 100}%`,
            transition: 'width 300ms ease, background-color 600ms ease',
            ...(complete
              ? {
                  backgroundColor: 'rgb(var(--sf-accent-green) / 1)',
                  boxShadow: tempered
                    ? undefined
                    : 'var(--shadow-glow-green, 0 0 16px rgba(46,204,113,0.4))',
                }
              : {}),
          }}
        >
          {showHeatTip && !complete && clamped > 0.02 && (
            <span
              aria-hidden="true"
              className="absolute top-0 bottom-0 w-1.5 rounded-full"
              style={{
                left: `calc(${clamped * 100}% - 6px)`,
                background:
                  'radial-gradient(circle, rgb(var(--sf-primary-light) / 1) 0%, transparent 75%)',
                filter: 'blur(0.5px)',
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

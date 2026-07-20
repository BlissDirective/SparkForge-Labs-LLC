'use client';

// ════════════════════════════════════════════════════════════════
// ForgeDial — Forge F1 (Concept 10 §4.4) — radial stat/completion ring
// ════════════════════════════════════════════════════════════════
// SVG stroke-dashoffset ring with a molten gradient default; center
// content is real DOM. Mount animation via motion (instant under
// reduced-motion).

import { useId } from 'react';
import { motion } from 'motion/react';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import type { ReactNode } from 'react';

export interface ForgeDialProps {
  /** 0..1 completion. */
  value: number;
  /** Outer size in px (default 64). */
  size?: number;
  /** Ring thickness in px (default 6). */
  thickness?: number;
  /** CSS color override; default is the molten gradient. */
  color?: string;
  /** Center content (icon / % / count). */
  children?: ReactNode;
  /** Accessible label (required). */
  label: string;
  className?: string;
}

export function ForgeDial({
  value,
  size = 64,
  thickness = 6,
  color,
  children,
  label,
  className = '',
}: ForgeDialProps) {
  const reducedMotion = useReducedMotion();
  const gradId = useId();
  const clamped = Math.min(1, Math.max(0, value));
  const r = (size - thickness) / 2;
  const circumference = 2 * Math.PI * r;
  const target = circumference * (1 - clamped);

  return (
    <div
      role="img"
      aria-label={`${label}: ${Math.round(clamped * 100)}%`}
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} aria-hidden="true" className="-rotate-90">
        {!color && (
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgb(var(--sf-primary-dark) / 1)" />
              <stop offset="55%" stopColor="rgb(var(--sf-primary) / 1)" />
              <stop offset="100%" stopColor="rgb(var(--sf-primary-light) / 1)" />
            </linearGradient>
          </defs>
        )}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="rgb(var(--sf-surface-muted) / 1)"
          strokeWidth={thickness}
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color ?? `url(#${gradId})`}
          strokeWidth={thickness}
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={reducedMotion ? { strokeDashoffset: target } : { strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: target }}
          transition={reducedMotion ? { duration: 0 } : { duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}

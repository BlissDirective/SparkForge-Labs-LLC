'use client';

// ════════════════════════════════════════════════════════════════
// HoloChip — Forge F1 (Concept 10 §4.7) — label chip
// ════════════════════════════════════════════════════════════════

import type { ReactNode } from 'react';

export interface HoloChipProps {
  tone?: 'amber' | 'cyan' | 'green' | 'neutral';
  children: ReactNode;
  className?: string;
}

const TONES: Record<NonNullable<HoloChipProps['tone']>, React.CSSProperties> = {
  amber: {
    color: 'rgb(var(--sf-primary-light) / 1)',
    borderColor: 'rgb(var(--sf-primary) / 0.35)',
    backgroundColor: 'rgb(var(--sf-primary) / 0.10)',
  },
  cyan: {
    color: 'rgb(var(--sf-secondary) / 1)',
    borderColor: 'rgb(var(--sf-secondary) / 0.30)',
    backgroundColor: 'rgb(var(--sf-secondary) / 0.08)',
  },
  green: {
    color: 'rgb(var(--sf-accent-green) / 1)',
    borderColor: 'rgb(var(--sf-accent-green) / 0.30)',
    backgroundColor: 'rgb(var(--sf-accent-green) / 0.08)',
  },
  neutral: {
    color: 'rgb(var(--sf-text-secondary) / 1)',
    borderColor: 'rgb(var(--sf-border) / 1)',
    backgroundColor: 'rgb(var(--sf-surface-muted) / 0.6)',
  },
};

export function HoloChip({ tone = 'neutral', children, className = '' }: HoloChipProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 font-display text-[11px] font-semibold uppercase tracking-[0.06em] ${className}`}
      style={TONES[tone]}
    >
      {children}
    </span>
  );
}

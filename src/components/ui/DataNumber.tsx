'use client';

// ════════════════════════════════════════════════════════════════════
// DataNumber — Phase 5 P.4-MAX (§7.4)
// ════════════════════════════════════════════════════════════════════
// Enforces the Frost-Prismatic font hierarchy rule: ALL numeric data
// displays MUST render in Orbitron (font-data) per Decision BUG-10F.
//
// Use wherever you render a number that represents quantitative data:
//   - Scores, XP, streaks, levels
//   - Timers, countdowns, elapsed times
//   - Progress counts ("3 of 10"), percentages
//   - Currency, ages, statistics
//
// Do NOT use for:
//   - Numbers embedded in prose ("Chapter 2: The Brain Inside")
//   - Version strings ("v1.2.3")
//   - List item numbers ("Step 1: ...")
//
// The ESLint rule `no-raw-numeric-text` (see eslint config) flags raw
// numeric JSX children outside DataNumber and warns.
// ════════════════════════════════════════════════════════════════════

import type { ReactNode } from 'react';
import { clsx } from 'clsx';

export type DataNumberFormat =
  | 'integer'     // 42
  | 'decimal'     // 3.14 (fixed at 2 decimals by default, overridable via `decimals`)
  | 'percentage'  // 42% (rounds to integer by default)
  | 'time'        // "1:23" (mm:ss) or "12:34:56" (hh:mm:ss) for >= 3600s
  | 'duration'    // "2m 15s" — human-readable
  | 'currency'    // "$19.99"
  | 'compact'     // "1.2k" / "3.4M" for large numbers
  | 'raw';        // as-given, no formatting

interface DataNumberProps {
  /** The numeric value to render. String accepted for pre-formatted values (format='raw'). */
  value: number | string;
  /** Format preset. Default: 'integer'. */
  format?: DataNumberFormat;
  /** For 'decimal' format: digits after decimal point. Default: 2. */
  decimals?: number;
  /** Pre/post-fixed unit text (e.g., " XP", " pts"). Appended WITHOUT Orbitron so it can match surrounding prose. */
  suffix?: ReactNode;
  /** Prefixed unit (e.g., "$", "+"). Same styling rules as suffix. */
  prefix?: ReactNode;
  /** Extra classes (size, color, weight). */
  className?: string;
  /** Screen-reader-friendly override (e.g., for "1.2k" → "1,200"). */
  ariaLabel?: string;
}

function formatValue(value: number | string, format: DataNumberFormat, decimals: number): string {
  if (typeof value === 'string') return value;
  switch (format) {
    case 'integer':
      return Math.round(value).toLocaleString();
    case 'decimal':
      return value.toFixed(decimals);
    case 'percentage':
      return `${Math.round(value)}%`;
    case 'time': {
      const s = Math.max(0, Math.round(value));
      const h = Math.floor(s / 3600);
      const m = Math.floor((s % 3600) / 60);
      const sec = s % 60;
      if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
      return `${m}:${String(sec).padStart(2, '0')}`;
    }
    case 'duration': {
      const s = Math.max(0, Math.round(value));
      if (s < 60) return `${s}s`;
      if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`;
      const h = Math.floor(s / 3600);
      const m = Math.floor((s % 3600) / 60);
      return `${h}h ${m}m`;
    }
    case 'currency':
      return `$${value.toFixed(2)}`;
    case 'compact': {
      const abs = Math.abs(value);
      if (abs >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
      if (abs >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
      if (abs >= 1e3) return `${(value / 1e3).toFixed(1)}k`;
      return String(Math.round(value));
    }
    case 'raw':
    default:
      return String(value);
  }
}

/**
 * Wraps numeric data in the canonical Orbitron (font-data) font.
 * Prefix/suffix render OUTSIDE the Orbitron span so unit labels can
 * match surrounding body text.
 */
export function DataNumber({
  value,
  format = 'integer',
  decimals = 2,
  suffix,
  prefix,
  className,
  ariaLabel,
}: DataNumberProps) {
  const formatted = formatValue(value, format, decimals);
  return (
    <span aria-label={ariaLabel} className="inline-flex items-baseline gap-0.5">
      {prefix != null && <span className="font-body">{prefix}</span>}
      <span className={clsx('font-data tabular-nums', className)}>{formatted}</span>
      {suffix != null && <span className="font-body">{suffix}</span>}
    </span>
  );
}

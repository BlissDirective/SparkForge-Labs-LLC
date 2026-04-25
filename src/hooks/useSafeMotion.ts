'use client';

// ════════════════════════════════════════════════════════════════
// useSafeMotion — P2 §5.10 (Opt B)
// ════════════════════════════════════════════════════════════════
// Single source of truth for "should this component animate?"
// Combines:
//   - OS-level `prefers-reduced-motion: reduce` (Motion library's
//     useReducedMotion fires on change)
//   - User-level uiStore.a11y.reduceMotion toggle (Settings)
//
// Either being true → animations should be suppressed / reduced.
//
// Replaces ad-hoc usages like:
//   const prefersReducedMotion = useReducedMotion();
//   if (prefersReducedMotion) { … }
// Those missed the user's explicit opt-in. Use this hook instead;
// pass the return value to Motion's `animate` / `transition` props
// or branch around the animation entirely.
// ════════════════════════════════════════════════════════════════

import { useReducedMotion as useMotionLibRM } from 'motion/react';
import { useUIStore } from '@/stores/uiStore';

/** Returns true when animations should be suppressed. */
export function useSafeMotion(): boolean {
  const osPref = useMotionLibRM();
  const userPref = useUIStore((s) => s.a11y.reduceMotion);
  return Boolean(osPref) || userPref;
}

/** Shortcut: returns a transition object that skips to final frame
 *  when motion is disabled, or the caller's config otherwise. */
export function useTransitionOrNone<T extends { duration?: number }>(
  config: T,
): T | { duration: 0 } {
  const reduce = useSafeMotion();
  return reduce ? { duration: 0 } : config;
}

// ════════════════════════════════════════════════════
// usePendingCelebration — SessionStorage bridge
// v3 Gap 5: Persists a "celebration due" marker across
// Stripe's redirect full-reload. When the cockpit becomes
// ready after mount, the pending event is consumed and
// dispatched to the 3D broadcast + HTML fallback banner.
// ════════════════════════════════════════════════════
'use client';

import { useEffect } from 'react';
import { useUIStore } from '@/stores/uiStore';
import type { CelebrationType } from '@/types';

const STORAGE_KEY = 'sparkforge:pendingCelebration';

export interface PendingCelebration {
  reason: string;
  label?: string;
  color?: string;
  /**
   * Celebration type forwarded to uiStore.triggerCelebration when
   * auto-dispatched. Defaults to 'confetti' if omitted.
   * Phase 2 audit fix (Section 3.5): Unified celebration state flow
   */
  type?: CelebrationType;
  /** When the celebration was enqueued (unix ms). Used to age out stale entries. */
  queuedAt: number;
}

const MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes

/** Queue a celebration to fire on the next appropriate mount. */
export function queuePendingCelebration(
  data: Omit<PendingCelebration, 'queuedAt'>
): void {
  if (typeof window === 'undefined') return;
  try {
    const payload: PendingCelebration = { ...data, queuedAt: Date.now() };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    console.info('[celebration] queued:', payload.reason);
  } catch {
    /* quota / privacy mode — non-fatal */
  }
}

/** Read and remove a pending celebration. Returns null if none or stale. */
export function consumePendingCelebration(): PendingCelebration | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    sessionStorage.removeItem(STORAGE_KEY);
    const parsed = JSON.parse(raw) as PendingCelebration;
    if (!parsed || typeof parsed !== 'object') return null;
    if (Date.now() - parsed.queuedAt > MAX_AGE_MS) {
      console.info('[celebration] dropping stale pending:', parsed.reason);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Peek at a pending celebration without consuming it. Useful when
 * you want to show the HTML fallback banner immediately on mount
 * and only later (after cockpit is ready) consume+dispatch the 3D.
 */
export function peekPendingCelebration(): PendingCelebration | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingCelebration;
    if (!parsed || typeof parsed !== 'object') return null;
    if (Date.now() - parsed.queuedAt > MAX_AGE_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Hook: consumes a pending celebration once the given `ready` flag
 * becomes true. Fires the callback at most once per pending item.
 *
 * Typical use: pass `useCockpitStore(s => s.cockpitReady)` as `ready`,
 * and inside `onReady` dispatch the broadcast + uiStore celebration.
 */
export function usePendingCelebration(
  ready: boolean,
  onReady: (pending: PendingCelebration) => void
): void {
  useEffect(() => {
    if (!ready) return;
    const pending = consumePendingCelebration();
    if (pending) {
      console.info('[celebration] dispatching pending:', pending.reason);
      onReady(pending);
    }
    // onReady intentionally excluded so we don't re-fire on ref change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);
}

/**
 * Phase 2 audit fix (Section 3.5): Unified celebration state flow
 *
 * Auto-dispatches any pending celebration through the single unified
 * entry point — `uiStore.triggerCelebration()`. All downstream effects
 * (CeremonyFXBridge, useCelebration3D, broadcast, LED reactions) then
 * flow from that single state change, and `useCelebration3D` remains
 * the sole owner of `dismissCelebration()`.
 *
 * Prefer this over the generic `usePendingCelebration(ready, onReady)`
 * pattern when the caller's only job is to fire the uiStore celebration.
 * This eliminates the previous bug where the hook existed but was never
 * wired to uiStore, so queued celebrations never fired after Stripe
 * redirect.
 *
 * Typical use: pass `useCockpitStore(s => s.cockpitReady)` as `ready`.
 */
export function useAutoDispatchPendingCelebration(ready: boolean): void {
  // Phase 2 audit fix (Section 3.5): Unified celebration state flow
  useEffect(() => {
    if (!ready) return;
    const pending = consumePendingCelebration();
    if (!pending) return;

    const triggerCelebration = useUIStore.getState().triggerCelebration;
    const type: CelebrationType = pending.type ?? 'confetti';

    console.info(
      '[celebration] auto-dispatching pending via uiStore.triggerCelebration:',
      pending.reason,
    );

    triggerCelebration(type, {
      reason: pending.reason,
      label: pending.label,
      color: pending.color,
    });
  }, [ready]);
}

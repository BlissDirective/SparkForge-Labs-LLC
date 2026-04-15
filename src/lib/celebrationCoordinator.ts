// ════════════════════════════════════════════════════════════════════
// celebrationCoordinator — Phase 5 §3.5 N.1-REC
// ════════════════════════════════════════════════════════════════════
// Single import point for firing celebrations across the SparkForge app.
// Before this module, three disconnected paths existed:
//
//   1. uiStore.triggerCelebration()           — direct in-session trigger
//   2. queuePendingCelebration() (sessionStg) — survives Stripe redirect
//   3. cockpitBroadcastStore.broadcast(...)   — bridge to 3D scene
//
// Each had separate lifecycle quirks: Path 2 queued but never fired
// (fixed Phase 2), Path 3 left showCelebration=true (fixed Phase 2).
// This module re-exports the canonical entry points so new code has a
// single correct place to look:
//
//   fireCelebration(type, opts)      → in-session, fires immediately
//   enqueueCelebration(type, opts)   → persists across redirect, fires
//                                      on next cockpitReady
//
// BOTH routes ultimately dispatch through `uiStore.triggerCelebration`,
// which owns the single canonical state (`showCelebration` +
// `celebrationType`). Downstream components (CeremonyFXBridge, XPPopup,
// CelebrationOverlay, useCelebration3D) all subscribe to that state —
// there is exactly one dismiss owner: `useCelebration3D`.
//
// RULE: Do not call uiStore.triggerCelebration or queuePendingCelebration
// directly from new code. Use this module. ESLint rule can enforce.
// ════════════════════════════════════════════════════════════════════

import { useUIStore } from '@/stores/uiStore';
import {
  queuePendingCelebration,
  type PendingCelebration,
} from '@/hooks/usePendingCelebration';
import type { CelebrationType } from '@/types';

export interface CelebrationPayload {
  /** Human-readable reason shown in HTML fallback banner / screen reader. */
  reason: string;
  /** Optional short label (e.g., "+50 XP"). */
  label?: string;
  /** Accent color (defaults to current labColor if omitted). */
  color?: string;
}

/**
 * Fire a celebration immediately in the current session. Use when the
 * event completes during normal app flow (no redirect involved).
 *
 * @example
 *   fireCelebration('xp', { reason: 'Correct answer', label: '+10 XP' });
 *   fireCelebration('level', { reason: 'Level 5!', color: '#AA66FF' });
 */
export function fireCelebration(
  type: CelebrationType,
  payload: CelebrationPayload
): void {
  const triggerCelebration = useUIStore.getState().triggerCelebration;
  triggerCelebration(type, {
    reason: payload.reason,
    label: payload.label,
    color: payload.color,
  });
}

/**
 * Enqueue a celebration to fire once the cockpit becomes ready. Use
 * before any event that causes a full page reload (Stripe redirect,
 * social auth callback, OAuth handshake).
 *
 * The consumer route needs `useAutoDispatchPendingCelebration(cockpitReady)`
 * mounted — currently only wired in parent/subscription/page. If you add
 * a new redirect-returning route, wire the auto-dispatch there too.
 *
 * @example
 *   enqueueCelebration('level', {
 *     reason: 'Subscription activated — welcome to Plus!',
 *     label: '+500 XP',
 *     color: '#00D17A',
 *   });
 *   window.location.href = stripeCheckoutUrl;
 */
export function enqueueCelebration(
  type: CelebrationType,
  payload: CelebrationPayload
): void {
  const entry: Omit<PendingCelebration, 'queuedAt'> = {
    reason: payload.reason,
    label: payload.label,
    color: payload.color,
    type,
  };
  queuePendingCelebration(entry);
}

// Re-export the existing consumption hook from usePendingCelebration so
// new redirect-returning pages can wire auto-dispatch from this single
// module.
export { useAutoDispatchPendingCelebration } from '@/hooks/usePendingCelebration';

/**
 * Dismiss the current celebration. In practice, you rarely need this —
 * `useCelebration3D` owns the automatic dismiss timer via
 * CELEBRATION_TIERS[tier].durationMs. Only call this for manual early
 * dismiss (e.g., user clicks skip).
 */
export function dismissCelebration(): void {
  useUIStore.getState().dismissCelebration();
}

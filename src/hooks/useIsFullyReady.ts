'use client';

// ════════════════════════════════════════════════════════════════════
// useIsFullyReady — Phase 5 O.4-MAX (§6.6)
// ════════════════════════════════════════════════════════════════════
// Canonical readiness gate for post-hero app logic.
//
// PROBLEM (audit §6.6): Hero completion sets `heroPhase='complete'`
// AND `cockpitReady=true`, but these can settle in either order. On
// fast machines users may briefly see:
//   - interactive cockpit with hero geometry still visible, OR
//   - pending celebrations fire before the cockpit paints (confetti in
//     empty space), OR
//   - skip-intro path where sceneStore stays at 'hero' but heroPhase
//     already says 'complete'
//
// FIX: A single hook that returns TRUE only when BOTH conditions are
// true AND the sceneStore has transitioned out of the hero scene.
// Gate all post-hero logic behind it:
//   - usePendingCelebration flush
//   - input binding / focus restoration
//   - spatial dashboard activation
//   - any "the app is alive" moment that depends on cockpit being
//     visually ready
//
// Also provides the helper `markFullyReady()` which:
//   - Reads heroPhase + cockpitReady
//   - If both true AND sceneStore scene is still 'hero', fires
//     `sceneStore.completeHero()` to trigger the atomic transition.
// ════════════════════════════════════════════════════════════════════

import { useMemo, useEffect, useRef } from 'react';
import { useCockpitStore } from '@/stores/cockpitStore';
import { useSceneStore } from '@/stores/sceneStore';

/**
 * Returns `true` ONLY when:
 *   - heroPhase === 'complete' (hero animation finished or was skipped)
 *   - cockpitReady === true (cockpit geometry fully materialized)
 *   - sceneStore.activeScene !== 'hero' (the atomic scene transition ran)
 *
 * Pass the result to any effect that should wait for the full hero→cockpit
 * handoff to settle before running.
 */
export function useIsFullyReady(): boolean {
  const heroPhase = useCockpitStore((s) => s.heroPhase);
  const cockpitReady = useCockpitStore((s) => s.cockpitReady);
  const activeScene = useSceneStore((s) => s.activeScene);

  return useMemo(
    () =>
      heroPhase === 'complete' &&
      cockpitReady === true &&
      activeScene !== 'hero',
    [heroPhase, cockpitReady, activeScene]
  );
}

/**
 * Mount-level hook that auto-advances the sceneStore out of 'hero' the
 * moment BOTH heroPhase and cockpitReady reach the ready state. Place
 * once in the dashboard layout (or any always-mounted post-hero surface).
 *
 * P2 §6.6 (April 21, 2026): double-rAF paint gate. When both readiness
 * flags flip on a fast machine they can commit to the compositor on
 * the same frame the hero last painted, producing a one-frame window
 * where the cockpit is interactive but the hero layer is still visible.
 *
 * The paint gate works in two rAF ticks:
 *   1. First rAF — browser has scheduled the cockpit's first "ready"
 *      frame but may not have flushed it yet.
 *   2. Second rAF — browser has committed that frame to the compositor.
 *      Only now is it safe to drop the hero scene.
 *
 * `completeHero()` is therefore called AFTER the cockpit's first
 * visible frame lands, which eliminates the single-frame flash. For
 * SSR / non-browser environments rAF may not exist; we fall through
 * to an immediate microtask so tests + Node paths don't hang.
 *
 * Semantics: the store-level transition (completeHero → 'transitioning'
 * → 'cockpit') is atomic — it only fires ONCE per hero cycle. Repeated
 * invocations are ignored because the subsequent conditions no longer
 * hold (activeScene !== 'hero' after first call).
 */
export function useAtomicHeroToCockpit(): void {
  const heroPhase = useCockpitStore((s) => s.heroPhase);
  const cockpitReady = useCockpitStore((s) => s.cockpitReady);
  const activeScene = useSceneStore((s) => s.activeScene);
  const completeHero = useSceneStore((s) => s.completeHero);
  // Keep rAF handles across effect re-runs so cleanup can cancel.
  const rafRef = useRef<{ raf1?: number; raf2?: number }>({});

  useEffect(() => {
    if (heroPhase === 'complete' && cockpitReady === true && activeScene === 'hero') {
      const raf = typeof requestAnimationFrame === 'function' ? requestAnimationFrame : null;
      if (!raf) {
        // SSR / test fallback — fire immediately via microtask.
        queueMicrotask(completeHero);
        return;
      }
      // Double-rAF paint gate — see block comment above.
      rafRef.current.raf1 = raf(() => {
        rafRef.current.raf2 = raf(() => {
          completeHero();
        });
      });
    }
    return () => {
      if (typeof cancelAnimationFrame === 'function') {
        if (rafRef.current.raf1 !== undefined) cancelAnimationFrame(rafRef.current.raf1);
        if (rafRef.current.raf2 !== undefined) cancelAnimationFrame(rafRef.current.raf2);
      }
      rafRef.current = {};
    };
  }, [heroPhase, cockpitReady, activeScene, completeHero]);
}

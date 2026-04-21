'use client';

// ════════════════════════════════════════════════════════════════
// useSyncedRouter — P2 §5.8 (Opt A)
// ════════════════════════════════════════════════════════════════
// Next.js App-Router wrapper that gates every navigation on the
// cockpit's active 3D transition. A route push fired mid-iris
// (MechanicalIris, wormhole, hero→cockpit crossfade) causes the
// new page's 3D content to flash in before the iris finishes.
// This hook awaits `sceneStore.awaitTransitionComplete()` before
// delegating to the real router.
//
// API mirrors the subset of next/navigation useRouter we use:
//   push / replace / back / forward / refresh / prefetch.
//
// push / replace are the only ones that care about the iris; the
// rest pass through unchanged.
//
// Fallback: if the transition takes longer than `timeoutMs`
// (default 1_500ms — roughly 2× the 600ms iris + slack) the hook
// navigates anyway. This is a correctness guarantee: we never
// leave the user clicking a dead link because a transition flag
// got stuck.
// ════════════════════════════════════════════════════════════════

import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useSceneStore } from '@/stores/sceneStore';

export interface SyncedRouterOptions {
  /** Ms to wait for the active transition before navigating anyway. */
  timeoutMs?: number;
}

type NavFn = (href: string, options?: { scroll?: boolean }) => void;

export function useSyncedRouter(opts: SyncedRouterOptions = {}) {
  const router = useRouter();
  const { timeoutMs = 1_500 } = opts;

  const awaitOrTimeout = useCallback(async () => {
    const awaitPromise = useSceneStore.getState().awaitTransitionComplete();
    const timeout = new Promise<'timeout'>((resolve) =>
      setTimeout(() => resolve('timeout'), timeoutMs),
    );
    await Promise.race([awaitPromise, timeout]);
  }, [timeoutMs]);

  const push: NavFn = useCallback(
    async (href, options) => {
      await awaitOrTimeout();
      router.push(href, options);
    },
    [router, awaitOrTimeout],
  );

  const replace: NavFn = useCallback(
    async (href, options) => {
      await awaitOrTimeout();
      router.replace(href, options);
    },
    [router, awaitOrTimeout],
  );

  return useMemo(
    () => ({
      // Gated on transition completion
      push,
      replace,
      // Pass-through (no iris concern)
      back: router.back.bind(router),
      forward: router.forward.bind(router),
      refresh: router.refresh.bind(router),
      prefetch: router.prefetch.bind(router),
    }),
    [push, replace, router],
  );
}

export default useSyncedRouter;

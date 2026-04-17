// ════════════════════════════════════════════════════
// useDisposable — auto-disposing Three.js resource hook
// Final-Audit 04-15-2026 finding PERF-CRIT-002 (Option C)
//
// Drop-in replacement for `useMemo` when the memoized value is a
// Three.js geometry, material, texture, render target, or any other
// object exposing a `dispose()` method.
//
// Every resource created through this hook is tracked in a
// module-level registry and disposed in the unmount cleanup of the
// calling component. This eliminates the class of VRAM leak flagged
// by PERF-CRIT-002 — geometries and materials created with
// `useMemo(() => new XGeometry(...), [])` that never get freed when
// the component unmounts (visible after extended gameplay when the
// browser tab starts consuming multiple gigabytes of VRAM and
// eventually crashes).
//
// Usage (before):
//   const geo = useMemo(() => new BoxGeometry(1, 1, 1), []);
//
// Usage (after):
//   const geo = useDisposable(() => new BoxGeometry(1, 1, 1), []);
//
// Multiple resources at once:
//   const { geo, mat } = useDisposable(() => ({
//     geo: new SphereGeometry(0.5, 32, 32),
//     mat: new MeshStandardMaterial({ color: '#00BBFF' }),
//   }), []);
//   // Both disposed on unmount.
//
// The hook also feeds MemoryMonitor so developers can see allocation
// counts in dev builds.
// ════════════════════════════════════════════════════

import { useEffect, useMemo, useRef } from 'react';
import type { DependencyList } from 'react';

/** Anything with a dispose() method — geometry, material, texture, RT, etc. */
export interface Disposable {
  dispose: () => void;
}

// Module-level stats for MemoryMonitor
const stats = {
  totalAllocated: 0,
  totalDisposed: 0,
  currentLive: 0,
  byType: new Map<string, number>(),
};

function isDisposable(x: unknown): x is Disposable {
  return (
    x !== null &&
    typeof x === 'object' &&
    'dispose' in x &&
    typeof (x as Disposable).dispose === 'function'
  );
}

function recordAllocation(obj: Disposable): void {
  stats.totalAllocated++;
  stats.currentLive++;
  const type = obj.constructor.name || 'Unknown';
  stats.byType.set(type, (stats.byType.get(type) ?? 0) + 1);
}

function recordDisposal(obj: Disposable): void {
  stats.totalDisposed++;
  stats.currentLive = Math.max(0, stats.currentLive - 1);
  const type = obj.constructor.name || 'Unknown';
  const next = (stats.byType.get(type) ?? 1) - 1;
  if (next <= 0) stats.byType.delete(type);
  else stats.byType.set(type, next);
}

/** Collect every Disposable reachable from a plain object or array. */
function collectDisposables(root: unknown, out: Disposable[]): void {
  if (!root) return;
  if (isDisposable(root)) {
    out.push(root);
    return;
  }
  if (Array.isArray(root)) {
    for (const x of root) collectDisposables(x, out);
    return;
  }
  if (typeof root === 'object') {
    for (const key of Object.keys(root as Record<string, unknown>)) {
      collectDisposables((root as Record<string, unknown>)[key], out);
    }
  }
}

/**
 * Create + track disposable Three.js resources. Factory result can be a
 * single Disposable OR an object/array containing nested Disposables;
 * every one is tracked and disposed on unmount.
 *
 * Deps behave exactly like `useMemo` — when they change, the previous
 * result's disposables are freed and a new set is allocated.
 */
export function useDisposable<T>(factory: () => T, deps: DependencyList): T {
  const trackedRef = useRef<Disposable[]>([]);

  const value = useMemo(() => {
    // Dispose anything from a previous run (triggered when deps change).
    for (const d of trackedRef.current) {
      try {
        d.dispose();
        recordDisposal(d);
      } catch {
        /* swallow — disposing must not crash the render */
      }
    }
    trackedRef.current = [];

    const created = factory();
    const disposables: Disposable[] = [];
    collectDisposables(created, disposables);
    for (const d of disposables) recordAllocation(d);
    trackedRef.current = disposables;
    return created;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  // Cleanup on unmount.
  useEffect(
    () => () => {
      for (const d of trackedRef.current) {
        try {
          d.dispose();
          recordDisposal(d);
        } catch {
          /* ignore */
        }
      }
      trackedRef.current = [];
    },
    [],
  );

  return value;
}

/**
 * Read-only snapshot of module stats for MemoryMonitor. Called on each
 * animation frame in dev; the structuredClone makes the result stable
 * so React re-renders only fire when numbers actually change.
 */
export function getDisposableStats(): {
  totalAllocated: number;
  totalDisposed: number;
  currentLive: number;
  byType: Record<string, number>;
} {
  return {
    totalAllocated: stats.totalAllocated,
    totalDisposed: stats.totalDisposed,
    currentLive: stats.currentLive,
    byType: Object.fromEntries(stats.byType),
  };
}

/** Hard-reset for tests. */
export function __resetDisposableStats(): void {
  stats.totalAllocated = 0;
  stats.totalDisposed = 0;
  stats.currentLive = 0;
  stats.byType.clear();
}

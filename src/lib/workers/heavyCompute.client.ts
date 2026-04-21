// ════════════════════════════════════════════════════════════════
// heavyCompute.client — T12 PERF-MED-004 (Opt A)
// ════════════════════════════════════════════════════════════════
// Main-thread access point for the heavyCompute Web Worker. Lazy-
// instantiates the worker on first call and wraps it with a Comlink
// proxy so callers see a plain async function interface.
//
// Usage:
//   const api = getHeavyComputeClient();
//   const res = await api.filterContentSafety(text);
//
// Fallback: if Worker isn't available (SSR, old Safari, locked-down
// iframes), callers get the same API but running on the main thread
// via the direct imports from heavyCompute.worker. Callers do NOT
// need to branch — identity is preserved.
//
// Lifecycle: the worker stays alive for the session. If consumers
// need to free it, call `terminateHeavyComputeClient()` (e.g. in
// an app-level cleanup).
// ════════════════════════════════════════════════════════════════

import { wrap, type Remote } from 'comlink';
import type { HeavyComputeAPIType } from './heavyCompute.worker';

// Direct fallback imports — used on SSR and when Worker is unavailable.
import {
  HeavyComputeAPI as FallbackAPI,
  filterContentSafety,
  filterContentSafetyBatch,
  computeScoreBreakdown,
  hashStrings,
  integrateParticlesWorker,
} from './heavyCompute.worker';

export type HeavyComputeClient =
  | Remote<HeavyComputeAPIType>
  | typeof FallbackAPI;

let _client: HeavyComputeClient | null = null;
let _worker: Worker | null = null;
let _workerUnsupported = false;

function isWorkerSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof Worker !== 'undefined' &&
    // Some sandboxed envs expose Worker but throw on construction.
    !_workerUnsupported
  );
}

function createClient(): HeavyComputeClient {
  if (!isWorkerSupported()) {
    return {
      filterContentSafety,
      filterContentSafetyBatch,
      computeScoreBreakdown,
      hashStrings,
      integrateParticles: integrateParticlesWorker,
    };
  }

  try {
    // Vite / Webpack / Turbopack all understand the `new URL()`
    // idiom and will emit the worker as its own bundle entry.
    _worker = new Worker(
      new URL('./heavyCompute.worker.ts', import.meta.url),
      { type: 'module', name: 'sparkforge-heavy-compute' },
    );
  } catch (err) {
    console.warn(
      '[heavyCompute] Worker construction failed — falling back to main-thread compute.',
      err,
    );
    _workerUnsupported = true;
    return {
      filterContentSafety,
      filterContentSafetyBatch,
      computeScoreBreakdown,
      hashStrings,
      integrateParticles: integrateParticlesWorker,
    };
  }

  return wrap<HeavyComputeAPIType>(_worker);
}

/** Lazy-get the heavyCompute client. Safe to call repeatedly. */
export function getHeavyComputeClient(): HeavyComputeClient {
  if (!_client) {
    _client = createClient();
  }
  return _client;
}

/** Dispose the worker. Next call to `getHeavyComputeClient` re-creates. */
export function terminateHeavyComputeClient(): void {
  if (_worker) {
    _worker.terminate();
    _worker = null;
  }
  _client = null;
}

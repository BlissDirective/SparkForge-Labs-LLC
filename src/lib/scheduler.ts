// ════════════════════════════════════════════════════════════════
// Scheduler — T12 PERF-MED-004 (Opt A + enhanced-B)
// ════════════════════════════════════════════════════════════════
// Cross-browser cooperative scheduler for non-urgent work on the
// main thread. Fallback chain, highest priority first:
//
//   scheduler.postTask (Chrome / Edge, standardized Tasks API)
//     ↓ fallback
//   requestIdleCallback (Chrome / Firefox, no timing guarantee)
//     ↓ fallback
//   queueMicrotask (universal, runs very soon)
//     ↓ fallback
//   setTimeout(0)      (universal, runs on next macrotask)
//
// Use these helpers to break up long-running main-thread work so
// Three.js frame rendering in CockpitCanvas stays at 60 fps. For
// genuinely heavy (>50 ms) compute, offload to a Web Worker —
// see `src/lib/workers/heavyCompute.client.ts`.
//
// Design notes:
//   - API is Promise-based so callers can `await` without building
//     timeout ladders by hand.
//   - `signal` (AbortSignal) support lets callers cancel work when
//     a component unmounts.
//   - Falls back safely during SSR (runs the task synchronously
//     via a microtask — same semantics, no timer needed).
// ════════════════════════════════════════════════════════════════

export type SchedulerPriority =
  | 'user-blocking'
  | 'user-visible'
  | 'background';

export interface ScheduleOptions {
  /** Priority hint for `scheduler.postTask`. */
  priority?: SchedulerPriority;
  /** Milliseconds to wait in `requestIdleCallback` fallback. */
  timeout?: number;
  /** Lets callers cancel pending work. */
  signal?: AbortSignal;
}

// ── Detect native schedulers once ─────────────────────────────────
type PostTaskFn = (
  callback: () => unknown,
  options?: { priority?: SchedulerPriority; signal?: AbortSignal; delay?: number },
) => Promise<unknown>;

interface WindowWithScheduler extends Window {
  scheduler?: { postTask?: PostTaskFn };
}

function getNativeScheduler(): PostTaskFn | null {
  if (typeof window === 'undefined') return null;
  const w = window as WindowWithScheduler;
  const fn = w.scheduler?.postTask;
  return typeof fn === 'function' ? fn.bind(w.scheduler) : null;
}

function getRIC(): typeof requestIdleCallback | null {
  if (typeof window === 'undefined') return null;
  return typeof window.requestIdleCallback === 'function'
    ? window.requestIdleCallback.bind(window)
    : null;
}

// ── Core schedule primitive ───────────────────────────────────────
/**
 * Run `fn` at a later, non-blocking tick. Returns a Promise that
 * resolves with `fn`'s return value (or rejects if `signal` aborts).
 *
 * Prefer `scheduleIdle` / `scheduleBackground` for ergonomic defaults.
 */
export function schedule<T>(
  fn: () => T | Promise<T>,
  opts: ScheduleOptions = {},
): Promise<T> {
  const { priority = 'background', timeout = 200, signal } = opts;

  // Honor a pre-aborted signal immediately.
  if (signal?.aborted) {
    return Promise.reject(new DOMException('Aborted', 'AbortError'));
  }

  return new Promise<T>((resolve, reject) => {
    const runner = () => {
      if (signal?.aborted) {
        reject(new DOMException('Aborted', 'AbortError'));
        return;
      }
      try {
        Promise.resolve(fn()).then(resolve, reject);
      } catch (err) {
        reject(err);
      }
    };

    // 1. scheduler.postTask (Tasks API — preferred when available)
    const postTask = getNativeScheduler();
    if (postTask) {
      postTask(runner, { priority, signal }).catch(reject);
      return;
    }

    // 2. requestIdleCallback — lets browser decide when to run.
    //    Only for non-visible priorities; user-blocking must run fast.
    const ric = getRIC();
    if (ric && priority !== 'user-blocking') {
      const handle = ric(runner, { timeout });
      if (signal) {
        signal.addEventListener(
          'abort',
          () => {
            if (typeof window !== 'undefined' && 'cancelIdleCallback' in window) {
              window.cancelIdleCallback(handle);
            }
            reject(new DOMException('Aborted', 'AbortError'));
          },
          { once: true },
        );
      }
      return;
    }

    // 3. queueMicrotask for user-blocking on platforms without postTask.
    if (priority === 'user-blocking' && typeof queueMicrotask === 'function') {
      queueMicrotask(runner);
      return;
    }

    // 4. setTimeout(0) — universal macrotask fallback (Safari, SSR).
    const t = setTimeout(runner, 0);
    if (signal) {
      signal.addEventListener(
        'abort',
        () => {
          clearTimeout(t);
          reject(new DOMException('Aborted', 'AbortError'));
        },
        { once: true },
      );
    }
  });
}

/** Run `fn` soon, but without blocking layout/paint. */
export function scheduleIdle<T>(
  fn: () => T | Promise<T>,
  opts: Omit<ScheduleOptions, 'priority'> = {},
): Promise<T> {
  return schedule(fn, { ...opts, priority: 'user-visible' });
}

/** Run `fn` when the browser is truly idle. Best for analytics, telemetry. */
export function scheduleBackground<T>(
  fn: () => T | Promise<T>,
  opts: Omit<ScheduleOptions, 'priority'> = {},
): Promise<T> {
  return schedule(fn, { ...opts, priority: 'background' });
}

/** Break a large synchronous list into cooperative chunks. Each chunk
 *  yields to the scheduler so the event loop stays responsive.
 *
 *  @example
 *    await yieldingForEach(heavyList, (item) => {
 *      process(item); // runs on main thread but in small slices
 *    }, { chunkSize: 100 });
 */
export async function yieldingForEach<T>(
  items: readonly T[],
  each: (item: T, index: number) => void | Promise<void>,
  opts: { chunkSize?: number; signal?: AbortSignal } = {},
): Promise<void> {
  const { chunkSize = 50, signal } = opts;
  for (let i = 0; i < items.length; i += chunkSize) {
    if (signal?.aborted) throw new DOMException('Aborted', 'AbortError');
    const chunk = items.slice(i, i + chunkSize);
    for (let j = 0; j < chunk.length; j++) {
      await each(chunk[j], i + j);
    }
    // Yield between chunks via the scheduler.
    if (i + chunkSize < items.length) {
      await scheduleIdle(() => undefined, { signal });
    }
  }
}

/** Expose detection for tests + consumers that want to branch. */
export const SchedulerCapabilities = {
  hasPostTask: () => getNativeScheduler() !== null,
  hasRequestIdleCallback: () => getRIC() !== null,
};

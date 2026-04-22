// ════════════════════════════════════════════════════════════════
// offlineMutationQueue — STATE-ENH Offline-first (Max)
// Phase 5 task #10 · Final-Audit_04-15-2026.md
// ════════════════════════════════════════════════════════════════
// IndexedDB-backed queue of mutations that failed because navigator
// was offline. On reconnect the queue is drained in FIFO order.
//
// Consumers register a mutationFn by key (`registerOfflineMutationFn`)
// so `drainOfflineQueue()` can replay the call without importing the
// React Query-bound version of the same function.
//
// Backed by `idb-keyval` for simplicity — for Phase 5 Max scope a full
// IDB schema is unnecessary. If queue size ever exceeds ~1000 entries
// we swap to `idb` with a proper store + cursor.
// ════════════════════════════════════════════════════════════════

import { createStore, get, set, del, keys } from 'idb-keyval';

const STORE_NAME = 'sparkforge-offline-mutations';
let store: ReturnType<typeof createStore> | null = null;

function getStore(): ReturnType<typeof createStore> | null {
  if (typeof indexedDB === 'undefined') return null;
  if (!store) {
    try {
      store = createStore('sparkforge', STORE_NAME);
    } catch {
      return null;
    }
  }
  return store;
}

export interface QueuedMutation<TVars = unknown> {
  /** Monotonic id used as IDB key. */
  id: string;
  mutationKey: readonly unknown[] | null;
  /** Serialized mutation input. */
  vars: TVars;
  /** Epoch ms. */
  enqueuedAt: number;
  /** Increment when a replay fails but is retryable. */
  attempts: number;
}

export async function enqueueOfflineMutation<TVars>(
  payload: Omit<QueuedMutation<TVars>, 'id' | 'enqueuedAt' | 'attempts'>,
): Promise<void> {
  const s = getStore();
  if (!s) return;
  const id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
  const record: QueuedMutation<TVars> = {
    id,
    mutationKey: payload.mutationKey ?? null,
    vars: payload.vars,
    enqueuedAt: Date.now(),
    attempts: 0,
  };
  await set(id, record, s);
}

export async function peekOfflineQueue(): Promise<QueuedMutation[]> {
  const s = getStore();
  if (!s) return [];
  const ids = (await keys(s)) as IDBValidKey[];
  const out: QueuedMutation[] = [];
  for (const id of ids) {
    const row = (await get(id as string, s)) as QueuedMutation | undefined;
    if (row) out.push(row);
  }
  return out.sort((a, b) => a.enqueuedAt - b.enqueuedAt);
}

export async function dropOfflineMutation(id: string): Promise<void> {
  const s = getStore();
  if (!s) return;
  await del(id, s);
}

// ─── Replay registry ─────────────────────────────────────────────

type MutationFn = (vars: unknown) => Promise<unknown>;

const REGISTRY = new Map<string, MutationFn>();

function keyToString(key: readonly unknown[] | null): string {
  if (!key) return '__anon__';
  return key.map((k) => (typeof k === 'string' ? k : JSON.stringify(k))).join('|');
}

export function registerOfflineMutationFn(
  mutationKey: readonly unknown[],
  fn: MutationFn,
): void {
  REGISTRY.set(keyToString(mutationKey), fn);
}

export async function drainOfflineQueue(opts?: {
  onReplay?: (q: QueuedMutation, ok: boolean) => void;
  maxAttempts?: number;
}): Promise<{ replayed: number; failed: number; queued: number }> {
  const s = getStore();
  if (!s) return { replayed: 0, failed: 0, queued: 0 };

  const queue = await peekOfflineQueue();
  let replayed = 0;
  let failed = 0;
  const maxAttempts = opts?.maxAttempts ?? 5;

  for (const q of queue) {
    if (typeof navigator !== 'undefined' && !navigator.onLine) break;
    const fn = REGISTRY.get(keyToString(q.mutationKey));
    if (!fn) {
      // No handler registered — keep in queue; maybe a later page
      // load registers one.
      continue;
    }
    try {
      await fn(q.vars);
      await dropOfflineMutation(q.id);
      replayed += 1;
      opts?.onReplay?.(q, true);
    } catch {
      const nextAttempts = q.attempts + 1;
      if (nextAttempts >= maxAttempts) {
        // Give up — remove from queue so it doesn't loop forever.
        await dropOfflineMutation(q.id);
        failed += 1;
        opts?.onReplay?.(q, false);
      } else {
        await set(q.id, { ...q, attempts: nextAttempts }, s);
      }
    }
  }

  return {
    replayed,
    failed,
    queued: (await peekOfflineQueue()).length,
  };
}

/**
 * Wire `online` event to the queue drainer. Idempotent — safe to call
 * from multiple components; subsequent calls are no-ops.
 */
let wired = false;
export function wireOfflineReplay(opts?: {
  onDrainComplete?: (result: { replayed: number; failed: number; queued: number }) => void;
}): () => void {
  if (wired || typeof window === 'undefined') return () => {};
  wired = true;
  const handler = async () => {
    const result = await drainOfflineQueue();
    opts?.onDrainComplete?.(result);
  };
  window.addEventListener('online', handler);
  // Drain once on wire-up in case we came back online before wiring.
  if (navigator.onLine) void handler();
  return () => {
    window.removeEventListener('online', handler);
    wired = false;
  };
}

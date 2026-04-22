'use client';

// ════════════════════════════════════════════════════════════════
// useOptimisticMutation — STATE-ENH Optimistic Update Primitives (Max)
// Phase 5 task #10 · Final-Audit_04-15-2026.md
// ════════════════════════════════════════════════════════════════
// React Query mutation with built-in:
//   - Optimistic cache update via user-supplied `optimisticUpdate`
//   - Automatic rollback on mutation failure
//   - Conflict detection + onConflict handler (server returned a
//     different value than we predicted — user needs to pick)
//   - Loop-index tagging (Mythos §8.7) so two in-flight optimistic
//     writes can be distinguished during rollback
//
// Consumers opt in per-mutation:
//
//   const award = useOptimisticMutation<number, { delta: number }>({
//     mutationKey: ['child', childId, 'xp'],
//     queryKeys: [['child', childId]],
//     mutationFn: async ({ delta }) => apiFetch(...),
//     optimisticUpdate: (prev, vars) => (prev ?? 0) + vars.delta,
//     onConflict: ({ predicted, actual }) => openConflictResolver(...),
//   });
//
// Network outages: mutations are stored in the offline queue (see
// offlineMutationQueue.ts) and replayed on reconnect.
// ════════════════════════════════════════════════════════════════

import {
  useMutation,
  useQueryClient,
  type MutationKey,
  type QueryKey,
  type UseMutationOptions,
} from '@tanstack/react-query';
import { enqueueOfflineMutation } from '@/lib/state/offlineMutationQueue';

export interface OptimisticMutationOptions<TData, TVars, TContext = unknown> {
  mutationKey?: MutationKey;
  /** Query keys whose cache data should be optimistically patched. */
  queryKeys: QueryKey[];
  /** The actual server call. */
  mutationFn: (vars: TVars) => Promise<TData>;
  /**
   * Produce the optimistic cache value given the previous cache value
   * and the mutation vars. Receives `undefined` when the cache had no
   * value yet.
   */
  optimisticUpdate: (prev: TData | undefined, vars: TVars) => TData;
  /**
   * Called when the server returns a value that doesn't match the
   * optimistic prediction. Caller typically opens a ConflictResolver
   * dialog. Default: accept server value.
   */
  onConflict?: (args: {
    predicted: TData;
    actual: TData;
    queryKey: QueryKey;
  }) => void;
  /** Deep-equality comparator for conflict detection. Default: JSON.stringify. */
  isEqual?: (a: TData, b: TData) => boolean;
  /** Queue the mutation for replay when offline (default true). */
  queueWhenOffline?: boolean;
  /** Forward remaining options to react-query. */
  reactQuery?: Omit<
    UseMutationOptions<TData, Error, TVars, TContext>,
    'mutationFn' | 'mutationKey' | 'onMutate' | 'onError' | 'onSettled'
  >;
}

export interface OptimisticContext<TData> {
  snapshots: Array<{ queryKey: QueryKey; prev: TData | undefined }>;
  loopIndex: number;
}

// Monotonic counter per session so concurrent optimistic writes get
// distinguishable indices (Mythos §8.7 loop-index analogy).
let LOOP_INDEX = 0;

export function useOptimisticMutation<TData, TVars>(
  opts: OptimisticMutationOptions<TData, TVars>,
) {
  const qc = useQueryClient();
  const queueWhenOffline = opts.queueWhenOffline ?? true;
  const isEqual =
    opts.isEqual ??
    ((a: TData, b: TData) => JSON.stringify(a) === JSON.stringify(b));

  return useMutation<TData, Error, TVars, OptimisticContext<TData>>({
    mutationKey: opts.mutationKey,
    mutationFn: async (vars: TVars) => {
      if (queueWhenOffline && typeof navigator !== 'undefined' && !navigator.onLine) {
        await enqueueOfflineMutation({
          mutationKey: opts.mutationKey ?? null,
          // We stash the vars as JSON — the replay path rebuilds the
          // mutation via the registered mutationFn (consumers must
          // register via `registerOfflineMutationFn`).
          vars,
        });
        // Defer resolution until the queue replays — return the
        // optimistic value so the UI stays consistent.
        throw new Error('__offline_queued__');
      }
      return opts.mutationFn(vars);
    },
    onMutate: async (vars) => {
      LOOP_INDEX = (LOOP_INDEX + 1) & 0xffff_ffff;
      const loopIndex = LOOP_INDEX;
      const snapshots: OptimisticContext<TData>['snapshots'] = [];
      for (const key of opts.queryKeys) {
        await qc.cancelQueries({ queryKey: key });
        const prev = qc.getQueryData<TData>(key);
        snapshots.push({ queryKey: key, prev });
        const next = opts.optimisticUpdate(prev, vars);
        qc.setQueryData(key, next);
      }
      return { snapshots, loopIndex };
    },
    onError: (err, _vars, ctx) => {
      // Swallow the offline-queued sentinel without rolling back —
      // the optimistic value becomes the UI's source of truth until
      // the replay lands.
      if ((err as Error)?.message === '__offline_queued__') return;
      if (!ctx) return;
      for (const { queryKey, prev } of ctx.snapshots) {
        qc.setQueryData(queryKey, prev);
      }
    },
    onSuccess: (data, _vars, ctx) => {
      if (!ctx) return;
      for (const { queryKey, prev } of ctx.snapshots) {
        const predicted = qc.getQueryData<TData>(queryKey);
        if (predicted === undefined || prev === undefined) continue;
        if (!isEqual(predicted, data)) {
          opts.onConflict?.({ predicted, actual: data, queryKey });
        }
      }
    },
    onSettled: () => {
      // Let react-query invalidate + re-fetch so the server value
      // becomes authoritative even when our prediction matched.
      for (const key of opts.queryKeys) {
        qc.invalidateQueries({ queryKey: key });
      }
    },
    ...opts.reactQuery,
  });
}

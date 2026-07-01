import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { useChildStore } from '@/stores/childStore';
import type { Child } from '@/types';

// STATE-MED-001 (B-full): React Query is the source of truth for child
// data. childStore holds the active-child selection (activeChildId)
// only. All consumers read child fields (xp, level, age_band, etc.)
// via useActiveChild() — never via a childStore snapshot, which no
// longer exists after T5c-C4.
export function useChildren() {
  return useQuery({
    queryKey: ['children'],
    queryFn: () => apiFetch<Child[]>('/api/children'),
  });
}

/**
 * STATE-MED-001 (B-full): Resolve the active child against the live
 * React Query cache so reads are always fresh (within `staleTime`)
 * and reconcile across tabs on window focus.
 *
 * Returns `undefined` while children are loading, or when no child is
 * selected. Consumers should treat `undefined` the same as the prior
 * `activeChild === null` case.
 *
 * Usage:
 *   const child = useActiveChild();
 *   const xp = child?.xp ?? 0;
 */
export function useActiveChild(): Child | undefined {
  const { data: children } = useChildren();
  const activeChildId = useChildStore((s) => s.activeChildId);

  return useMemo(() => {
    if (!children || children.length === 0) return undefined;
    // Fall back to the first child when no selection exists (fresh
    // device / cleared storage) or the stored id no longer matches
    // (profile deleted, different account on the same browser).
    // Without this every page dead-ends on "pick a profile" even
    // though the account has exactly one child.
    const selected = activeChildId
      ? children.find((c) => c.id === activeChildId)
      : undefined;
    return selected ?? children[0];
  }, [activeChildId, children]);
}

export function useCreateChild() {
  const qc = useQueryClient();
  const setActiveChildId = useChildStore((s) => s.setActiveChildId);

  return useMutation({
    mutationFn: (body: { displayName: string; ageBand: string; birthYear?: number }) =>
      apiFetch<Child>('/api/children', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: (newChild) => {
      // T5c-C4: React Query cache update + invalidate so useChildren
      // subscribers see the new child immediately. childStore no
      // longer tracks the children list — nothing to setChildren().
      qc.setQueryData<Child[]>(['children'], (prev) =>
        prev ? [...prev, newChild] : [newChild],
      );
      qc.invalidateQueries({ queryKey: ['children'] });
      // If this is the first child, auto-select it.
      const currentId = useChildStore.getState().activeChildId;
      if (!currentId) {
        setActiveChildId(newChild.id);
      }
    },
  });
}

export function useUpdateChild() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ childId, ...body }: { childId: string } & Record<string, unknown>) =>
      apiFetch(`/api/children/${childId}`, { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['children'] }),
  });
}

export function useDeleteChild() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (childId: string) =>
      apiFetch(`/api/children/${childId}`, { method: 'DELETE' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['children'] }),
  });
}

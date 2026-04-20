import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { useChildStore } from '@/stores/childStore';
import type { Child } from '@/types';

// STATE-MED-001 (B-full): React Query is now the source of truth for
// child data. childStore holds the active-child *selection* only (T5c
// tightens this further). All consumers should read child fields
// (xp, level, badges, etc.) via useActiveChild() — never via the
// childStore.activeChild snapshot, which can be stale across tabs and
// after server-side mutations.
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
  // Reads activeChild.id from childStore for back-compat; T5c will
  // shrink this to a plain `activeChildId: string | null` field.
  const activeChildId = useChildStore((s) => s.activeChild?.id);

  return useMemo(() => {
    if (!activeChildId || !children) return undefined;
    return children.find((c) => c.id === activeChildId);
  }, [activeChildId, children]);
}

export function useCreateChild() {
  const qc = useQueryClient();
  const { setChildren, setActiveChild } = useChildStore();

  return useMutation({
    mutationFn: (body: { displayName: string; ageBand: string; birthYear?: number }) =>
      apiFetch<Child>('/api/children', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: (newChild) => {
      qc.invalidateQueries({ queryKey: ['children'] });
      const current = useChildStore.getState().children;
      const updated = [...current, newChild];
      setChildren(updated);
      if (updated.length === 1) setActiveChild(newChild);
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

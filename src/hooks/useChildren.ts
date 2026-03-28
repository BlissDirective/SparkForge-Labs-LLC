import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import { useChildStore } from '@/stores/childStore';
import type { Child } from '@/types';

export function useChildren() {
  return useQuery({
    queryKey: ['children'],
    queryFn: () => apiFetch<Child[]>('/api/children'),
  });
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

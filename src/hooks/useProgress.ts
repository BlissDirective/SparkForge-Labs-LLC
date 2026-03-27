import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

// All progress records for a child
export function useChildProgress(childId: string) {
  return useQuery({
    queryKey: ['progress', childId],
    queryFn: () => apiFetch(`/api/progress?childId=${childId}`),
    enabled: !!childId,
  });
}

// Completion % for a specific lab (uses get_lab_progress DB function)
// v2 [ENH]: staleTime 2 minutes
export function useLabProgress(childId: string, labNumber: number) {
  return useQuery({
    queryKey: ['progress', 'lab', childId, labNumber],
    queryFn: () => apiFetch(`/api/progress/world?childId=${childId}&world=${labNumber}`),
    enabled: !!childId && !!labNumber,
    staleTime: 2 * 60 * 1000, // v2 [ENH]: 2 minutes
  });
}

// v2 [BUG-3]: Single API call for all 10 labs
// Previously: 10 parallel calls to /api/progress/world
// Now: 1 call to /api/progress/all-labs (created in Stage 2 v2)
export function useAllLabsProgress(childId: string) {
  return useQuery({
    queryKey: ['progress', 'all-labs', childId],
    queryFn: () => apiFetch(`/api/progress/all-labs?childId=${childId}`),
    enabled: !!childId,
    staleTime: 2 * 60 * 1000, // v2 [ENH]: 2 minutes
  });
}

// Mark content item as completed
export function useCompleteContent() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (body: { childId: string; contentId: string; score?: number; timeSpentSeconds?: number }) =>
      apiFetch('/api/progress', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['progress', variables.childId] });
      qc.invalidateQueries({ queryKey: ['progress', 'lab'] });
      qc.invalidateQueries({ queryKey: ['progress', 'all-labs'] });
    },
  });
}

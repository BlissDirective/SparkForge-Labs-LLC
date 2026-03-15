// ════════════════════════════════════════════════════
// WARNING: THIS FILE IS A PLACEHOLDER
// ════════════════════════════════════════════════════
//
// Stage 4 (Core Pages) REPLACES this entire file with 4 specialized
// hook files that provide full functionality:
//
//   src/hooks/useChildren.ts     — CRUD for child profiles
//   src/hooks/useContent.ts      — Content fetching + daily challenge
//   src/hooks/useProgress.ts     — Progress tracking + lab completion
//   src/hooks/useGamification.ts — XP, streaks, badges, combined flow
//
// DO NOT build features against these stubs.
// They exist only so the project compiles after Stage 2.
//
// After completing Stage 4, DELETE this file:
//   Remove-Item -Path "src/hooks/useApi.ts" -ErrorAction SilentlyContinue
//
// ════════════════════════════════════════════════════

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { Child, Content, Badge } from '@/types';

// ═══ QUERY KEYS ═══

export const queryKeys = {
  me: ['me'] as const,
  children: ['children'] as const,
  child: (id: string) => ['children', id] as const,
  content: (filters?: Record<string, unknown>) => ['content', filters] as const,
  contentBySlug: (slug: string) => ['content', 'slug', slug] as const,
  progress: (childId: string) => ['progress', childId] as const,
  labProgress: (childId: string, world: number) => ['progress', childId, 'lab', world] as const,
  allLabsProgress: (childId: string) => ['progress', childId, 'all-labs'] as const,
  badges: (childId: string) => ['badges', childId] as const,
};

// ═══ AUTH HOOK (stub) ═══

export function useMe() {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: () => api.get<{ id: string; email: string; subscriptionTier: string }>('/api/auth/me'),
  });
}

// ═══ CHILDREN HOOKS (stubs) ═══

export function useChildren() {
  return useQuery({
    queryKey: queryKeys.children,
    queryFn: () => api.get<Child[]>('/api/children'),
  });
}

export function useCreateChild() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { displayName: string; ageBand: string }) =>
      api.post<Child>('/api/children', data),
    onSuccess: () => qc.invalidateQueries({ queryKey: queryKeys.children }),
  });
}

// ═══ CONTENT HOOKS (stubs) ═══

export function useContent(filters?: { world?: number; ageBand?: string; type?: string }) {
  const params = new URLSearchParams();
  if (filters?.world) params.set('world', String(filters.world));
  if (filters?.ageBand) params.set('ageBand', filters.ageBand);
  if (filters?.type) params.set('type', filters.type);
  const qs = params.toString();

  return useQuery({
    queryKey: queryKeys.content(filters),
    queryFn: () => api.get<Content[]>(`/api/content${qs ? `?${qs}` : ''}`),
  });
}

// ═══ PROGRESS HOOKS (stubs) ═══

export function useProgress(childId: string) {
  return useQuery({
    queryKey: queryKeys.progress(childId),
    queryFn: () => api.get(`/api/progress?childId=${childId}`),
    enabled: !!childId,
  });
}

// v2 [BUG-3]: All-labs progress stub (calls new bulk endpoint)
export function useAllLabsProgress(childId: string) {
  return useQuery({
    queryKey: queryKeys.allLabsProgress(childId),
    queryFn: () => api.get<Array<{
      labId: number; totalItems: number; completedItems: number; percent: number;
    }>>(`/api/progress/all-labs?childId=${childId}`),
    enabled: !!childId,
  });
}

// ═══ GAMIFICATION HOOKS (stubs) ═══

export function useAwardXP() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { childId: string; amount: number; source: string }) =>
      api.post('/api/gamification/xp', data),
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: queryKeys.child(variables.childId) });
      qc.invalidateQueries({ queryKey: queryKeys.children });
    },
  });
}

export function useUpdateStreak() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (childId: string) =>
      api.post('/api/gamification/streak', { childId }),
    onSuccess: (_, childId) => {
      qc.invalidateQueries({ queryKey: queryKeys.child(childId) });
    },
  });
}

export function useBadges(childId: string) {
  return useQuery({
    queryKey: queryKeys.badges(childId),
    queryFn: () => api.get<(Badge & { earned: boolean; earnedAt: string | null })[]>(
      `/api/gamification/badges?childId=${childId}`
    ),
    enabled: !!childId,
  });
}

export function useCheckBadges() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (childId: string) =>
      api.post<{ newBadges: Badge[]; totalEarned: number }>(
        '/api/gamification/badges', { childId }
      ),
    onSuccess: (_, childId) => {
      qc.invalidateQueries({ queryKey: queryKeys.badges(childId) });
    },
  });
}

// ═══ STRIPE HOOKS (stubs) ═══

export function useCheckout() {
  return useMutation({
    mutationFn: (data: { tier: 'plus' | 'forge'; interval?: 'month' | 'year' }) =>
      api.post<{ url: string }>('/api/stripe/checkout', data),
    onSuccess: (data) => {
      if (data.url) window.location.href = data.url;
    },
  });
}

export function usePortal() {
  return useMutation({
    mutationFn: () => api.post<{ url: string }>('/api/stripe/portal', {}),
    onSuccess: (data) => {
      if (data.url) window.location.href = data.url;
    },
  });
}

// ═══ PROMPT LAB HOOK (stub) ═══

export function usePromptLab() {
  return useMutation({
    mutationFn: (data: { childId: string; prompt: string; temperature?: number; ageBand: string }) =>
      api.post<{ reply: string; promptsRemaining: number }>('/api/ai/prompt-lab', data),
  });
}

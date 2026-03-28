import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { Content } from '@/types';

// Fetch all content for a specific lab
// v2 [ENH]: staleTime 10 minutes
export function useLabContent(labNumber: number, ageBand: string) {
  return useQuery({
    queryKey: ['content', 'lab', labNumber, ageBand],
    queryFn: () => apiFetch<{ items: Content[] }>(`/api/content?world=${labNumber}&ageBand=${ageBand}&limit=50`),
    enabled: !!labNumber && !!ageBand,
    staleTime: 10 * 60 * 1000, // v2 [ENH]: 10 minutes
  });
}

// Fetch single content item by slug
// v2 [ENH]: staleTime 30 minutes
export function useContentBySlug(slug: string) {
  return useQuery({
    queryKey: ['content', 'slug', slug],
    queryFn: () => apiFetch<Content>(`/api/content/${slug}`),
    enabled: !!slug,
    staleTime: 30 * 60 * 1000, // v2 [ENH]: 30 minutes
  });
}

// Fetch all content for an age band (no lab filter)
export function useAllContent(ageBand: string) {
  return useQuery({
    queryKey: ['content', 'all', ageBand],
    queryFn: () => apiFetch<{ items: Content[] }>(`/api/content?ageBand=${ageBand}&limit=50`),
    enabled: !!ageBand,
  });
}

// Daily challenge: picks a semi-random item based on today's date
export function useDailyChallenge(ageBand: string) {
  return useQuery({
    queryKey: ['content', 'daily', ageBand],
    queryFn: () => apiFetch<{ items: Content[] }>(`/api/content?ageBand=${ageBand}&limit=5`),
    enabled: !!ageBand,
    staleTime: 60 * 60 * 1000, // 1 hour
    select: (data) => {
      const items = data?.items || [];
      if (items.length === 0) return null;
      const dayIndex = new Date().getDate() % items.length;
      return items[dayIndex];
    },
  });
}

// Latest content (prioritizes AI-generated)
export function useLatestContent(ageBand: string) {
  return useQuery({
    queryKey: ['content', 'latest', ageBand],
    queryFn: () => apiFetch<{ items: Content[] }>(`/api/content?ageBand=${ageBand}&limit=3`),
    enabled: !!ageBand,
    select: (data) => {
      const items = data?.items || [];
      return items.find((i) => i.is_agent_generated) || items[0] || null;
    },
  });
}

// ════════════════════════════════════════════════════
// useParentUsage — Fetches /api/parent/usage
// v3 Gap 4: React Query wrapper, 60s staleTime so meters
// refresh on mount + every minute without hammering the DB.
// ════════════════════════════════════════════════════
'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';
import type { SubscriptionTier } from '@/lib/tier-config';

export interface ParentUsageChild {
  id: string;
  displayName: string;
  ageBand: 'A' | 'B' | 'C';
  promptsUsedToday: number;
  promptsRemaining: number;
  gamesPlayedThisWeek: number;
  gamesRemaining: number | null;
}

export interface ParentUsage {
  tier: SubscriptionTier;
  limits: {
    promptsPerDay: number;
    gamesPerWeek: number | null;
    maxChildren: number;
  };
  totals: {
    childrenCount: number;
    maxChildren: number;
    promptsUsedToday: number;
    promptsLimitToday: number;
    gamesPlayedThisWeek: number;
    gamesLimitThisWeek: number | null;
  };
  perChild: ParentUsageChild[];
}

export function useParentUsage() {
  return useQuery({
    queryKey: ['parent', 'usage'],
    queryFn: () => apiFetch<ParentUsage>('/api/parent/usage'),
    staleTime: 60_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
}

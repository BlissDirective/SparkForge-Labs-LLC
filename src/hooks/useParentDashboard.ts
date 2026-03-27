// ════════════════════════════════════════════════════
// PARENT DASHBOARD HOOK — Fetches all child data
// v3: S8-HIGH-002 fix — Uses /api/parent/dashboard (single PG function call)
//     Replaces N+1 client-side Supabase queries
// v2: Uses tier-config.ts imports (BUG-8A fix)
// v2: Fetches daily_time_limit_minutes (ENH-8C)
// ════════════════════════════════════════════════════
'use client';

import { useEffect } from 'react';
import { useParentStore } from '@/stores/parentStore';
import type { SubscriptionTier } from '@/lib/tier-config';

interface DashboardChild {
  id: string;
  display_name: string;
  age_band: 'A' | 'B' | 'C';
  xp: number;
  level: number;
  streak_count: number;
  streak_last_date: string | null;
  lessons_completed: number;
  quizzes_passed: number;
  games_played: number;
  total_time_minutes: number;
  badges_earned: number;
  labs_completed: number;
  last_active: string | null;
  daily_time_limit_minutes: number | null;
}

interface DashboardResponse {
  success: boolean;
  data: {
    tier: SubscriptionTier;
    children: DashboardChild[];
  };
}

export function useParentDashboard() {
  const store = useParentStore();

  useEffect(() => {
    async function load() {
      store.setLoading(true);

      try {
        const res = await fetch('/api/parent/dashboard');
        if (!res.ok) {
          store.setLoading(false);
          return;
        }

        const json: DashboardResponse = await res.json();
        if (!json.success || !json.data) {
          store.setLoading(false);
          return;
        }

        store.setTier(json.data.tier);
        store.setChildren(json.data.children);

        if (json.data.children.length > 0 && !store.selectedChildId) {
          store.selectChild(json.data.children[0].id);
        }
      } catch {
        // Network error — leave loading state
      }

      store.setLoading(false);
    }

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return store;
}

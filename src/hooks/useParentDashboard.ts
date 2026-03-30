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
  // Subscribe to individual state slices to avoid re-renders on unrelated store changes
  const isLoading = useParentStore((s) => s.isLoading);
  const tier = useParentStore((s) => s.tier);
  const children = useParentStore((s) => s.children);
  const selectedChildId = useParentStore((s) => s.selectedChildId);

  useEffect(() => {
    async function load() {
      // Use getState() for actions — they are stable references and
      // don't need to trigger re-renders when subscribed via selector
      const { setLoading, setTier, setChildren, selectChild } = useParentStore.getState();

      setLoading(true);

      try {
        const res = await fetch('/api/parent/dashboard');
        if (!res.ok) {
          setLoading(false);
          return;
        }

        const json: DashboardResponse = await res.json();
        if (!json.success || !json.data) {
          setLoading(false);
          return;
        }

        setTier(json.data.tier);
        setChildren(json.data.children);

        if (json.data.children.length > 0 && !useParentStore.getState().selectedChildId) {
          selectChild(json.data.children[0].id);
        }
      } catch {
        // Network error — leave loading state
      }

      setLoading(false);
    }

    load();
  }, []);

  // Expose store actions needed by the parent dashboard page
  // Using getState() to avoid subscribing to action references
  const selectChild = useParentStore((s) => s.selectChild);
  const updateChildTimeLimit = useParentStore((s) => s.updateChildTimeLimit);
  const setChildren = useParentStore((s) => s.setChildren);

  return { isLoading, tier, children, selectedChildId, selectChild, updateChildTimeLimit, setChildren };
}

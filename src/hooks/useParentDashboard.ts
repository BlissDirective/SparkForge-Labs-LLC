// ════════════════════════════════════════════════════
// PARENT DASHBOARD HOOK — Fetches all child data
// v2: Uses tier-config.ts imports (BUG-8A fix)
// v2: Fetches daily_time_limit_minutes (ENH-8C)
// v2: Uses createClient() from @/lib/supabase/client
// ════════════════════════════════════════════════════
'use client';

import { useEffect } from 'react';
import { useParentStore } from '@/stores/parentStore';
import { createClient } from '@/lib/supabase/client';
import type { SubscriptionTier } from '@/lib/tier-config';

export function useParentDashboard() {
  const store = useParentStore();

  useEffect(() => {
    async function load() {
      store.setLoading(true);
      const sb = createClient();

      const {
        data: { user },
      } = await sb.auth.getUser();
      if (!user) {
        store.setLoading(false);
        return;
      }

      const { data: parent } = await sb
        .from('parents')
        .select('subscription_tier')
        .eq('id', user.id)
        .single();

      if (parent?.subscription_tier) {
        store.setTier(parent.subscription_tier as SubscriptionTier);
      }

      const { data: children } = await sb
        .from('children')
        .select('*')
        .eq('parent_id', user.id);

      if (!children) {
        store.setLoading(false);
        return;
      }

      const summaries = await Promise.all(
        children.map(async (child) => {
          const { count: lessonsCount } = await sb
            .from('progress')
            .select('*', { count: 'exact', head: true })
            .eq('child_id', child.id)
            .eq('completed', true);

          const { count: quizCount } = await sb
            .from('progress')
            .select('*', { count: 'exact', head: true })
            .eq('child_id', child.id)
            .eq('completed', true)
            .gte('score', 70);

          const { count: badgeCount } = await sb
            .from('child_badges')
            .select('*', { count: 'exact', head: true })
            .eq('child_id', child.id);

          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          const { count: gamesCount } = await sb
            .from('progress')
            .select('*', { count: 'exact', head: true })
            .eq('child_id', child.id)
            .eq('completed', true)
            .gte('completed_at', weekAgo.toISOString());

          const { data: sessions } = await sb
            .from('sessions')
            .select('duration_seconds')
            .eq('child_id', child.id);

          const totalMinutes = Math.round(
            (sessions ?? []).reduce(
              (sum, row) => sum + (row.duration_seconds ?? 0),
              0
            ) / 60
          );

          const { data: lastSession } = await sb
            .from('sessions')
            .select('started_at')
            .eq('child_id', child.id)
            .order('started_at', { ascending: false })
            .limit(1);

          return {
            id: child.id,
            display_name: child.display_name,
            age_band: child.age_band as 'A' | 'B' | 'C',
            xp: child.xp ?? 0,
            level: child.level ?? 1,
            streak_count: child.streak_count ?? 0,
            streak_last_date: child.streak_last_date ?? null,
            lessons_completed: lessonsCount ?? 0,
            quizzes_passed: quizCount ?? 0,
            games_played: gamesCount ?? 0,
            total_time_minutes: totalMinutes,
            badges_earned: badgeCount ?? 0,
            labs_completed: 0,
            last_active: lastSession?.[0]?.started_at ?? null,
            daily_time_limit_minutes: child.daily_time_limit_minutes ?? null,
          };
        })
      );

      store.setChildren(summaries);
      if (summaries.length > 0 && !store.selectedChildId) {
        store.selectChild(summaries[0].id);
      }
      store.setLoading(false);
    }

    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return store;
}

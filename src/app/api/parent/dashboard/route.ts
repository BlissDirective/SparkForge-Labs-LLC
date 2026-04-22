// ════════════════════════════════════════════════════
// GET /api/parent/dashboard — Aggregated parent dashboard data
// S8-HIGH-002 fix: Single DB call via get_parent_dashboard() PG function
// Replaces N+1 client-side queries (was 6 queries per child)
// ════════════════════════════════════════════════════
import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { apiSuccess, apiError, requireAuth } from '@/lib/api-helpers';
import type { SubscriptionTier } from '@/lib/tier-config';
import { withSupabaseRpc } from '@/lib/sentry-transactions';

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  const supabase = await createServerSupabase();

  // Fetch parent tier
  const { data: parent, error: parentError } = await supabase
    .from('parents')
    .select('subscription_tier')
    .eq('id', auth.user.id)
    .single();

  if (parentError) return apiError('Failed to fetch parent data', 500);

  // Call PG function for all children + aggregated stats in one round-trip
  const { data: children, error: childrenError } = await withSupabaseRpc(
    'get_parent_dashboard',
    () => supabase.rpc('get_parent_dashboard', { p_parent_id: auth.user.id }),
  );

  if (childrenError) {
    console.error('get_parent_dashboard error:', childrenError.message);
    return apiError('Failed to fetch dashboard data', 500);
  }

  return apiSuccess({
    tier: (parent?.subscription_tier ?? 'free') as SubscriptionTier,
    children: (children ?? []).map((c: Record<string, unknown>) => ({
      id: c.child_id,
      display_name: c.display_name,
      age_band: c.age_band as 'A' | 'B' | 'C',
      xp: Number(c.xp) || 0,
      level: Number(c.level) || 1,
      streak_count: Number(c.streak_count) || 0,
      streak_last_date: c.streak_last_date ?? null,
      lessons_completed: Number(c.lessons_completed) || 0,
      quizzes_passed: Number(c.quizzes_passed) || 0,
      games_played: Number(c.games_played) || 0,
      total_time_minutes: Number(c.total_time_minutes) || 0,
      badges_earned: Number(c.badges_earned) || 0,
      labs_completed: 0,
      last_active: c.last_active ?? null,
      daily_time_limit_minutes: c.daily_time_limit_minutes ?? null,
    })),
  });
}

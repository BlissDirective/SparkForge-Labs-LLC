// ════════════════════════════════════════════════════
// TIER ENFORCEMENT — Server-side limit checking
// v2: Uses createServerSupabase (BUG-8C fix)
// ════════════════════════════════════════════════════
import { createServerSupabase } from '@/lib/supabase/server';
import {
  getTierLimits,
  type SubscriptionTier,
} from '@/lib/tier-config';

export async function getParentTier(): Promise<SubscriptionTier> {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return 'free';

  const { data } = await supabase
    .from('parents')
    .select('subscription_tier')
    .eq('id', user.id)
    .single();

  return (data?.subscription_tier as SubscriptionTier) ?? 'free';
}

export async function checkPromptLimit(
  childId: string
): Promise<{ allowed: boolean; used: number; limit: number }> {
  const tier = await getParentTier();
  const limits = getTierLimits(tier);

  const supabase = await createServerSupabase();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { count } = await supabase
    .from('prompt_history')
    .select('*', { count: 'exact', head: true })
    .eq('child_id', childId)
    .gte('created_at', today.toISOString());

  const used = count ?? 0;
  return { allowed: used < limits.promptsPerDay, used, limit: limits.promptsPerDay };
}

export async function checkGameLimit(
  childId: string
): Promise<{ allowed: boolean; used: number; limit: number }> {
  const tier = await getParentTier();
  const limits = getTierLimits(tier);

  if (limits.gamesPerWeek === null) {
    return { allowed: true, used: 0, limit: -1 };
  }

  const supabase = await createServerSupabase();
  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);

  const { count } = await supabase
    .from('progress')
    .select('*', { count: 'exact', head: true })
    .eq('child_id', childId)
    .eq('completed', true)
    .gte('completed_at', weekAgo.toISOString());

  const used = count ?? 0;
  return { allowed: used < limits.gamesPerWeek, used, limit: limits.gamesPerWeek };
}

export async function checkChildLimit(
  parentId: string
): Promise<{ allowed: boolean; count: number; limit: number }> {
  const tier = await getParentTier();
  const limits = getTierLimits(tier);

  const supabase = await createServerSupabase();
  // v3 Gap 3: Only count active (non-archived) children against the tier limit.
  // Archived children (deactivated_at set) preserve their data but don't
  // block creating a new profile after a downgrade.
  const { count } = await supabase
    .from('children')
    .select('*', { count: 'exact', head: true })
    .eq('parent_id', parentId)
    .is('deactivated_at', null);

  return {
    allowed: (count ?? 0) < limits.maxChildren,
    count: count ?? 0,
    limit: limits.maxChildren,
  };
}

export async function checkTimeLimit(
  childId: string
): Promise<{ allowed: boolean; usedMinutes: number; limitMinutes: number | null }> {
  const supabase = await createServerSupabase();

  // Get child's daily time limit
  const { data: child } = await supabase
    .from('children')
    .select('daily_time_limit_minutes')
    .eq('id', childId)
    .single();

  const limitMinutes = child?.daily_time_limit_minutes ?? null;
  if (limitMinutes === null) {
    return { allowed: true, usedMinutes: 0, limitMinutes: null };
  }

  // Sum today's session time
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const { data: sessions } = await supabase
    .from('sessions')
    .select('duration_seconds')
    .eq('child_id', childId)
    .gte('started_at', today.toISOString());

  const usedMinutes = Math.round(
    (sessions ?? []).reduce((sum, row) => sum + (row.duration_seconds ?? 0), 0) / 60
  );

  return { allowed: usedMinutes < limitMinutes, usedMinutes, limitMinutes };
}

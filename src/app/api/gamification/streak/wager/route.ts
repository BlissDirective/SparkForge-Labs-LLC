// POST /api/gamification/streak/wager — Place a streak wager
import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { apiSuccess, apiError, parseBody, requireAuth, verifyChildOwnership } from '@/lib/api-helpers';
import { z } from 'zod';
import { WAGER_CONFIG } from '@/lib/streak/StreakEngine';

const WagerSchema = z.object({
  childId: z.string().uuid(),
  wagerType: z.enum(['7-day', '14-day']),
});

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  const parsed = await parseBody(req, WagerSchema);
  if (!parsed.success) return parsed.response;

  const { childId, wagerType } = parsed.data;

  if (!(await verifyChildOwnership(auth.user.id, childId))) {
    return apiError('Child not found', 404);
  }

  const supabase = await createServerSupabase();

  // Check child's current streak
  const { data: child } = await supabase
    .from('children')
    .select('streak_count, longest_streak')
    .eq('id', childId)
    .single();

  if (!child) return apiError('Child not found', 404);

  // Cannot place wager if streak is 0
  if (child.streak_count < 1) {
    return apiError('Start a streak first before placing a wager!', 400);
  }

  // Cannot place 14-day wager without 14-day streak history
  if (wagerType === '14-day' && (child.longest_streak ?? 0) < 14) {
    return apiError('Reach a 14-day streak first to unlock 14-day wagers!', 400);
  }

  // Check for existing active wager
  const { data: activeWager } = await supabase
    .from('streak_wagers')
    .select('id')
    .eq('child_id', childId)
    .eq('status', 'active')
    .limit(1)
    .single();

  if (activeWager) {
    return apiError('You already have an active wager. Complete it first!', 400);
  }

  const config = WAGER_CONFIG[wagerType];
  const today = new Date().toISOString().split('T')[0];
  const endDate = new Date();
  endDate.setUTCDate(endDate.getUTCDate() + config.daysRequired - 1);

  const { data: wager, error } = await supabase
    .from('streak_wagers')
    .insert({
      child_id: childId,
      wager_type: wagerType,
      gems_bet: config.gemsBet,
      start_date: today,
      end_date: endDate.toISOString().split('T')[0],
      status: 'active',
      days_maintained: 0,
      reward_gems: config.rewardGems,
    })
    .select()
    .single();

  if (error) {
    return apiError('Failed to place wager', 500);
  }

  return apiSuccess({
    wager,
    message: `${wagerType} wager placed! Maintain your streak for ${config.daysRequired} days to win ${config.rewardGems} gems!`,
  });
}

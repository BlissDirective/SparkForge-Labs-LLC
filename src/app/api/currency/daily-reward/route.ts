// POST /api/currency/daily-reward — Claim daily login reward
import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { apiSuccess, apiError, parseBody, requireAuth, verifyChildOwnership } from '@/lib/api-helpers';
import { z } from 'zod';
import { DAILY_REWARDS } from '@/lib/currency/CurrencyEngine';

const DailyRewardSchema = z.object({ childId: z.string().uuid() });

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  const parsed = await parseBody(req, DailyRewardSchema);
  if (!parsed.success) return parsed.response;

  const { childId } = parsed.data;

  if (!(await verifyChildOwnership(auth.user.id, childId))) {
    return apiError('Child not found', 404);
  }

  const supabase = await createServerSupabase();
  const today = new Date().toISOString().split('T')[0];

  // Get wallet
  const { data: wallet } = await supabase
    .from('currency_wallets')
    .select('*')
    .eq('child_id', childId)
    .single();

  if (!wallet) {
    return apiError('Wallet not found', 404);
  }

  // Check if already claimed today
  if (wallet.last_daily_reward === today) {
    return apiError('Daily reward already claimed today! Come back tomorrow!', 400);
  }

  // Calculate streak continuity
  const yesterday = new Date();
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const streakContinues = wallet.last_daily_reward === yesterdayStr;
  const newStreak = streakContinues ? wallet.daily_reward_streak + 1 : 1;
  const rewardDay = Math.min(7, newStreak);
  const reward = DAILY_REWARDS[rewardDay - 1];

  // Award gems
  const newGems = wallet.gems + reward.gems;
  const bonusFreezes = reward.bonusFreeze ? 1 : 0;

  // Update wallet
  const { error: walletError } = await supabase
    .from('currency_wallets')
    .update({
      gems: newGems,
      gems_earned_lifetime: wallet.gems_earned_lifetime + reward.gems,
      last_daily_reward: today,
      daily_reward_streak: newStreak,
      updated_at: new Date().toISOString(),
    })
    .eq('id', wallet.id);

  if (walletError) {
    return apiError('Failed to claim reward', 500);
  }

  // Record transaction
  await supabase.from('currency_transactions').insert({
    child_id: childId,
    type: 'daily_reward',
    amount: reward.gems,
    balance_after: newGems,
    description: reward.description,
  });

  // Award bonus freeze if applicable
  if (bonusFreezes > 0) {
    await supabase.from('streak_freezes').insert({
      child_id: childId,
      source: '7-day-milestone',
    });
  }

  return apiSuccess({
    gemsAwarded: reward.gems,
    freezersAwarded: bonusFreezes,
    newStreak,
    message: `${reward.description} +${reward.gems} gems!`,
  });
}

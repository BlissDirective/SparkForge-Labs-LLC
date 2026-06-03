// ════════════════════════════════════════════════════
// POST /api/quests/claim — Claim quest rewards
// Awards gems + XP, marks quest as claimed
// ════════════════════════════════════════════════════

import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { apiSuccess, apiError, requireAuth, verifyChildOwnership } from '@/lib/api-helpers';
import { z } from 'zod';

const ClaimSchema = z.object({
  childId: z.string().uuid(),
  questId: z.string().uuid(),
});

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError('Invalid JSON body', 400);
  }

  const parsed = ClaimSchema.safeParse(body);
  if (!parsed.success) return apiError('childId and questId required', 400);

  const { childId, questId } = parsed.data;

  if (!(await verifyChildOwnership(auth.user.id, childId))) {
    return apiError('Child not found', 404);
  }

  const supabase = await createServerSupabase();

  try {
    // Fetch quest
    const { data: quest, error: questError } = await supabase
      .from('active_quests')
      .select('*')
      .eq('id', questId)
      .eq('child_id', childId)
      .single();

    if (questError || !quest) return apiError('Quest not found', 404);
    if (quest.status !== 'completed') return apiError('Quest not completed yet', 400);
    if (quest.status === 'claimed') return apiError('Quest already claimed', 400);

    // Get streak days for bonus
    const { data: childRow } = await supabase
      .from('children')
      .select('streak_count')
      .eq('id', childId)
      .single();

    const streakDays = childRow?.streak_count ?? 0;
    const baseGems = quest.gem_reward ?? 0;
    const streakMultiplier = Math.min(2.0, 1 + (streakDays * 0.05));
    const bonusGems = Math.round(baseGems * (streakMultiplier - 1));
    const totalGems = baseGems + bonusGems;
    const xpReward = quest.xp_reward ?? 0;

    // Update quest status
    const now = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('active_quests')
      .update({ status: 'claimed', claimed_at: now })
      .eq('id', questId);

    if (updateError) {
      console.error('[quests:claim:update]', updateError);
      return apiError('Failed to claim quest', 500);
    }

    // Award gems to wallet
    const { data: wallet } = await supabase
      .from('currency_wallets')
      .select('gems, gems_earned_lifetime')
      .eq('child_id', childId)
      .single();

    if (wallet) {
      await supabase
        .from('currency_wallets')
        .update({
          gems: (wallet.gems ?? 0) + totalGems,
          gems_earned_lifetime: (wallet.gems_earned_lifetime ?? 0) + totalGems,
          updated_at: now,
        })
        .eq('child_id', childId);
    } else {
      await supabase.from('currency_wallets').insert({
        child_id: childId,
        gems: totalGems,
        gems_earned_lifetime: totalGems,
        updated_at: now,
      });
    }

    // Log transaction
    await supabase.from('currency_transactions').insert({
      child_id: childId,
      type: 'quest_reward',
      amount: totalGems,
      description: `Quest reward: ${quest.title ?? 'Quest'}`,
      metadata: { quest_id: questId, base_gems: baseGems, bonus_gems: bonusGems, streak_days: streakDays },
    });

    // Award XP (upsert gamification_sessions)
    const today = now.split('T')[0];
    const { data: sessionRow } = await supabase
      .from('gamification_sessions')
      .select('id, xp_earned')
      .eq('child_id', childId)
      .eq('date', today)
      .single();

    if (sessionRow) {
      await supabase
        .from('gamification_sessions')
        .update({ xp_earned: (sessionRow.xp_earned ?? 0) + xpReward })
        .eq('id', sessionRow.id);
    } else {
      await supabase.from('gamification_sessions').insert({
        child_id: childId,
        date: today,
        xp_earned: xpReward,
        games_played: 0,
        minutes_played: 0,
      });
    }

    // Insert into quest history
    await supabase.from('quest_history').insert({
      child_id: childId,
      quest_template_id: quest.template_id,
      title: quest.title,
      difficulty: quest.difficulty,
      rarity: quest.rarity,
      status: 'claimed',
      gems_earned: totalGems,
      xp_earned: xpReward,
      streak_days_at_claim: streakDays,
      claimed_at: now,
    });

    const message = bonusGems > 0
      ? `+${totalGems} gems (+${bonusGems} streak bonus!) and +${xpReward} XP!`
      : `+${totalGems} gems and +${xpReward} XP!`;

    return apiSuccess({
      reward: {
        gems: baseGems,
        xp: xpReward,
        bonusGems,
        totalGems,
        message,
      },
    });
  } catch (err) {
    console.error('[quests:claim]', err);
    return apiError('Failed to claim quest', 500);
  }
}

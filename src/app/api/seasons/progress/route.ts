// ════════════════════════════════════════════════════
// POST /api/seasons/progress — advance seasonal quest progress.
// Body: { childId, metric, amount }
// Called by game/quest completion flows to credit the active season.
// ════════════════════════════════════════════════════

import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { apiSuccess, apiError, requireAuth, verifyChildOwnership } from '@/lib/api-helpers';
import { z } from 'zod';
import {
  getActiveSeason,
  getSeasonalQuests,
  emptyProgress,
  seasonProgressPercent,
  type SeasonProgress,
  type SeasonalQuestMetric,
} from '@/lib/seasons/SeasonEngine';

const Schema = z.object({
  childId: z.string().uuid(),
  metric: z.enum(['games_played', 'quests_completed', 'labs_completed', 'streak_days', 'buddy_quests']),
  amount: z.number().int().min(1).max(100).default(1),
});

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  let body: unknown;
  try { body = await req.json(); } catch { body = {}; }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return apiError('childId and metric required', 400);

  const { childId, metric, amount } = parsed.data;
  if (!(await verifyChildOwnership(auth.user.id, childId))) {
    return apiError('Child not found', 404);
  }

  const season = getActiveSeason();
  if (!season) return apiSuccess({ active: false, percent: 0 });

  const supabase = createAdminClient();

  try {
    const { data: row } = await supabase
      .from('season_progress')
      .select('currency, quest_progress, claimed_quests, purchases, grand_prize_claimed')
      .eq('child_id', childId)
      .eq('season_key', season.key)
      .maybeSingle();

    const progress: SeasonProgress = row
      ? {
          seasonKey: season.key, childId,
          currency: row.currency ?? 0,
          questProgress: row.quest_progress ?? {},
          claimedQuests: row.claimed_quests ?? [],
          purchases: row.purchases ?? [],
          grandPrizeClaimed: row.grand_prize_claimed ?? false,
        }
      : emptyProgress(season.key, childId);

    // Advance every quest in the chain that tracks this metric. Streak quests
    // are set (not incremented) since streak is an absolute value.
    const nextProgress = { ...progress.questProgress };
    for (const quest of getSeasonalQuests(season.key)) {
      if (quest.metric !== (metric as SeasonalQuestMetric)) continue;
      const current = nextProgress[quest.id] ?? 0;
      nextProgress[quest.id] =
        metric === 'streak_days'
          ? Math.min(quest.requirementCount, Math.max(current, amount))
          : Math.min(quest.requirementCount, current + amount);
    }

    const { error } = await supabase
      .from('season_progress')
      .upsert(
        {
          child_id: childId,
          season_key: season.key,
          currency: progress.currency,
          quest_progress: nextProgress,
          claimed_quests: progress.claimedQuests,
          purchases: progress.purchases,
          grand_prize_claimed: progress.grandPrizeClaimed,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'child_id,season_key' },
      );

    if (error) {
      console.error('[seasons:progress:upsert]', error);
      return apiError('Failed to update progress', 500);
    }

    const updated: SeasonProgress = { ...progress, questProgress: nextProgress };
    return apiSuccess({ active: true, percent: seasonProgressPercent(season.key, updated) });
  } catch (err) {
    console.error('[seasons:progress]', err);
    return apiError('Failed to update progress', 500);
  }
}

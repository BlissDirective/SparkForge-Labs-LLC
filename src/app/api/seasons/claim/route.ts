// ════════════════════════════════════════════════════
// POST /api/seasons/claim — claim a completed seasonal quest reward,
//                           or the season grand prize.
// Body: { childId, questId }  |  { childId, grandPrize: true }
// ════════════════════════════════════════════════════

import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import {
  apiSuccess, apiError, requireAuth, verifyChildOwnership,
  applyRateLimit, checkDuplicate,
} from '@/lib/api-helpers';
import { RATE_LIMITS } from '@/lib/rate-limit';
import { z } from 'zod';
import {
  getActiveSeason,
  getSeasonalQuests,
  emptyProgress,
  canClaimQuest,
  canClaimGrandPrize,
  type SeasonProgress,
} from '@/lib/seasons/SeasonEngine';

const Schema = z.object({
  childId: z.string().uuid(),
  questId: z.string().max(64).optional(),
  grandPrize: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  const limited = await applyRateLimit(req, 'seasons-claim', undefined, RATE_LIMITS.social);
  if (limited) return limited;

  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  const dup = await checkDuplicate(req, auth.user.id);
  if (dup) return dup;

  let body: unknown;
  try { body = await req.json(); } catch { body = {}; }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return apiError('childId required', 400);

  const { childId, questId, grandPrize } = parsed.data;
  if (!(await verifyChildOwnership(auth.user.id, childId))) {
    return apiError('Child not found', 404);
  }

  const season = getActiveSeason();
  if (!season) return apiError('No active season', 409);

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

    let currencyDelta = 0;
    const update: Record<string, unknown> = {};

    if (grandPrize) {
      if (!canClaimGrandPrize(season.key, progress)) {
        return apiError('Grand prize not available yet', 409);
      }
      update.grand_prize_claimed = true;
    } else {
      const quest = getSeasonalQuests(season.key).find((q) => q.id === questId);
      if (!quest) return apiError('Quest not found', 404);
      if (!canClaimQuest(quest, progress)) return apiError('Quest not claimable', 409);
      currencyDelta = quest.currencyReward;
      update.currency = progress.currency + currencyDelta;
      update.claimed_quests = [...progress.claimedQuests, quest.id];
    }

    const { error } = await supabase
      .from('season_progress')
      .upsert(
        {
          child_id: childId,
          season_key: season.key,
          currency: (update.currency as number | undefined) ?? progress.currency,
          quest_progress: progress.questProgress,
          claimed_quests: (update.claimed_quests as string[] | undefined) ?? progress.claimedQuests,
          purchases: progress.purchases,
          grand_prize_claimed: (update.grand_prize_claimed as boolean | undefined) ?? progress.grandPrizeClaimed,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'child_id,season_key' },
      );

    if (error) {
      console.error('[seasons:claim:upsert]', error);
      return apiError('Failed to claim', 500);
    }

    return apiSuccess({
      claimed: grandPrize ? 'grand_prize' : questId,
      currencyAwarded: currencyDelta,
      grandPrize: grandPrize ? season.grandPrize : undefined,
    });
  } catch (err) {
    console.error('[seasons:claim]', err);
    return apiError('Failed to claim', 500);
  }
}

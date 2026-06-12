// ════════════════════════════════════════════════════
// POST /api/seasons/purchase — buy a seasonal shop item with
// seasonal currency. Body: { childId, itemId }
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
  getSeasonalItems,
  getSeasonWeek,
  emptyProgress,
  isItemAvailable,
  canAfford,
  type SeasonProgress,
} from '@/lib/seasons/SeasonEngine';

const Schema = z.object({ childId: z.string().uuid(), itemId: z.string().max(64) });

export async function POST(req: NextRequest) {
  const limited = await applyRateLimit(req, 'seasons-purchase', undefined, RATE_LIMITS.social);
  if (limited) return limited;

  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  const dup = await checkDuplicate(req, auth.user.id);
  if (dup) return dup;

  let body: unknown;
  try { body = await req.json(); } catch { body = {}; }
  const parsed = Schema.safeParse(body);
  if (!parsed.success) return apiError('childId and itemId required', 400);

  const { childId, itemId } = parsed.data;
  if (!(await verifyChildOwnership(auth.user.id, childId))) {
    return apiError('Child not found', 404);
  }

  const season = getActiveSeason();
  if (!season) return apiError('No active season', 409);

  const item = getSeasonalItems(season.key).find((i) => i.id === itemId);
  if (!item) return apiError('Item not found', 404);
  if (!isItemAvailable(item, getSeasonWeek(season))) {
    return apiError('Item not available yet', 409);
  }

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

    if (progress.purchases.includes(itemId)) return apiError('Already owned', 409);
    if (!canAfford(item, progress)) return apiError(`Not enough ${season.currencyName}`, 402);

    const { error } = await supabase
      .from('season_progress')
      .upsert(
        {
          child_id: childId,
          season_key: season.key,
          currency: progress.currency - item.cost,
          quest_progress: progress.questProgress,
          claimed_quests: progress.claimedQuests,
          purchases: [...progress.purchases, itemId],
          grand_prize_claimed: progress.grandPrizeClaimed,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'child_id,season_key' },
      );

    if (error) {
      console.error('[seasons:purchase:upsert]', error);
      return apiError('Failed to purchase', 500);
    }

    return apiSuccess({ purchased: itemId, remaining: progress.currency - item.cost });
  } catch (err) {
    console.error('[seasons:purchase]', err);
    return apiError('Failed to purchase', 500);
  }
}

// ════════════════════════════════════════════════════
// GET /api/seasons — active season + this child's progress
// ════════════════════════════════════════════════════

import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { apiSuccess, apiError, requireAuth, verifyChildOwnership } from '@/lib/api-helpers';
import {
  getActiveSeason,
  getSeasonalQuests,
  getSeasonalItems,
  getSeasonWeek,
  emptyProgress,
  seasonProgressPercent,
  type SeasonProgress,
} from '@/lib/seasons/SeasonEngine';

interface ProgressRow {
  currency: number;
  quest_progress: Record<string, number> | null;
  claimed_quests: string[] | null;
  purchases: string[] | null;
  grand_prize_claimed: boolean;
}

function toProgress(seasonKey: string, childId: string, row: ProgressRow | null): SeasonProgress {
  if (!row) return emptyProgress(seasonKey, childId);
  return {
    seasonKey,
    childId,
    currency: row.currency ?? 0,
    questProgress: row.quest_progress ?? {},
    claimedQuests: row.claimed_quests ?? [],
    purchases: row.purchases ?? [],
    grandPrizeClaimed: row.grand_prize_claimed ?? false,
  };
}

export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  const childId = new URL(req.url).searchParams.get('childId');
  if (!childId) return apiError('childId required', 400);
  if (!(await verifyChildOwnership(auth.user.id, childId))) {
    return apiError('Child not found', 404);
  }

  const season = getActiveSeason();
  if (!season) {
    return apiSuccess({ active: false, season: null, quests: [], items: [], progress: null, percent: 0 });
  }

  const supabase = createAdminClient();

  try {
    const { data: row } = await supabase
      .from('season_progress')
      .select('currency, quest_progress, claimed_quests, purchases, grand_prize_claimed')
      .eq('child_id', childId)
      .eq('season_key', season.key)
      .maybeSingle();

    const progress = toProgress(season.key, childId, row as ProgressRow | null);
    const week = getSeasonWeek(season);

    return apiSuccess({
      active: true,
      season,
      week,
      quests: getSeasonalQuests(season.key),
      items: getSeasonalItems(season.key),
      progress,
      percent: seasonProgressPercent(season.key, progress),
    });
  } catch (err) {
    console.error('[seasons:get]', err);
    return apiError('Failed to fetch season', 500);
  }
}

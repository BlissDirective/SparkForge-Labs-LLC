// POST /api/gamification/xp — Award XP with streak multiplier + level-up
import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { AwardXPSchema } from '@/lib/validations';
import {
  apiSuccess, apiError, parseBody, requireAuth,
  verifyChildOwnership, applyRateLimit, checkDuplicate,
} from '@/lib/api-helpers';
import { RATE_LIMITS } from '@/lib/rate-limit';
import { calculateLevel } from '@/lib/gamification';

export async function POST(req: NextRequest) {
  const limited = applyRateLimit(req, 'gamification-xp', undefined, RATE_LIMITS.general);
  if (limited) return limited;

  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  // v2 [NEW-2B]: Dedup rapid clicks
  const dup = checkDuplicate(req, auth.user.id);
  if (dup) return dup;

  const parsed = await parseBody(req, AwardXPSchema);
  if (!parsed.success) return parsed.response;

  const { childId, amount, source: _source } = parsed.data;

  if (!(await verifyChildOwnership(auth.user.id, childId))) return apiError('Child not found', 404);

  const supabase = await createServerSupabase();

  const { data: child } = await supabase
    .from('children')
    .select('xp, level, streak_count, spark_coins')
    .eq('id', childId)
    .single();

  if (!child) return apiError('Child not found', 404);

  // Streak multiplier: 2x at 7+ day streak
  const multiplier = child.streak_count >= 7 ? 2 : 1;
  const xpAwarded = amount * multiplier;
  const newXP = child.xp + xpAwarded;
  const oldLevel = calculateLevel(child.xp);
  const newLevel = calculateLevel(newXP);
  const leveledUp = newLevel.level > oldLevel.level;
  const coinsEarned = leveledUp ? (newLevel.level - oldLevel.level) * 5 : 0;

  await supabase.from('children').update({
    xp: newXP,
    level: newLevel.level,
    spark_coins: child.spark_coins + coinsEarned,
  }).eq('id', childId);

  return apiSuccess({
    xpAwarded, multiplier, newXP,
    newLevel: newLevel.level, newTitle: newLevel.title,
    levelProgress: newLevel.progress, leveledUp, coinsEarned,
  });
}

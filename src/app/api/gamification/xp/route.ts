// POST /api/gamification/xp — Award XP with streak multiplier + level-up
import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { AwardXPSchema } from '@/lib/validations';
import {
  apiSuccess, apiError, parseBody, requireAuth,
  verifyChildOwnership, applyRateLimit, checkDuplicate,
} from '@/lib/api-helpers';
import { RATE_LIMITS } from '@/lib/rate-limit';

// Level calculation using LEVELS array from types
function calculateLevel(xp: number) {
  // Levels defined in src/types/index.ts LEVELS array
  // Each level has { level, title, minXP, maxXP }
  // Simplified inline for this route:
  const tiers = [
    { min: 0, max: 500, level_range: [1, 5], title: 'Spark Starter' },
    { min: 500, max: 1500, level_range: [6, 10], title: 'Curious Coder' },
    { min: 1500, max: 3500, level_range: [11, 20], title: 'Data Explorer' },
    { min: 3500, max: 7000, level_range: [21, 30], title: 'Algorithm Ace' },
    { min: 7000, max: 12000, level_range: [31, 40], title: 'Neural Navigator' },
    { min: 12000, max: 20000, level_range: [41, 50], title: 'AI Architect' },
  ];

  for (const tier of tiers) {
    if (xp <= tier.max) {
      const range = tier.max - tier.min;
      const levels = tier.level_range[1] - tier.level_range[0] + 1;
      const perLevel = range / levels;
      const inTier = xp - tier.min;
      const levelInTier = Math.floor(inTier / perLevel);
      const level = tier.level_range[0] + levelInTier;
      const progress = (inTier % perLevel) / perLevel;
      return { level: Math.max(1, level), title: tier.title, progress };
    }
  }
  return { level: 51, title: 'Forge Master', progress: 1 };
}

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

  const supabase = createServerSupabase();

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

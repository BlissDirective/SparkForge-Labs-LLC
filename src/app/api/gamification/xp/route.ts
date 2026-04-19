// POST /api/gamification/xp — Award XP with streak multiplier + level-up
//
// API-HIGH-003 (C): Server-authoritative XP flow.
//
//   • For `source === 'game'` the client sends `gameId` and the server
//     looks up the canonical reward in `game-xp-config.ts`. Any
//     `amount` the client might send is IGNORED — this closes the
//     tampered-client XP-forgery path.
//
//   • For non-game sources (lessons, quizzes, spark facts) the client
//     still sends `amount` bounded by AwardXPSchema (max 500).
//
//   • A DAILY_XP_CAP clamps the combined total per child per calendar
//     day (post-multiplier). Overrun requests succeed partially
//     (awarding what's left) rather than 429-ing — this avoids
//     punishing casual play that happens to land near the cap.
//
//   • `children.xp_awarded_today` is the running counter; a BEFORE
//     UPDATE trigger resets it to 0 when xp_reset_date < CURRENT_DATE
//     (sql/012_xp_daily_cap.sql).

import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { AwardXPSchema } from '@/lib/validations';
import {
  apiSuccess, apiError, parseBody, requireAuth,
  verifyChildOwnership, applyRateLimit, checkDuplicate,
} from '@/lib/api-helpers';
import { RATE_LIMITS } from '@/lib/rate-limit';
import { calculateLevel } from '@/lib/gamification';
import { getGameXP, DAILY_XP_CAP, MAX_NON_GAME_AWARD } from '@/lib/game-xp-config';

export async function POST(req: NextRequest) {
  const limited = await applyRateLimit(req, 'gamification-xp', undefined, RATE_LIMITS.general);
  if (limited) return limited;

  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  // Dedup rapid clicks. API-HIGH-002 (B): SHA-256 body hash on clone.
  const dup = await checkDuplicate(req, auth.user.id);
  if (dup) return dup;

  const parsed = await parseBody(req, AwardXPSchema);
  if (!parsed.success) return parsed.response;

  const { childId, source, gameId, amount: clientAmount } = parsed.data;

  if (!(await verifyChildOwnership(auth.user.id, childId))) {
    return apiError('Child not found', 404);
  }

  // ── Resolve base amount BEFORE streak multiplier ────
  let baseAmount: number;
  if (source === 'game') {
    if (!gameId) {
      return apiError('gameId is required when source="game"', 400, 'MISSING_GAME_ID');
    }
    baseAmount = getGameXP(gameId);
  } else {
    if (typeof clientAmount !== 'number') {
      return apiError('amount is required for non-game sources', 400, 'MISSING_AMOUNT');
    }
    // Sanity: schema already caps at 500, but keep explicit guard.
    baseAmount = Math.min(clientAmount, MAX_NON_GAME_AWARD);
  }

  const supabase = await createServerSupabase();

  const { data: child } = await supabase
    .from('children')
    .select('xp, level, streak_count, spark_coins, xp_awarded_today, xp_reset_date')
    .eq('id', childId)
    .single();

  if (!child) return apiError('Child not found', 404);

  // ── Apply streak multiplier ────
  const multiplier = child.streak_count >= 7 ? 2 : 1;
  const desiredAward = baseAmount * multiplier;

  // ── Enforce DAILY_XP_CAP ────
  // The BEFORE UPDATE trigger (sql/012) resets xp_awarded_today to 0
  // when xp_reset_date < today, but that fires on our upcoming write,
  // not on this SELECT. So compute "already awarded today" defensively
  // by checking whether the stored reset_date is still today.
  const todayIso = new Date().toISOString().slice(0, 10);
  const alreadyToday =
    child.xp_reset_date && child.xp_reset_date >= todayIso
      ? child.xp_awarded_today
      : 0;
  const remainingToday = Math.max(0, DAILY_XP_CAP - alreadyToday);
  const xpAwarded = Math.min(desiredAward, remainingToday);
  const capped = xpAwarded < desiredAward;

  if (xpAwarded === 0) {
    // Child hit the daily cap — short-circuit without writing.
    return apiSuccess({
      xpAwarded: 0,
      multiplier,
      newXP: child.xp,
      newLevel: child.level,
      newTitle: calculateLevel(child.xp).title,
      levelProgress: calculateLevel(child.xp).progress,
      leveledUp: false,
      coinsEarned: 0,
      capped: true,
      reason: 'DAILY_XP_CAP_REACHED',
    });
  }

  const newXP = child.xp + xpAwarded;
  const oldLevel = calculateLevel(child.xp);
  const newLevel = calculateLevel(newXP);
  const leveledUp = newLevel.level > oldLevel.level;
  const coinsEarned = leveledUp ? (newLevel.level - oldLevel.level) * 5 : 0;

  await supabase.from('children').update({
    xp: newXP,
    level: newLevel.level,
    spark_coins: child.spark_coins + coinsEarned,
    xp_awarded_today: alreadyToday + xpAwarded,
    xp_reset_date: todayIso,
  }).eq('id', childId);

  return apiSuccess({
    xpAwarded,
    multiplier,
    newXP,
    newLevel: newLevel.level,
    newTitle: newLevel.title,
    levelProgress: newLevel.progress,
    leveledUp,
    coinsEarned,
    capped,
  });
}

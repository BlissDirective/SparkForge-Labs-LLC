// POST /api/gamification/streak — Update daily streak
import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { apiSuccess, apiError, parseBody, requireAuth, verifyChildOwnership } from '@/lib/api-helpers';
import { z } from 'zod';

const StreakSchema = z.object({ childId: z.string().uuid() });

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  const parsed = await parseBody(req, StreakSchema);
  if (!parsed.success) return parsed.response;

  const { childId } = parsed.data;

  if (!(await verifyChildOwnership(auth.user.id, childId))) return apiError('Child not found', 404);

  const supabase = createServerSupabase();

  const { data: child } = await supabase
    .from('children')
    .select('streak_count, streak_last_date, streak_shield')
    .eq('id', childId)
    .single();

  if (!child) return apiError('Child not found', 404);

  const today = new Date().toISOString().split('T')[0];
  const lastDate = child.streak_last_date;

  // Already logged today
  if (lastDate === today) {
    return apiSuccess({
      streakCount: child.streak_count, streakShield: child.streak_shield,
      shieldUsed: false, recovered: false, isNew: false,
    });
  }

  let newStreak = child.streak_count;
  let shieldUsed = false;
  let recovered = false;
  let newShield = child.streak_shield;

  if (lastDate) {
    const daysSince = Math.floor(
      (new Date(today).getTime() - new Date(lastDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSince === 1) {
      newStreak += 1;
    } else if (daysSince === 2 && child.streak_shield) {
      newStreak += 1;
      shieldUsed = true;
      newShield = false;
    } else {
      newStreak = 1;
      recovered = true;
    }
  } else {
    newStreak = 1;
  }

  // Award streak shield at 7-day milestones
  if (newStreak > 0 && newStreak % 7 === 0) newShield = true;

  await supabase.from('children').update({
    streak_count: newStreak, streak_last_date: today, streak_shield: newShield,
  }).eq('id', childId);

  return apiSuccess({
    streakCount: newStreak, streakShield: newShield,
    shieldUsed, recovered, isNew: !lastDate,
  });
}

// POST /api/gamification/streak/freeze — Equip or unequip a streak freeze
import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { apiSuccess, apiError, parseBody, requireAuth, verifyChildOwnership } from '@/lib/api-helpers';
import { z } from 'zod';

const FreezeSchema = z.object({
  childId: z.string().uuid(),
  action: z.enum(['equip', 'unequip']),
});

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  const parsed = await parseBody(req, FreezeSchema);
  if (!parsed.success) return parsed.response;

  const { childId, action } = parsed.data;

  if (!(await verifyChildOwnership(auth.user.id, childId))) {
    return apiError('Child not found', 404);
  }

  const supabase = await createServerSupabase();

  if (action === 'equip') {
    // Find an available freeze (not equipped, not consumed)
    const { data: availableFreeze } = await supabase
      .from('streak_freezes')
      .select('id')
      .eq('child_id', childId)
      .eq('equipped', false)
      .eq('consumed', false)
      .limit(1)
      .single();

    if (!availableFreeze) {
      return apiError('No available freezes. Earn freezes by maintaining your streak!', 400);
    }

    // Check current equipped count
    const { count: equippedCount } = await supabase
      .from('streak_freezes')
      .select('*', { count: 'exact', head: true })
      .eq('child_id', childId)
      .eq('equipped', true)
      .eq('consumed', false);

    if ((equippedCount ?? 0) >= 2) {
      return apiError('Maximum 2 freezes can be equipped at once', 400);
    }

    // Equip the freeze
    const { error: updateError } = await supabase
      .from('streak_freezes')
      .update({ equipped: true })
      .eq('id', availableFreeze.id);

    if (updateError) {
      return apiError('Failed to equip freeze', 500);
    }

    return apiSuccess({ message: 'Freeze equipped! You are protected for one missed day.' });
  }

  // Unequip: find an equipped freeze and return it to inventory
  const { data: equippedFreeze } = await supabase
    .from('streak_freezes')
    .select('id')
    .eq('child_id', childId)
    .eq('equipped', true)
    .eq('consumed', false)
    .limit(1)
    .single();

  if (!equippedFreeze) {
    return apiError('No equipped freezes to remove', 400);
  }

  const { error: updateError } = await supabase
    .from('streak_freezes')
    .update({ equipped: false })
    .eq('id', equippedFreeze.id);

  if (updateError) {
    return apiError('Failed to unequip freeze', 500);
  }

  return apiSuccess({ message: 'Freeze returned to inventory.' });
}

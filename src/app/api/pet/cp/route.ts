// POST /api/pet/cp — Add care points (called when child completes learning activities)
import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { apiSuccess, apiError, parseBody, requireAuth, verifyChildOwnership } from '@/lib/api-helpers';
import { z } from 'zod';

const CPSchema = z.object({
  childId: z.string().uuid(),
  points: z.number().int().positive().max(100),
  activity: z.string().min(1).max(50),
});

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  const parsed = await parseBody(req, CPSchema);
  if (!parsed.success) return parsed.response;

  const { childId, points, activity } = parsed.data;
  if (!(await verifyChildOwnership(auth.user.id, childId))) return apiError('Child not found', 404);

  const supabase = await createServerSupabase();

  const { data: row } = await supabase.from('pet_states').select('id, care_points, total_care_points').eq('child_id', childId).single();
  if (!row) return apiError('Pet not found', 404);

  const newCP = row.care_points + points;
  const newTotal = row.total_care_points + points;

  await supabase.from('pet_states').update({
    care_points: newCP,
    total_care_points: newTotal,
    last_care_at: new Date().toISOString(),
  }).eq('id', row.id);

  return apiSuccess({ carePoints: newCP, message: `+${points} CP earned from ${activity}!` });
}

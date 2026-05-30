// POST /api/pet/sleep — Toggle pet sleep state
import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { apiSuccess, apiError, parseBody, requireAuth, verifyChildOwnership } from '@/lib/api-helpers';
import { z } from 'zod';

const SleepSchema = z.object({ childId: z.string().uuid() });

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  const parsed = await parseBody(req, SleepSchema);
  if (!parsed.success) return parsed.response;

  const { childId } = parsed.data;
  if (!(await verifyChildOwnership(auth.user.id, childId))) return apiError('Child not found', 404);

  const supabase = await createServerSupabase();

  const { data: row } = await supabase.from('pet_states').select('id, is_sleeping').eq('child_id', childId).single();
  if (!row) return apiError('Pet not found', 404);

  const newSleep = !row.is_sleeping;
  await supabase.from('pet_states').update({ is_sleeping: newSleep }).eq('id', row.id);

  return apiSuccess({ isSleeping: newSleep, message: newSleep ? 'Goodnight! Your pet is sleeping.' : 'Good morning! Your pet woke up!' });
}

// POST /api/pet/evolve — Evolve pet to next stage
import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { apiSuccess, apiError, parseBody, requireAuth, verifyChildOwnership } from '@/lib/api-helpers';
import { z } from 'zod';

const EvolveSchema = z.object({ childId: z.string().uuid() });

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  const parsed = await parseBody(req, EvolveSchema);
  if (!parsed.success) return parsed.response;

  const { childId } = parsed.data;
  if (!(await verifyChildOwnership(auth.user.id, childId))) return apiError('Child not found', 404);

  const supabase = await createServerSupabase();
  const { data: row } = await supabase.from('pet_states').select('*').eq('child_id', childId).single();
  if (!row) return apiError('Pet not found', 404);

  // Determine next stage
  const stageOrder = ['egg', 'baby', 'child', 'teen', 'adult'];
  const idx = stageOrder.indexOf(row.stage);
  if (idx >= stageOrder.length - 1) return apiError('Already at max stage', 400);

  const nextStage = stageOrder[idx + 1];
  const thresholds: Record<string, number> = { egg: 0, baby: 1, child: 3, teen: 7, adult: 14 };
  const avgNeeds = (Number(row.hunger) + Number(row.happiness) + Number(row.energy) + Number(row.cleanliness)) / 4;

  if (row.age_days < thresholds[nextStage]) return apiError(`Need ${thresholds[nextStage]} days (currently ${row.age_days})`, 400);
  if (avgNeeds < 40) return apiError('Pet needs are too low. Take better care first!', 400);

  // Determine evolution path at adult
  let evolution = row.evolution;
  if (nextStage === 'adult') {
    const needs = { hunger: Number(row.hunger), happiness: Number(row.happiness), energy: Number(row.energy), cleanliness: Number(row.cleanliness) };
    const entries = Object.entries(needs).sort((a, b) => b[1] - a[1]) as [string, number][];
    const top = entries.slice(0, 2).map(n => n[0]);
    if (top.includes('happiness') && top.includes('cleanliness')) evolution = 'scholar';
    else if (top.includes('energy') && top.includes('hunger')) evolution = 'athlete';
    else evolution = 'artist';
  }

  // Update
  const { data: updated } = await supabase.from('pet_states').update({
    stage: nextStage,
    evolution,
    hunger: Math.min(100, Number(row.hunger) + 20),
    happiness: Math.min(100, Number(row.happiness) + 30),
    energy: Math.min(100, Number(row.energy) + 20),
    cleanliness: Math.min(100, Number(row.cleanliness) + 20),
  }).eq('id', row.id).select().single();

  return apiSuccess({ pet: updated, message: `Pet evolved to ${nextStage}!` });
}

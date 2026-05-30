// POST /api/pet/care — Perform a care action on the pet
import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { apiSuccess, apiError, parseBody, requireAuth, verifyChildOwnership } from '@/lib/api-helpers';
import { z } from 'zod';
import { performCareAction, calculateMood } from '@/lib/pet/PetEngine';
import type { CareAction } from '@/lib/pet/PetEngine';

const CareSchema = z.object({
  childId: z.string().uuid(),
  action: z.enum(['feed', 'play', 'clean', 'rest', 'train']),
});

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  const parsed = await parseBody(req, CareSchema);
  if (!parsed.success) return parsed.response;

  const { childId, action } = parsed.data;
  if (!(await verifyChildOwnership(auth.user.id, childId))) return apiError('Child not found', 404);

  const supabase = await createServerSupabase();

  // Fetch current pet state
  const { data: row } = await supabase.from('pet_states').select('*').eq('child_id', childId).single();
  if (!row) return apiError('Pet not found', 404);

  // Reconstruct PetState
  const pet = {
    id: row.id,
    childId: row.child_id,
    name: row.name,
    species: row.species,
    stage: row.stage,
    evolution: row.evolution,
    needs: { hunger: Number(row.hunger), happiness: Number(row.happiness), energy: Number(row.energy), cleanliness: Number(row.cleanliness) },
    carePoints: row.care_points,
    totalCarePoints: row.total_care_points,
    ageDays: row.age_days,
    careQuality: row.care_quality,
    consecutiveCareDays: row.consecutive_care_days,
    lastCareAt: row.last_care_at,
    lastLoginAt: row.last_login_at,
    isSleeping: row.is_sleeping,
    accessories: row.accessories || [],
    tricksLearned: row.tricks_learned || [],
    createdAt: row.created_at,
  };

  // Apply care action
  const result = performCareAction(pet, action as CareAction);
  if (!result.success) return apiError(result.message, 400);

  // Persist
  await supabase.from('pet_states').update({
    hunger: result.state.needs.hunger,
    happiness: result.state.needs.happiness,
    energy: result.state.needs.energy,
    cleanliness: result.state.needs.cleanliness,
    care_points: result.state.carePoints,
    total_care_points: result.state.totalCarePoints,
    last_care_at: result.state.lastCareAt,
    tricks_learned: result.state.tricksLearned,
  }).eq('id', row.id);

  // Log
  await supabase.from('pet_care_logs').insert({
    pet_id: row.id,
    child_id: childId,
    action,
    need_changed: result.needChanged,
    old_value: result.oldValue,
    new_value: result.newValue,
    cp_cost: pet.carePoints - result.state.carePoints,
    xp_earned: result.xpEarned,
    trick_unlocked: result.trickUnlocked || null,
  });

  return apiSuccess({ message: result.message, xpEarned: result.xpEarned, mood: calculateMood(result.state.needs) });
}

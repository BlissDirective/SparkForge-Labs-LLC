// GET /api/pet — Fetch child's pet (with offline decay applied)
// POST /api/pet — Create a new pet
import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { apiSuccess, apiError, parseBody, requireAuth, verifyChildOwnership } from '@/lib/api-helpers';
import { z } from 'zod';
import { processOfflineDecay } from '@/lib/pet/PetEngine';
import type { PetState } from '@/lib/pet/PetEngine';

// GET
export async function GET(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  const childId = req.nextUrl.searchParams.get('childId');
  if (!childId) return apiError('childId required', 400);
  if (!z.string().uuid().safeParse(childId).success) return apiError('Invalid childId', 400);
  if (!(await verifyChildOwnership(auth.user.id, childId))) return apiError('Child not found', 404);

  const supabase = await createServerSupabase();
  const { data: row } = await supabase
    .from('pet_states')
    .select('*')
    .eq('child_id', childId)
    .single();

  if (!row) return apiSuccess({ pet: null });

  // Convert DB row to PetState and apply offline decay
  const pet: PetState = {
    id: row.id,
    childId: row.child_id,
    name: row.name,
    species: row.species,
    stage: row.stage,
    evolution: row.evolution,
    needs: {
      hunger: Number(row.hunger),
      happiness: Number(row.happiness),
      energy: Number(row.energy),
      cleanliness: Number(row.cleanliness),
    },
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

  const decayResult = processOfflineDecay(pet);
  const finalPet = decayResult.state;

  // Persist decayed state back to DB
  await supabase.from('pet_states').update({
    hunger: finalPet.needs.hunger,
    happiness: finalPet.needs.happiness,
    energy: finalPet.needs.energy,
    cleanliness: finalPet.needs.cleanliness,
    last_login_at: finalPet.lastLoginAt,
  }).eq('id', row.id);

  return apiSuccess({ pet: finalPet });
}

// POST — Create new pet
const CreatePetSchema = z.object({
  childId: z.string().uuid(),
  name: z.string().min(1).max(20),
  species: z.enum(['pixel', 'nebula', 'spark']),
});

export async function POST(req: NextRequest) {
  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  const parsed = await parseBody(req, CreatePetSchema);
  if (!parsed.success) return parsed.response;

  const { childId, name, species } = parsed.data;
  if (!(await verifyChildOwnership(auth.user.id, childId))) return apiError('Child not found', 404);

  const supabase = await createServerSupabase();

  // Check if pet already exists
  const { data: existing } = await supabase.from('pet_states').select('id').eq('child_id', childId).single();
  if (existing) return apiError('Pet already exists for this child', 400);

  const { data: row, error } = await supabase.from('pet_states').insert({
    child_id: childId,
    name,
    species,
    stage: 'egg',
    evolution: 'none',
    hunger: 80,
    happiness: 80,
    energy: 80,
    cleanliness: 80,
    care_points: 50,
    total_care_points: 0,
    age_days: 0,
    care_quality: 50,
    consecutive_care_days: 0,
    last_login_at: new Date().toISOString(),
    is_sleeping: false,
    accessories: [],
    tricks_learned: [],
  }).select().single();

  if (error) return apiError('Failed to create pet', 500);

  return apiSuccess({ pet: row });
}

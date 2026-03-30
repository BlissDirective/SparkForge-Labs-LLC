// GET /api/auth/me — Get current user profile
// PATCH /api/auth/me — Update current user profile (e.g., onboarding_complete)
import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { apiSuccess, apiError } from '@/lib/api-helpers';
import { z } from 'zod';

export async function GET(_req: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    return apiError('Not authenticated', 401, 'AUTH_REQUIRED');
  }

  const { data: parent } = await supabase
    .from('parents')
    .select('*')
    .eq('id', user.id)
    .single();

  if (!parent) return apiError('Parent profile not found', 404);

  return apiSuccess({
    id: parent.id,
    email: parent.email,
    fullName: parent.full_name,
    subscriptionTier: parent.subscription_tier,
    subscriptionStatus: parent.subscription_status,
    onboardingComplete: parent.onboarding_complete,
    isAdmin: parent.is_admin,
    createdAt: parent.created_at,
  });
}

// AUDIT-E1: PATCH handler for updating parent profile fields (onboarding completion)
const patchSchema = z.object({
  onboardingComplete: z.boolean().optional(),
  fullName: z.string().min(1).max(100).optional(),
}).strict();

export async function PATCH(req: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return apiError('Not authenticated', 401, 'AUTH_REQUIRED');
  }

  const body = await req.json().catch(() => null);
  if (!body) return apiError('Invalid JSON body', 400);

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return apiError('Invalid request data', 400);
  }

  const updates: Record<string, unknown> = {};
  if (parsed.data.onboardingComplete !== undefined) {
    updates.onboarding_complete = parsed.data.onboardingComplete;
  }
  if (parsed.data.fullName !== undefined) {
    updates.full_name = parsed.data.fullName;
  }

  if (Object.keys(updates).length === 0) {
    return apiError('No valid fields to update', 400);
  }

  const { data: updated, error: updateError } = await supabase
    .from('parents')
    .update(updates)
    .eq('id', user.id)
    .select('id, onboarding_complete, full_name')
    .single();

  if (updateError || !updated) {
    return apiError('Failed to update profile', 500);
  }

  return apiSuccess({
    id: updated.id,
    onboardingComplete: updated.onboarding_complete,
    fullName: updated.full_name,
  });
}

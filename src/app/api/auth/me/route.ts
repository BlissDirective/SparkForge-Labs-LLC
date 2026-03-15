// GET /api/auth/me — Get current user profile
import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { apiSuccess, apiError } from '@/lib/api-helpers';

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

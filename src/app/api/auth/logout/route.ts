// POST /api/auth/logout — Sign out
import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { apiSuccess, apiError } from '@/lib/api-helpers';

export async function POST(_req: NextRequest) {
  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.signOut();

  if (error) return apiError('Failed to sign out', 500);

  return apiSuccess({ signedOut: true });
}

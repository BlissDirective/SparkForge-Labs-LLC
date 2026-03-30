// POST /api/auth/logout — Sign out
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { apiSuccess, apiError } from '@/lib/api-helpers';

export async function POST(_req: NextRequest) {
  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.signOut();

  if (error) return apiError('Failed to sign out', 500);

  // AUDIT-D3: Clear demo session cookie on logout to prevent stale demo access
  const response = NextResponse.json({ success: true, data: { signedOut: true } });
  response.cookies.set('sparkforge-demo-active', '', {
    maxAge: 0,
    path: '/',
  });

  return response;
}

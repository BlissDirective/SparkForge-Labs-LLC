// POST /api/auth/consent — Record COPPA parental consent (Step 3)
// S3-HIGH-001: Consent is recorded ONLY when the parent explicitly confirms
// the COPPA checkbox in Step 3 of signup. This ensures coppa_consent_at
// reflects the actual moment of consent, not account creation time.
// CRIT-002: Secured with auth check — only the authenticated user can set their own consent.
import { NextRequest } from 'next/server';
import { createServerSupabase, createAdminClient } from '@/lib/supabase/server';
import { apiSuccess, apiError } from '@/lib/api-helpers';
import { checkRateLimit, RATE_LIMITS, rateLimitKey } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  // Rate limit: auth tier (5/min)
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const rl = checkRateLimit(rateLimitKey('consent', ip), RATE_LIMITS.auth);
  if (!rl.allowed) {
    return apiError('Too many requests. Try again later.', 429);
  }

  // Require authenticated session
  const supabase = await createServerSupabase();
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();

  if (sessionError || !session?.user) {
    return apiError('Authentication required.', 401);
  }

  const userId = session.user.id;

  // Use admin client to update consent, scoped to the authenticated user's ID
  const adminClient = createAdminClient();
  const { data, error } = await adminClient
    .from('parents')
    .update({ coppa_consent_at: new Date().toISOString() })
    .eq('id', userId)
    .is('coppa_consent_at', null)
    .select('id')
    .single();

  if (error || !data) {
    return apiError('Unable to record consent. Account may not exist or consent already recorded.', 400);
  }

  return apiSuccess({ consentRecorded: true });
}

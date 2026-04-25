// POST /api/auth/consent — Record COPPA parental consent (Step 3)
// S3-HIGH-001: Consent is recorded ONLY when the parent explicitly confirms
// the COPPA checkbox in Step 3 of signup. This ensures coppa_consent_at
// reflects the actual moment of consent, not account creation time.
// CRIT-002: Secured with auth check — only the authenticated user can set their own consent.
// COPPA-PRD-H: Gate on parents.email_verified_at so we can't record VPC
// from a parent who hasn't proven email ownership. Mirrors the existing
// Stripe-checkout gate (AUTH-HIGH-004 4A).
import { NextRequest } from 'next/server';
import { createServerSupabase, createAdminClient } from '@/lib/supabase/server';
import { apiSuccess, apiError } from '@/lib/api-helpers';
import { checkRateLimit, RATE_LIMITS, rateLimitKey } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  // Rate limit: auth tier (5/min)
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const rl = await checkRateLimit(rateLimitKey('consent', ip), RATE_LIMITS.auth);
  if (!rl.allowed) {
    return apiError('Too many requests. Try again later.', 429);
  }

  // Require authenticated session
  const supabase = await createServerSupabase();
  // AUDIT-D1: Use getUser() instead of getSession() for server-side JWT validation
  // getSession() only reads from local cookie without validating with Supabase Auth server
  const { data: { user }, error: userError } = await supabase.auth.getUser();

  if (userError || !user) {
    return apiError('Authentication required.', 401);
  }

  const userId = user.id;
  const adminClient = createAdminClient();

  // COPPA-PRD-H: VPC requires the operator to make a reasonable effort to
  // verify the consenting party. Email-link confirmation is a recognized
  // method under the 2025 COPPA Rule Amendments. We refuse to write
  // coppa_consent_at until the parent has clicked the Supabase email
  // confirmation link (recorded at /api/auth/callback as
  // parents.email_verified_at).
  const { data: parentRow, error: parentReadErr } = await adminClient
    .from('parents')
    .select('email_verified_at')
    .eq('id', userId)
    .single();

  if (parentReadErr || !parentRow) {
    return apiError('Account not found.', 404);
  }

  if (!parentRow.email_verified_at) {
    return apiError(
      'Please verify your email before recording parental consent. Check your inbox for the confirmation link from SparkForge.',
      403,
      'EMAIL_VERIFICATION_REQUIRED',
    );
  }

  // Use admin client to update consent, scoped to the authenticated user's ID
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

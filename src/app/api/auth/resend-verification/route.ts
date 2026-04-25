// POST /api/auth/resend-verification — AUTH-HIGH-004 (4C)
//
// Resends the Supabase email-confirmation link for the currently
// authenticated parent. Used by the dashboard EmailVerifyBanner when
// the parent clicks "Resend link".
//
// Security model:
//   - Requires an authenticated session (via requireAuth). The endpoint
//     cannot be used to probe whether an arbitrary address is
//     registered — the email is pulled from the session user, not the
//     request body.
//   - Per-IP rate-limit (auth tier, 5/min) prevents a signed-in user
//     from script-hammering the endpoint.
//   - Supabase imposes its own per-address email throttle (~2/60s),
//     which is the real backstop against email-bomb abuse.
//   - Short-circuits if the email is already verified.

import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { apiSuccess, apiError, requireAuth, applyRateLimit } from '@/lib/api-helpers';
import { RATE_LIMITS } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const limited = await applyRateLimit(req, 'auth-resend-verification', undefined, RATE_LIMITS.auth);
  if (limited) return limited;

  const auth = await requireAuth(req);
  if (!auth.success) return auth.response;

  const email = auth.user.email;
  if (!email) {
    return apiError('No email on file for this account.', 400, 'NO_EMAIL');
  }

  const supabase = await createServerSupabase();

  // Look up verified status. If already verified, there's nothing to do.
  const { data: parent } = await supabase
    .from('parents')
    .select('email_verified_at')
    .eq('id', auth.user.id)
    .single();

  if (parent?.email_verified_at) {
    return apiSuccess({ sent: false, alreadyVerified: true });
  }

  const origin = new URL(req.url).origin;

  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: `${origin}/api/auth/callback?next=/onboarding`,
    },
  });

  if (error) {
    // Log server-side for debugging. For the client we still return a
    // neutral "sent" outcome so a brief Supabase blip doesn't surface
    // as a scary error in the banner.
    console.warn('[auth/resend-verification] resend failed:', error.message);
  }

  return apiSuccess({ sent: true });
}

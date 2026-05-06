// POST /api/auth/signup — Create parent account (Step 1)
//
// AUTH-HIGH-004 (Option C): switched from admin.createUser() to the
// user-facing supabase.auth.signUp() flow. This:
//
//   1. Uses Supabase's built-in email-confirmation workflow — the user
//      is NOT logged in until they click the confirmation link, which
//      prevents account-enumeration abuse where anyone could sign up
//      with someone else's email and immediately access the platform.
//   2. Removes the need for the service-role key on the signup code path
//      (we still use it only for the `parents` row insert, which RLS
//      blocks because the user has no session yet).
//   3. Pre-creates the `parents` row with `email_verified_at = NULL` so
//      support tooling can see pending signups. `/api/auth/callback`
//      stamps `email_verified_at` on first successful verification.
//
// S3-HIGH-001: coppa_consent_at is NOT set here — set by
// /api/auth/consent in Step 3.
//
// OPERATOR NOTE: this change requires "Confirm email" to be enabled in
// Supabase Dashboard → Authentication → Providers → Email. See
// SETUP_CHECKLIST.md §1.1.
import { NextRequest } from 'next/server';
import { createServerSupabase, createAdminClient } from '@/lib/supabase/server';
import { SignupSchema } from '@/lib/validations';
import { apiSuccess, apiError, parseBody, applyRateLimit } from '@/lib/api-helpers';
import { RATE_LIMITS } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const limited = await applyRateLimit(req, 'auth-signup', undefined, RATE_LIMITS.auth);
  if (limited) return limited;

  const parsed = await parseBody(req, SignupSchema);
  if (!parsed.success) return parsed.response;

  const { email, password, fullName, timezone: _timezone, captchaToken } = parsed.data;

  // AUTH-HIGH-004: Use user-facing signUp(), not admin.createUser().
  const supabase = await createServerSupabase();
  const origin = new URL(req.url).origin;

  // If the caller currently holds a Supabase anonymous (demo) session,
  // sign it out before the email/password signUp so we don't leave an
  // orphaned anon session in `auth.sessions` lingering until natural
  // expiry. The follow-up signUp creates a fresh email/password session
  // that becomes the active one for this device.
  const { data: pre } = await supabase.auth.getUser();
  if (pre.user?.is_anonymous) {
    await supabase.auth.signOut();
  }

  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      // Supabase sends the confirmation email to this URL; `next` is
      // sanitized and the stamping logic runs on successful exchange.
      emailRedirectTo: `${origin}/api/auth/callback?next=/onboarding`,
      data: fullName ? { full_name: fullName } : undefined,
      // AUTH-MED-003 (B): forward optional CAPTCHA token. Supabase
      // verifies against the configured hCaptcha / Turnstile secret.
      ...(captchaToken ? { captchaToken } : {}),
    },
  });

  if (authError) {
    // Supabase phrases duplicate-email errors a few ways depending on
    // whether the auth setting "Prevent sign-ups" is on and whether
    // rate limiting kicks in. Covers all known variants.
    const msg = authError.message.toLowerCase();
    if (
      msg.includes('already') ||
      msg.includes('registered') ||
      msg.includes('exists')
    ) {
      return apiError('An account with this email already exists', 409, 'EMAIL_EXISTS');
    }
    // AUTH-MED-003 (B): surface CAPTCHA errors so the client widget
    // knows to render / re-render.
    if (msg.includes('captcha')) {
      return apiError(
        'CAPTCHA verification required',
        422,
        'CAPTCHA_REQUIRED',
      );
    }
    console.error('[signup] supabase.auth.signUp error:', authError);
    return apiError('Failed to create account. Please try again.', 500, 'AUTH_ERROR');
  }

  if (!authData.user) {
    console.error('[signup] signUp returned no user object');
    return apiError('Failed to create account. Please try again.', 500, 'AUTH_ERROR');
  }

  // AUTH-HIGH-004 (Q1 Option C): Create the parents row pre-confirmation
  // with email_verified_at = NULL. The callback handler stamps it on
  // successful verification. Admin client bypasses RLS; the user has no
  // session yet (Supabase withholds session until email is confirmed).
  const admin = createAdminClient();
  const { error: parentError } = await admin.from('parents').insert({
    id: authData.user.id,
    email,
    full_name: fullName || null,
    coppa_consent_at: null,
    onboarding_complete: false,
    email_verified_at: null,
  });

  if (parentError) {
    // Couldn't create our application-level row — roll back the auth
    // user so the next signup attempt with the same email can succeed.
    await admin.auth.admin.deleteUser(authData.user.id);
    console.error('[signup] parent insert error:', parentError);
    return apiError('Failed to create account. Please try again.', 500, 'DB_ERROR');
  }

  return apiSuccess(
    {
      userId: authData.user.id,
      emailSent: true,
      verificationRequired: true,
    },
    201,
  );
}

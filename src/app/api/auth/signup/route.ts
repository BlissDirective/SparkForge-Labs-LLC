// POST /api/auth/signup — Create parent account with COPPA consent
// v2 [IMP-3]: Rate limiting applied (5 req/min)
import { NextRequest } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { SignupSchema } from '@/lib/validations';
import { apiSuccess, apiError, parseBody, applyRateLimit } from '@/lib/api-helpers';
import { RATE_LIMITS } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  // v2 [IMP-3]: Rate limit auth endpoints
  const limited = applyRateLimit(req, 'auth-signup', undefined, RATE_LIMITS.auth);
  if (limited) return limited;

  const parsed = await parseBody(req, SignupSchema);
  if (!parsed.success) return parsed.response;

  const { email, password, fullName, coppaConsent: _coppaConsent, timezone: _timezone } = parsed.data;

  const supabase = createAdminClient();

  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: false,
  });

  if (authError) {
    if (authError.message.includes('already registered')) {
      return apiError('An account with this email already exists', 409, 'EMAIL_EXISTS');
    }
    return apiError('Failed to create account. Please try again.', 500, 'AUTH_ERROR');
  }

  // v2 [NEW-3A]: onboarding_complete defaults false
  const { error: parentError } = await supabase.from('parents').insert({
    id: authData.user.id,
    email,
    full_name: fullName || null,
    coppa_consent_at: new Date().toISOString(),
    onboarding_complete: false,
  });

  if (parentError) {
    await supabase.auth.admin.deleteUser(authData.user.id);
    return apiError('Failed to create account. Please try again.', 500, 'DB_ERROR');
  }

  await supabase.auth.admin.generateLink({ type: 'signup', email, password });

  return apiSuccess({ userId: authData.user.id, emailSent: true }, 201);
}

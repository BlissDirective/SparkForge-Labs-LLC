// POST /api/auth/login — Sign in with email/password
// v2 [IMP-3]: Rate limiting applied (5 req/min)
import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { LoginSchema } from '@/lib/validations';
import { apiSuccess, apiError, parseBody, applyRateLimit } from '@/lib/api-helpers';
import { RATE_LIMITS } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const limited = await applyRateLimit(req, 'auth-login', undefined, RATE_LIMITS.auth);
  if (limited) return limited;

  const parsed = await parseBody(req, LoginSchema);
  if (!parsed.success) return parsed.response;

  const supabase = await createServerSupabase();

  // AUTH-MED-003 (B): Forward optional CAPTCHA token. Supabase verifies
  // against the configured hCaptcha / Turnstile secret. When CAPTCHA is
  // enabled in the Supabase dashboard but the client didn't attach a
  // token, Supabase returns an error we surface as 422 so the client
  // knows to render the widget.
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
    options: parsed.data.captchaToken
      ? { captchaToken: parsed.data.captchaToken }
      : undefined,
  });

  if (error) {
    const msg = error.message.toLowerCase();
    if (msg.includes('captcha')) {
      return apiError(
        'CAPTCHA verification required',
        422,
        'CAPTCHA_REQUIRED',
      );
    }
    return apiError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  // AUTH-CRIT-001 (1B): Do not return access token in body. Supabase SSR
  // manages the session via httpOnly/Secure/SameSite=Lax cookies (set in
  // createServerSupabase). Exposing the JWT here would make it reachable to
  // any XSS payload. Client uses the cookie for subsequent requests.
  return apiSuccess({
    user: { id: data.user.id, email: data.user.email },
    authenticated: true,
  });
}

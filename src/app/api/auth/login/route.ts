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

  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
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

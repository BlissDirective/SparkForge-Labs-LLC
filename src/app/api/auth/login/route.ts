// POST /api/auth/login — Sign in with email/password
// v2 [IMP-3]: Rate limiting applied (5 req/min)
import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { LoginSchema } from '@/lib/validations';
import { apiSuccess, apiError, parseBody, applyRateLimit } from '@/lib/api-helpers';
import { RATE_LIMITS } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const limited = applyRateLimit(req, 'auth-login', undefined, RATE_LIMITS.auth);
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

  return apiSuccess({
    user: { id: data.user.id, email: data.user.email },
    session: { accessToken: data.session.access_token },
  });
}

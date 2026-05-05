// POST /api/auth/demo — Initialize demo session
// AUTH-CRIT-002 (2B): Previously set a trivially-forgeable cookie
// `sparkforge-demo-active=1` that middleware trusted. Any browser extension
// or intercepting proxy could set that cookie and bypass authentication.
//
// New implementation: calls supabase.auth.signInAnonymously() which creates
// a real, cryptographically-signed Supabase session (is_anonymous=true).
// Middleware's getUser() naturally accepts anon users, so the trivial cookie
// check is removed entirely.
//
// 1-hour session limit is enforced by:
//   - Server: requireAuth() in api-helpers rejects anon users older than 1h
//   - Client: DemoGuard polls user.created_at + 1h and signs out on expiry
//
// SETUP: Supabase Dashboard → Authentication → Providers → Anonymous
// Sign-Ins must be enabled for this to work.
import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import { apiSuccess, apiError, applyRateLimit } from '@/lib/api-helpers';

const DEMO_DURATION_MS = 60 * 60 * 1000; // 1 hour

export async function POST(req: NextRequest) {
  // Rate limit demo creation (3 per hour per IP). This is best-effort —
  // the in-memory limiter is ineffective on serverless (AUTH-HIGH-003,
  // Phase 2 item). Defense in depth: Supabase dashboard also has a
  // configurable anonymous-sign-in rate limit.
  const limited = await applyRateLimit(req, 'demo-session', undefined, {
    maxRequests: 3,
    windowMs: 3600000,
  });
  if (limited) return limited;

  const supabase = await createServerSupabase();

  // Reject if caller is already authenticated (prevents a logged-in parent
  // from accidentally creating an anon session and losing their context).
  // Audit P1/L2: also reject existing demo (anonymous) users — calling
  // signInAnonymously() while one is active mints a SECOND anon session,
  // orphaning the first along with any in-progress demo state.
  const { data: { user: existingUser } } = await supabase.auth.getUser();
  if (existingUser) {
    if (existingUser.is_anonymous) {
      return apiError(
        'A demo session is already active. Continue exploring or sign out to start over.',
        409,
        'DEMO_ALREADY_ACTIVE',
      );
    }
    return apiError('Already authenticated. Sign out first.', 400, 'ALREADY_AUTHENTICATED');
  }

  const now = Date.now();

  const { data, error } = await supabase.auth.signInAnonymously({
    options: {
      data: {
        demo: true,
        demo_started_at: new Date(now).toISOString(),
        demo_expires_at: new Date(now + DEMO_DURATION_MS).toISOString(),
      },
    },
  });

  if (error || !data.user) {
    console.error('[auth/demo] signInAnonymously failed:', error);
    // If the Supabase project has anonymous sign-ins disabled, this is
    // where we fail. Surface a helpful error.
    const message = error?.message?.includes('anonymous')
      ? 'Anonymous sign-ins are disabled for this Supabase project.'
      : 'Failed to start demo session. Please try again.';
    return apiError(message, 503, 'DEMO_UNAVAILABLE');
  }

  return apiSuccess({
    demoId: data.user.id,
    expiresAt: now + DEMO_DURATION_MS,
    message: 'Demo session started. You have 1 hour to explore SparkForge.',
  });
}

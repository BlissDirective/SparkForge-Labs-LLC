// POST /api/auth/oauth/[provider] — Initiate OAuth sign-in flow
// AUTH-ENH-003 (Max)
//
// Returns the Supabase-generated provider authorization URL. The
// client then redirects the browser to that URL. Supabase handles the
// provider hand-off and redirects back to /api/auth/callback, which
// runs the normal code-for-session exchange.
//
// Security:
//   - Rate limited (5/min) per IP — same as email/password auth.
//     Prevents scripted provider-enumeration or OAuth-flow spam.
//   - `next` query param is validated by OAuthInitSchema and
//     re-sanitized inside the callback handler (defense-in-depth).
//   - No existing session required — this endpoint starts the flow
//     for anonymous visitors. For LINKING (authed users), clients
//     call supabase.auth.linkIdentity() directly (see settings UI).

import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';
import {
  apiSuccess,
  apiError,
  applyRateLimit,
  parseQuery,
} from '@/lib/api-helpers';
import { RATE_LIMITS } from '@/lib/rate-limit';
import { OAuthInitSchema } from '@/lib/validations';
import {
  OAUTH_PROVIDERS,
  isOAuthProvider,
  buildOAuthRedirectUrl,
} from '@/lib/auth/oauth';

interface RouteCtx {
  params: Promise<{ provider: string }>;
}

export async function POST(req: NextRequest, ctx: RouteCtx) {
  const limited = await applyRateLimit(req, 'auth-oauth', undefined, RATE_LIMITS.auth);
  if (limited) return limited;

  const { provider: rawProvider } = await ctx.params;
  if (!isOAuthProvider(rawProvider)) {
    return apiError('Unsupported OAuth provider', 400, 'BAD_REQUEST');
  }

  const parsed = parseQuery(req, OAuthInitSchema);
  if (!parsed.success) return parsed.response;

  const origin = new URL(req.url).origin;
  const config = OAUTH_PROVIDERS[rawProvider];
  const redirectTo = buildOAuthRedirectUrl(origin, parsed.data.next ?? '/home');

  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: rawProvider,
    options: {
      redirectTo,
      scopes: config.scopes,
      // Server-side flow: don't attempt a redirect in this process;
      // we return the URL and the client performs window.location
      // assignment. Matches the anon-session demo-login pattern.
      skipBrowserRedirect: true,
    },
  });

  if (error || !data?.url) {
    console.error('[auth/oauth] signInWithOAuth error:', error);
    return apiError(
      'OAuth initiation failed. Please try another sign-in method.',
      502,
      'SERVER_ERROR',
    );
  }

  return apiSuccess({ url: data.url, provider: rawProvider });
}

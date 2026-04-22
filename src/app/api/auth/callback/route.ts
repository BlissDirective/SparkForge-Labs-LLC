// GET /api/auth/callback — Handle OAuth and magic link auth callbacks
// HIGH-009: This handler was missing — OAuth and magic link flows were broken.
// AUTH-CRIT-003 (3C): `next` query param is validated against a strict
// whitelist regex to prevent open-redirect phishing after successful auth.
// AUTH-HIGH-004 (4C): Stamps `parents.email_verified_at` on the first
// successful code exchange. Idempotent — if the user lands on this
// handler again later (e.g., after a magic-link re-auth) we won't
// overwrite the original timestamp because the UPDATE is guarded by
// `.is('email_verified_at', null)`.
// AUTH-ENH-003 (Max): Detects OAuth-first-sign-in via provider token
// in app_metadata and upserts a minimal `parents` row + logs an
// `auth_events` entry. Parents signed up via email never hit this
// path — they already have a row from /api/auth/signup.
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, createAdminClient } from '@/lib/supabase/server';
import { logAuthEvent } from '@/lib/auth/audit';
import { isOAuthProvider } from '@/lib/auth/oauth';

// Internal-path whitelist: must start with '/' and contain only
// letters, digits, hyphens, and additional slashes (covers all SparkForge
// routes and kebab-case game/content slugs). Explicitly rejects:
//   - protocol-relative URLs (`//evil.com`)
//   - dots, colons, percents, query strings, hashes, backslashes, @-signs
//   - unicode or encoded bypasses
const SAFE_NEXT_PATH = /^\/[a-zA-Z0-9\-\/]*$/;

function sanitizeNextPath(raw: string | null): string {
  if (!raw) return '/home';
  // Defense-in-depth: reject `//` prefix even though the regex rejects it
  // when followed by any invalid char. Some browsers resolve protocol-
  // relative URLs loosely.
  if (raw.startsWith('//')) return '/home';
  if (!SAFE_NEXT_PATH.test(raw)) return '/home';
  return raw;
}

export async function GET(req: NextRequest) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get('code');
  const next = sanitizeNextPath(searchParams.get('next'));

  if (code) {
    const supabase = await createServerSupabase();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.user) {
      const user = data.user;
      // AUTH-ENH-003: the provider token is stamped into
      // app_metadata by Supabase. 'email' = password/magic-link,
      // any other value = OAuth (google/apple/azure).
      const provider = (user.app_metadata?.provider as string | undefined) || 'email';
      const isOAuth = isOAuthProvider(provider);

      const admin = createAdminClient();

      // AUTH-ENH-003: OAuth-first-sign-in → ensure a parents row exists.
      // OAuth users skip /signup entirely, so we upsert here. `onConflict`
      // keeps this idempotent for repeat sign-ins. Auto-verify email
      // because the provider has already validated it upstream.
      if (isOAuth) {
        const nowIso = new Date().toISOString();
        const emailFromIdentity =
          user.email ||
          (user.identities?.[0]?.identity_data?.email as string | undefined) ||
          '';
        const fullName =
          (user.user_metadata?.full_name as string | undefined) ||
          (user.user_metadata?.name as string | undefined) ||
          null;

        try {
          await admin.from('parents').upsert(
            {
              id: user.id,
              email: emailFromIdentity,
              full_name: fullName,
              email_verified_at: nowIso,
              oauth_last_provider: provider,
              oauth_last_used_at: nowIso,
            },
            { onConflict: 'id', ignoreDuplicates: false },
          );
        } catch (upsertErr) {
          console.error('[auth/callback] oauth parents upsert failed:', upsertErr);
          // Don't block sign-in — the user has a valid session. They
          // may hit a consent prompt or profile incompleteness downstream.
        }
      } else {
        // AUTH-HIGH-004 (4C): first-successful-verification stamp for
        // email/password accounts. Admin client because the parents row
        // may pre-date RLS scope on the newly-minted session, and
        // because `.is(null)` makes this a no-op on repeat visits.
        try {
          await admin
            .from('parents')
            .update({ email_verified_at: new Date().toISOString() })
            .eq('id', user.id)
            .is('email_verified_at', null);
        } catch (stampErr) {
          console.error('[auth/callback] email_verified_at stamp failed:', stampErr);
        }
      }

      // AUTH-ENH-003: log the sign-in event. OAuth events are the
      // common case; we also log magic-link sign-ins as
      // 'signin.password' since both use email as the trust anchor.
      await logAuthEvent({
        parentId: user.id,
        eventType: isOAuth ? 'signin.oauth' : 'signin.password',
        provider: isOAuth ? provider : null,
        req,
      });

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Auth code exchange failed — redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}

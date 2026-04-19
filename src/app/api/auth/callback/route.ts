// GET /api/auth/callback — Handle OAuth and magic link auth callbacks
// HIGH-009: This handler was missing — OAuth and magic link flows were broken.
// AUTH-CRIT-003 (3C): `next` query param is validated against a strict
// whitelist regex to prevent open-redirect phishing after successful auth.
// AUTH-HIGH-004 (4C): Stamps `parents.email_verified_at` on the first
// successful code exchange. Idempotent — if the user lands on this
// handler again later (e.g., after a magic-link re-auth) we won't
// overwrite the original timestamp because the UPDATE is guarded by
// `.is('email_verified_at', null)`.
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase, createAdminClient } from '@/lib/supabase/server';

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
      // AUTH-HIGH-004 (4C): first-successful-verification stamp. We use
      // the admin client because the parents row may pre-date RLS scope
      // on the newly-minted session, and because the `.is(null)` guard
      // makes this update a no-op on repeat visits.
      try {
        const admin = createAdminClient();
        await admin
          .from('parents')
          .update({ email_verified_at: new Date().toISOString() })
          .eq('id', data.user.id)
          .is('email_verified_at', null);
      } catch (stampErr) {
        // Don't block sign-in if the stamp fails — log it and proceed.
        // The banner + checkout gate will still nudge the user to verify
        // if necessary.
        console.error('[auth/callback] email_verified_at stamp failed:', stampErr);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Auth code exchange failed — redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}

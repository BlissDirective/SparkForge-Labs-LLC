// GET /api/auth/callback — Handle OAuth and magic link auth callbacks
// HIGH-009: This handler was missing — OAuth and magic link flows were broken.
// AUTH-CRIT-003 (3C): `next` query param is validated against a strict
// whitelist regex to prevent open-redirect phishing after successful auth.
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/supabase/server';

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
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Auth code exchange failed — redirect to login with error
  return NextResponse.redirect(`${origin}/login?error=auth_callback_failed`);
}

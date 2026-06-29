// ════════════════════════════════════════════════════════════════
// verifyCronBearer — T17 DEPLOY-MED-003 (Opt A)
// ════════════════════════════════════════════════════════════════
// Single source of truth for cron-route bearer-token auth. Previously
// three routes (agent/schedule, agent/trending, cron/trial-reminders)
// each re-implemented the same Authorization: Bearer <CRON_SECRET>
// check. This helper centralizes the policy:
//
//   1. In production, CRON_SECRET MUST be set — return 500 if missing.
//   2. If set, the request's Authorization header MUST match exactly.
//      - Uses timing-safe comparison to defeat off-line equality
//        oracles. Crypto.timingSafeEqual guards against attackers
//        using response-latency diffs to brute-force the secret.
//   3. Returns a Response to short-circuit the handler on failure,
//      or null to indicate "you're good — proceed".
//
// Usage:
//   const denial = verifyCronBearer(req, { routeName: 'my-cron' });
//   if (denial) return denial;
//   // … handler body …
// ════════════════════════════════════════════════════════════════

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';

export interface VerifyCronOptions {
  /** Name used in server-side log lines. */
  routeName: string;
  /** Header name. Defaults to 'authorization'. */
  headerName?: string;
  /** Bearer prefix. Defaults to 'Bearer '. */
  prefix?: string;
}

/** Constant-time string compare. Returns false if lengths differ. */
function timingSafeEqualStr(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

/**
 * Verify the cron bearer token. Returns `null` on success (handler
 * should continue) or a `NextResponse` that MUST be returned
 * immediately on failure.
 */
export function verifyCronBearer(
  req: NextRequest,
  opts: VerifyCronOptions,
): NextResponse | null {
  const { routeName, headerName = 'authorization', prefix = 'Bearer ' } = opts;

  const authHeader = req.headers.get(headerName);
  const cronSecret = process.env.CRON_SECRET;

  // Missing secret is a deploy-time configuration error. The unauthenticated
  // bypass is NOT inferred from NODE_ENV (a mis-set staging NODE_ENV would have
  // silently exposed cron endpoints — audit §2.6); it requires an EXPLICIT
  // `ALLOW_UNAUTHENTICATED_CRON=true` opt-in, and never applies in production.
  if (!cronSecret) {
    const explicitlyAllowed =
      process.env.ALLOW_UNAUTHENTICATED_CRON === 'true' &&
      process.env.NODE_ENV !== 'production';

    if (!explicitlyAllowed) {
      console.error(
        `[cron/${routeName}] CRON_SECRET missing — endpoint blocked `
        + `(set CRON_SECRET, or ALLOW_UNAUTHENTICATED_CRON=true in non-production to bypass)`,
      );
      return NextResponse.json(
        { error: 'CRON_SECRET required', code: 'CONFIG_ERROR' },
        { status: 500 },
      );
    }

    // Explicit, non-production opt-in only.
    console.warn(
      `[cron/${routeName}] CRON_SECRET not set — auth skipped via ALLOW_UNAUTHENTICATED_CRON`,
    );
    return null;
  }

  // Must be a well-formed bearer header.
  if (!authHeader || !authHeader.startsWith(prefix)) {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
      { status: 401 },
    );
  }

  // Timing-safe match against the expected value.
  const expected = `${prefix}${cronSecret}`;
  if (!timingSafeEqualStr(authHeader, expected)) {
    return NextResponse.json(
      { error: 'Unauthorized', code: 'AUTH_REQUIRED' },
      { status: 401 },
    );
  }

  return null;
}

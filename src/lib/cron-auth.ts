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

  // Production gate — missing secret is a deploy-time configuration error.
  if (!cronSecret) {
    if (process.env.NODE_ENV === 'production') {
      console.error(
        `[cron/${routeName}] CRON_SECRET missing in production — endpoint blocked`,
      );
      return NextResponse.json(
        { error: 'CRON_SECRET required in production', code: 'CONFIG_ERROR' },
        { status: 500 },
      );
    }
    // Dev / test: allow the call through without auth. Log it so it
    // shows up in CI output if someone mistakenly removes the env.
    console.warn(
      `[cron/${routeName}] CRON_SECRET not set (non-production) — skipping auth`,
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

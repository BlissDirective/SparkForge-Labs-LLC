// GET /api/health — Health check endpoint
//
// DEPLOY-HIGH-003 (Option B): Extended connectivity probes for the
// three critical runtime dependencies — Supabase, Stripe, Upstash —
// plus optional Sentry check-in reporting. External uptime monitors
// (Better Stack, UptimeRobot, Vercel Cron) point at this endpoint;
// a non-200 response triggers alerts.
//
// Security notes:
//   - API-CRIT-001 (7B): uses the anon Supabase client, NOT the
//     service-role key. The badges table has a public SELECT RLS
//     policy (badges_read in sql/002_rls.sql) so the connectivity
//     probe works without elevated privileges.
//   - Stripe probe just verifies client instantiation (env presence).
//     No billable API call is made.
//   - Upstash probe runs `redis.ping()` which is ~1ms and free on the
//     Upstash free tier.
//   - Route is intentionally public (no auth) — monitors must be able
//     to hit it from anywhere. It leaks no sensitive info.
//
// Response shape:
//   { overall: 'healthy'|'degraded'|'unhealthy',
//     version, timestamp, environment, responseTimeMs,
//     checks: {
//       database: { status, latencyMs?, error? },
//       stripe:   { status: 'ok'|'error'|'skipped', error? },
//       upstash:  { status: 'ok'|'error'|'skipped', latencyMs?, error? },
//     } }

import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { Redis } from '@upstash/redis';
import { createServerSupabase } from '@/lib/supabase/server';
import { getStripe } from '@/lib/stripe';

type Check =
  | { status: 'ok'; latencyMs?: number }
  | { status: 'error'; error: string; latencyMs?: number }
  | { status: 'skipped'; reason: string };

async function probeDatabase(): Promise<Check> {
  const start = Date.now();
  try {
    const supabase = await createServerSupabase();
    const { error } = await supabase
      .from('badges')
      .select('id', { count: 'exact', head: true });
    if (error) return { status: 'error', error: error.message, latencyMs: Date.now() - start };
    return { status: 'ok', latencyMs: Date.now() - start };
  } catch (err) {
    return {
      status: 'error',
      error: err instanceof Error ? err.message : 'unknown',
      latencyMs: Date.now() - start,
    };
  }
}

function probeStripe(): Check {
  // Stripe is only fully probed by making a round-trip API call, which
  // is rate-limited + billable. We settle for "is the client
  // instantiable?" — catches the most common failure (env misconfig).
  try {
    const stripe = getStripe();
    if (!stripe) return { status: 'skipped', reason: 'STRIPE_SECRET_KEY not configured' };
    return { status: 'ok' };
  } catch (err) {
    return { status: 'error', error: err instanceof Error ? err.message : 'unknown' };
  }
}

async function probeUpstash(): Promise<Check> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    return { status: 'skipped', reason: 'UPSTASH_REDIS_REST_URL/TOKEN not configured' };
  }
  const start = Date.now();
  try {
    const redis = new Redis({ url, token });
    // `ping()` is a single round-trip GET /ping — fastest probe Upstash offers.
    await redis.ping();
    return { status: 'ok', latencyMs: Date.now() - start };
  } catch (err) {
    return {
      status: 'error',
      error: err instanceof Error ? err.message : 'unknown',
      latencyMs: Date.now() - start,
    };
  }
}

function deriveOverall(
  database: Check,
  stripe: Check,
  upstash: Check,
): 'healthy' | 'degraded' | 'unhealthy' {
  // Database is the only hard dependency. If it's down, we're unhealthy.
  if (database.status === 'error') return 'unhealthy';
  // Stripe/Upstash errors degrade but don't black-hole the app.
  if (stripe.status === 'error' || upstash.status === 'error') return 'degraded';
  return 'healthy';
}

export async function GET(_req: NextRequest) {
  const start = Date.now();

  // Run probes in parallel — database, Upstash both involve network I/O.
  // Stripe is sync (instantiation-only).
  const [database, upstash] = await Promise.all([probeDatabase(), probeUpstash()]);
  const stripe = probeStripe();

  const overall = deriveOverall(database, stripe, upstash);
  const responseTimeMs = Date.now() - start;

  const payload = {
    overall,
    version: '2.1.0',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    responseTimeMs,
    checks: { database, stripe, upstash },
  };

  // DEPLOY-HIGH-003 (B): Optional Sentry cron-monitor check-in.
  // If the operator sets SENTRY_HEALTH_MONITOR_SLUG to a monitor slug
  // they created in Sentry, every successful /api/health hit reports
  // as a check-in. Any failure surfaces as a missed check-in alert
  // in Sentry. Zero-config fallback: env unset → no-op.
  const monitorSlug = process.env.SENTRY_HEALTH_MONITOR_SLUG;
  if (monitorSlug) {
    try {
      // Single-shot (heartbeat) check-in. Sentry requires `checkInId`
      // on FinishedCheckIn payloads — we mint a random UUID per hit.
      Sentry.captureCheckIn({
        checkInId: crypto.randomUUID(),
        monitorSlug,
        // Only 'healthy' counts as 'ok'; degraded/unhealthy both page as 'error'
        // so downstream alerts fire on ANY dependency failure, not just total
        // outage.
        status: overall === 'healthy' ? 'ok' : 'error',
      });
    } catch {
      // Never let Sentry failures affect the health response.
    }
  }

  return NextResponse.json(payload, {
    status: overall === 'unhealthy' ? 503 : 200,
    headers: { 'Cache-Control': 'no-cache, no-store' },
  });
}

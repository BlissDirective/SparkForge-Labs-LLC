// ════════════════════════════════════════════════════════════════
// Sentry Transactions — T16 DEPLOY-MED-002 (Opt A+B)
// ════════════════════════════════════════════════════════════════
// Thin wrappers over Sentry's `startSpan` API so that the three
// high-value operations the audit called out get first-class
// performance tracing, and Supabase queries get consistent DB spans.
//
// All helpers are no-ops when Sentry is disabled (development by
// default — see instrumentation.ts `enabled: NODE_ENV === production`).
// Callers never need to branch on env.
//
// Transactions / op tags:
//   - stripe.webhook     → "http.server" / "webhook.stripe"
//   - ai.generate        → "ai.generate.content"
//   - game.complete      → "game.complete"
//   - db.supabase.<name> → "db.query" (for withDbSpan)
//
// The `release` field in Sentry.init picks up VERCEL_GIT_COMMIT_SHA
// automatically, so every span here correlates to a deploy.
// ════════════════════════════════════════════════════════════════

import * as Sentry from '@sentry/nextjs';

/** Attach a `release` + `environment` to Sentry options if available. */
export function sentryReleaseEnv(): { release?: string; environment: string } {
  const sha =
    process.env.SENTRY_RELEASE ||
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
    process.env.VERCEL_GIT_COMMIT_SHA ||
    undefined;
  const env =
    process.env.SENTRY_ENVIRONMENT ||
    process.env.VERCEL_ENV ||
    process.env.NODE_ENV ||
    'development';
  return sha ? { release: sha, environment: env } : { environment: env };
}

/** Generic span wrapper. Returns the fn's result or rethrows. */
export async function withSpan<T>(
  name: string,
  op: string,
  fn: (span: Sentry.Span | undefined) => Promise<T> | T,
  attributes: Record<string, string | number | boolean> = {},
): Promise<T> {
  return Sentry.startSpan({ name, op, attributes }, async (span) => {
    try {
      const result = await fn(span);
      span?.setStatus({ code: 1 }); // OK
      return result;
    } catch (err) {
      span?.setStatus({ code: 2, message: (err as Error)?.message ?? 'error' });
      throw err;
    }
  });
}

// ── Stripe webhook transaction ───────────────────────────────────
export async function traceStripeWebhook<T>(
  eventType: string,
  fn: () => Promise<T> | T,
): Promise<T> {
  return withSpan(`stripe.webhook ${eventType}`, 'webhook.stripe', fn, {
    'stripe.event_type': eventType,
  });
}

// ── AI API call transaction ──────────────────────────────────────
export async function traceAiApiCall<T>(
  contentType: string,
  gameId: string,
  fn: () => Promise<T> | T,
): Promise<T> {
  return withSpan(`ai.generate ${contentType}`, 'ai.generate.content', fn, {
    'ai.content_type': contentType,
    'ai.game_id': gameId,
  });
}

// ── Game completion transaction ──────────────────────────────────
/** Trace the end-to-end reward pipeline for a completed game (or
 *  lesson / spark-fact / etc. — `source` can be any pipeline type). */
export async function traceGameCompletion<T>(
  source: string,
  childId: string,
  fn: () => Promise<T> | T,
): Promise<T> {
  return withSpan(`game.complete ${source}`, 'game.complete', fn, {
    'game.source': source,
    // Child ID is stripped by instrumentation.ts beforeSend for COPPA,
    // but Sentry still uses it to link spans into a single trace.
    'user.id_prefix': childId.slice(0, 8),
  });
}

// ── DB query span (for Supabase calls) ───────────────────────────
export async function withDbSpan<T>(
  description: string,
  fn: () => Promise<T> | T,
): Promise<T> {
  return withSpan(description, 'db.query', fn, {
    'db.system': 'postgresql',
    'db.operation': description,
  });
}

// API-ENH-004 (Recommended): Progress write span. Wraps the
// /api/progress POST handler's DB mutation so a single trace covers
// the full "child completed content" latency path (auth → ownership
// verify → upsert → XP award → realtime broadcast).
export async function traceProgressWrite<T>(
  childIdPrefix: string,
  contentId: string,
  fn: () => Promise<T> | T,
): Promise<T> {
  return withSpan('progress.write', 'progress.write', fn, {
    'progress.content_id': contentId,
    'user.id_prefix': childIdPrefix.slice(0, 8),
  });
}

// API-ENH-004 (Recommended): Supabase RPC span. Use for named RPC
// calls so the Sentry UI shows per-function latency instead of a
// generic "postgres" bucket.
export async function withSupabaseRpc<T>(
  functionName: string,
  fn: () => Promise<T> | T,
  attrs: Record<string, string | number | boolean> = {},
): Promise<T> {
  return withSpan(`supabase.rpc.${functionName}`, 'db.query', fn, {
    'db.system': 'postgresql',
    'db.operation': 'rpc',
    'db.rpc.function': functionName,
    ...attrs,
  });
}

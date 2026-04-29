import * as Sentry from '@sentry/nextjs';
import { sentryReleaseEnv } from '@/lib/sentry-transactions';
// API-ENH-004 (Recommended): OpenTelemetry auto-instrumentation for
// Node HTTP, fetch, and @supabase/supabase-js. @vercel/otel wires the
// OTLP exporter to Vercel's trace collection and also makes OTel
// spans visible to Sentry (which installs an OTel-compatible SDK).
import { registerOTel } from '@vercel/otel';

// CRIT-003: Strip child PII fields from Sentry events (COPPA compliance)
const CHILD_PII_KEYS = [
  'display_name', 'displayName', 'child_name', 'childName',
  'age_band', 'ageBand', 'age', 'avatar', 'avatar_url',
  'xp', 'level', 'streak', 'badges', 'activeChild',
  'child_id', 'childId', 'children',
];

function stripChildPII(obj: Record<string, unknown>): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (CHILD_PII_KEYS.some(pii => key.toLowerCase().includes(pii.toLowerCase()))) {
      cleaned[key] = '[Redacted - COPPA]';
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      cleaned[key] = stripChildPII(value as Record<string, unknown>);
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

function beforeSend(event: Parameters<NonNullable<Parameters<typeof Sentry.init>[0]['beforeSend']>>[0]) {
  if (event.contexts) {
    event.contexts = stripChildPII(event.contexts as Record<string, unknown>) as typeof event.contexts;
  }
  if (event.extra) {
    event.extra = stripChildPII(event.extra as Record<string, unknown>);
  }
  if (event.tags) {
    event.tags = stripChildPII(event.tags as Record<string, unknown>) as typeof event.tags;
  }
  return event;
}

const SENTRY_BASE_CONFIG = {
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  // T16 DEPLOY-MED-002 (Opt A): release + env tagging. `release`
  // falls back to VERCEL_GIT_COMMIT_SHA so every event correlates
  // to a deploy; `environment` honors VERCEL_ENV (preview/prod).
  ...sentryReleaseEnv(),
  enabled: process.env.NODE_ENV === 'production',
  beforeSend,
} as const;

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // API-ENH-004 (Recommended): register OTel BEFORE Sentry so the
    // Sentry SDK hooks into the pre-installed OTel context. This gives
    // us automatic spans on:
    //   - inbound HTTP (Next.js route handlers)
    //   - outbound fetch (Stripe, Anthropic, Resend, Supabase REST)
    //   - child spans created via withSpan / traceStripeWebhook etc.
    // Skipped when SENTRY_DSN is unset (dev) so localhost stays quiet.
    if (process.env.SENTRY_DSN || process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
      registerOTel({
        serviceName: 'sparkforge',
        // Vercel injects OTEL_EXPORTER_OTLP_ENDPOINT on Pro plans. Sentry
        // DSN also configures an OTLP-compatible receiver when present.
      });
    }

    Sentry.init(SENTRY_BASE_CONFIG);
  }

  if (process.env.NEXT_RUNTIME === 'edge') {
    Sentry.init(SENTRY_BASE_CONFIG);
  }
}

// Sentry v9 + Next.js 15.5: capture errors from nested React Server Components
export const onRequestError = Sentry.captureRequestError;

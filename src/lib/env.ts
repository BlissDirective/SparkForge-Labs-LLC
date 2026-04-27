// ════════════════════════════════════════════════════
// ENVIRONMENT VALIDATION — Zod schema for required env vars
// S10-HIGH-007: Validates at import time for clear startup errors
// COPPA-PRD-E: Hard-fail in production when required secrets are
// missing. Previously every var was silently optional, which let
// production builds deploy with broken Stripe / Anthropic / rate
// limiting / CSRF — degrading silently to 503 or insecure defaults.
// ════════════════════════════════════════════════════

import { z } from 'zod';

// ── Server-side environment schema ──
// Schema keeps fields .optional() so consumer types stay compatible
// (string | undefined). The boot-time check below enforces presence
// in production with a clear, actionable error message.

const serverEnvSchema = z.object({
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),

  // Stripe — core
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),

  // Stripe — price IDs (one per plan × cadence)
  STRIPE_PLUS_MONTHLY_ID: z.string().optional(),
  STRIPE_PLUS_YEARLY_ID: z.string().optional(),
  STRIPE_FORGE_MONTHLY_ID: z.string().optional(),
  STRIPE_FORGE_YEARLY_ID: z.string().optional(),

  // Anthropic
  ANTHROPIC_API_KEY: z.string().optional(),

  // Sentry
  SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
  SENTRY_HEALTH_MONITOR_SLUG: z.string().optional(),

  // Security
  CSRF_SECRET: z.string().min(32, 'must be ≥32 chars').optional(),
  CRON_SECRET: z.string().min(16, 'must be ≥16 chars').optional(),

  // Rate limiting (Upstash Redis — required on Vercel; in-memory
  // fallback is per-instance and effectively bypassable in serverless)
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().optional(),

  // Email (Resend)
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),

  // CAPTCHA (Supabase Auth)
  NEXT_PUBLIC_CAPTCHA_PROVIDER: z.string().optional(),
  NEXT_PUBLIC_CAPTCHA_SITE_KEY: z.string().optional(),

  // App
  NEXT_PUBLIC_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

// Variables that MUST be present when NODE_ENV=production.
// Missing any of these throws on import and aborts boot/build.
const PROD_REQUIRED: Array<keyof ServerEnv> = [
  // Supabase — no app without DB
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  // Stripe — no payments without all of these
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
  'STRIPE_PLUS_MONTHLY_ID',
  'STRIPE_PLUS_YEARLY_ID',
  'STRIPE_FORGE_MONTHLY_ID',
  'STRIPE_FORGE_YEARLY_ID',
  // Anthropic — Prompt Lab feature is an advertised paid capability
  'ANTHROPIC_API_KEY',
  // Sentry — server + client DSN required for monitoring
  'SENTRY_DSN',
  'NEXT_PUBLIC_SENTRY_DSN',
  // Security — CSRF and cron auth must not silently fall back
  'CSRF_SECRET',
  'CRON_SECRET',
  // Rate limiting — in-memory Map is bypassable in serverless
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  // App URL — required for OG, sitemap, Sentry release tagging
  'NEXT_PUBLIC_URL',
];

// Variables that should be set in production but are non-blocking.
// Missing → warn on boot. App still functions, feature degrades.
const PROD_RECOMMENDED: Array<{ key: keyof ServerEnv; reason: string }> = [
  { key: 'SENTRY_AUTH_TOKEN', reason: 'source maps will not upload to Sentry; stack traces will be minified' },
  { key: 'SENTRY_ORG', reason: 'release tagging disabled' },
  { key: 'SENTRY_PROJECT', reason: 'release tagging disabled' },
  { key: 'RESEND_API_KEY', reason: 'transactional email disabled (trial reminders, admin notifications)' },
  { key: 'EMAIL_FROM', reason: 'transactional email will use default sender' },
  { key: 'NEXT_PUBLIC_CAPTCHA_SITE_KEY', reason: 'auth CAPTCHA widget will not render' },
];

// Parse once at module load — throws immediately with a clear message.
function validateEnv(): ServerEnv {
  const result = serverEnvSchema.safeParse(process.env);
  if (!result.success) {
    const formatted = result.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(
      `\n\n❌ Environment validation failed (schema):\n${formatted}\n\nCheck your .env.local file.\n`
    );
  }

  const data = result.data;
  const isProd = data.NODE_ENV === 'production';
  const skip = process.env.SKIP_ENV_VALIDATION === '1';

  if (isProd && !skip) {
    const missing = PROD_REQUIRED.filter((k) => {
      const v = data[k];
      return v === undefined || v === '' || v === null;
    });

    if (missing.length > 0) {
      throw new Error(
        `\n\n❌ Production environment validation failed.\n` +
          `The following variables are REQUIRED in production but missing or empty:\n\n` +
          missing.map((k) => `  - ${k}`).join('\n') +
          `\n\nFix: Vercel Dashboard → Project → Settings → Environment Variables → Production scope.\n` +
          `To bypass during a one-off build (NOT for production deploys), set SKIP_ENV_VALIDATION=1.\n`
      );
    }

    const warnings = PROD_RECOMMENDED.filter(({ key }) => {
      const v = data[key];
      return v === undefined || v === '' || v === null;
    });

    if (warnings.length > 0) {
      // eslint-disable-next-line no-console
      console.warn(
        `\n⚠️  Production environment warnings:\n` +
          warnings.map(({ key, reason }) => `  - ${key} not set — ${reason}`).join('\n') +
          `\n`
      );
    }
  }

  return data;
}

export const env = validateEnv();

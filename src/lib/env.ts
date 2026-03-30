// ════════════════════════════════════════════════════
// ENVIRONMENT VALIDATION — Zod schema for required env vars
// S10-HIGH-007: Validates at import time for clear startup errors
// ════════════════════════════════════════════════════

import { z } from 'zod';

// ── Server-side environment schema ──
// Required vars throw on startup if missing; optional vars return undefined.

const serverEnvSchema = z.object({
  // Supabase (optional during build — required at runtime for DB operations)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),

  // Stripe (optional — graceful 503 fallback per ENH-8A)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),

  // Anthropic (optional — graceful 503 fallback per ENH-9A)
  ANTHROPIC_API_KEY: z.string().optional(),

  // Sentry (optional — monitoring disabled if absent)
  SENTRY_DSN: z.string().optional(),
  SENTRY_ORG: z.string().optional(),
  SENTRY_PROJECT: z.string().optional(),

  // App
  NEXT_PUBLIC_URL: z.string().url().optional(),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

// Parse once at module load — throws immediately with clear message if invalid
function validateEnv(): ServerEnv {
  const result = serverEnvSchema.safeParse(process.env);
  if (!result.success) {
    const formatted = result.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(
      `\n\n❌ Environment validation failed:\n${formatted}\n\nCheck your .env.local file.\n`
    );
  }
  return result.data;
}

export const env = validateEnv();

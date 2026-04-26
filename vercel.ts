// ════════════════════════════════════════════════════
// VERCEL PROJECT CONFIGURATION (typed)
//
// Replaces the previous vercel.json. The TypeScript form gives us:
//   - compile-time validation of schedule strings, paths, schemas
//   - per-environment branching via VERCEL_ENV (e.g., enable cron only
//     on production deploys to avoid duplicate runs from previews)
//   - one place to add future rewrites, redirects, headers, etc.
//
// Cron schedules (UTC):
//   • /api/agent/schedule       — daily at 06:00
//   • /api/agent/trending       — weekly Monday at 08:00
//   • /api/cron/trial-reminders — daily at 10:00
//   • /api/cron/dunning         — daily at 10:15
//
// All four endpoints verify the Vercel cron bearer via verifyCronBearer
// (CRON_SECRET). Schedules apply only to Production deploys per Vercel's
// default cron behavior, but we additionally guard with VERCEL_ENV here
// so a future Preview-with-crons opt-in stays explicit.
//
// Static security headers + cache headers continue to live in
// next.config.ts:headers() — they are framework-coupled and benefit from
// Next's request-aware composition (CSP nonce per request, etc.).
// ════════════════════════════════════════════════════

import type { VercelConfig } from '@vercel/config/v1';

type CronJob = NonNullable<VercelConfig['crons']>[number];

const PRODUCTION_CRONS: CronJob[] = [
  { path: '/api/agent/schedule', schedule: '0 6 * * *' },
  { path: '/api/agent/trending', schedule: '0 8 * * 1' },
  { path: '/api/cron/trial-reminders', schedule: '0 10 * * *' },
  { path: '/api/cron/dunning', schedule: '15 10 * * *' },
];

const isProduction = process.env.VERCEL_ENV === 'production';

export const config: VercelConfig = {
  crons: isProduction ? PRODUCTION_CRONS : [],
};

export default config;

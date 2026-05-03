# SparkForge Deployment Guide

## Prerequisites

- Node.js 20+
- Vercel CLI: `npm i -g vercel`
- Supabase project created
- Stripe account with products configured
- Anthropic API key (for Content Agent)

## 1. Environment Setup

Copy `.env.example` to `.env.local` and fill in all values:

```bash
cp .env.example .env.local
```

**Required variables — HARD FAIL at boot if missing in production (18 total):**

| Variable | Source | Required For |
|----------|--------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase Dashboard → Settings → API | Database |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API | Client auth |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Settings → API | Server-side DB |
| `ANTHROPIC_API_KEY` | Anthropic Console | Prompt Lab + Content Agent |
| `STRIPE_SECRET_KEY` | Stripe Dashboard → Developers → API keys | Payments |
| `STRIPE_WEBHOOK_SECRET` | Stripe Dashboard → Developers → Webhooks | Payment events |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe Dashboard → Developers → API keys | Client checkout |
| `STRIPE_PLUS_MONTHLY_ID` | Stripe Dashboard → Products | Plus tier pricing |
| `STRIPE_PLUS_YEARLY_ID` | Stripe Dashboard → Products | Plus tier pricing |
| `STRIPE_FORGE_MONTHLY_ID` | Stripe Dashboard → Products | Forge tier pricing |
| `STRIPE_FORGE_YEARLY_ID` | Stripe Dashboard → Products | Forge tier pricing |
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry Dashboard → Settings → Client Keys | Client error tracking |
| `SENTRY_DSN` | Sentry Dashboard → Settings → Client Keys | Server error tracking |
| `NEXT_PUBLIC_URL` | Your production domain | SEO, sitemap, OG tags |
| `NEXT_PUBLIC_APP_URL` | Your production domain | Internal links |
| `CSRF_SECRET` | Generate: `openssl rand -hex 32` | CSRF token signing |
| `CRON_SECRET` | Generate: `openssl rand -hex 16` | Cron job auth |
| `UPSTASH_REDIS_REST_URL` | Upstash Console → Database → REST URL | Distributed rate limiting |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Console → Database → REST Token | Distributed rate limiting |

**Recommended variables — non-blocking, feature degrades gracefully:**

| Variable | Source | Required For |
|----------|--------|-------------|
| `SENTRY_AUTH_TOKEN` | Sentry Dashboard → Settings → Auth Tokens | Source map upload (readable stack traces) |
| `SENTRY_ORG` | Your Sentry org slug | Sentry release tagging |
| `SENTRY_PROJECT` | Your Sentry project slug | Sentry release tagging |
| `RESEND_API_KEY` | resend.com → API Keys | Trial reminder + admin emails |
| `EMAIL_FROM` | Verified domain in Resend | Custom email sender |
| `NEXT_PUBLIC_CAPTCHA_SITE_KEY` | hCaptcha / Turnstile dashboard | Auth CAPTCHA widget |

**Optional variables — feature-specific or environment overrides:**

| Variable | Default | Notes |
|----------|---------|-------|
| `NEXT_PUBLIC_CAPTCHA_PROVIDER` | `hcaptcha` | `hcaptcha` or `turnstile` |
| `SENTRY_HEALTH_MONITOR_SLUG` | unset | Sentry Cron Monitor slug for `/api/health` |
| `SENTRY_ENVIRONMENT` | `VERCEL_ENV` → `NODE_ENV` | Override Sentry environment tag |
| `SENTRY_RELEASE` | `VERCEL_GIT_COMMIT_SHA` | Override Sentry release SHA |
| `ENABLE_CONTENT_AGENT` | `true` | Enable AI content pipeline |
| `NEXT_PUBLIC_FF_*` | `false` | Feature flags — see `.env.example` for full list |

**Vercel auto-injected — do NOT set manually:**

| Variable | Injected By |
|----------|-------------|
| `VERCEL_ENV` | Vercel (production/preview/development) |
| `VERCEL_GIT_COMMIT_SHA` | Vercel |
| `NODE_ENV` | Vercel (always `production` on deployed builds) |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | Vercel Pro (when OTel is enabled in dashboard) |

> **Note:** `NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA` is NOT auto-exposed. Enable it via: Vercel Dashboard → Project → Settings → Environment Variables → "Expose System Environment Variables".

## 2. Database Setup

Run these SQL files in Supabase SQL Editor **in order**:

| Order | File | Purpose |
|-------|------|---------|
| 1 | `sql/001_schema.sql` | All CREATE TABLE statements (9 tables) |
| 2 | `sql/001a_indexes.sql` | Performance indexes (14) |
| 3 | `sql/001b_rls.sql` | Row Level Security policies |
| 4 | `sql/001c_functions.sql` | Database functions |
| 5 | `sql/002_badges.sql` | 68 badge definitions |
| 6 | `sql/003_seed_content.sql` | 6 starter content items |
| 7 | `sql/004_cron.sql` | Cron scheduling |
| 8 | `sql/005_verify.sql` | Verification queries |
| 9 | `sql/stage9-seed-content.sql` | 300 seed content items (150 lessons, 90 quizzes, 60 facts) |

Set yourself as admin:

```sql
UPDATE parents SET is_admin = true WHERE email = 'your@email.com';
```

## 3. Stripe Setup

1. Create products in Stripe Dashboard:
   - **Spark Plus** at $7.99/mo, $79.99/yr
   - **Spark Forge** at $14.99/mo, $149.99/yr

2. Copy the 4 price IDs to your `.env.local`

3. Set up webhook endpoint:
   - **URL:** `https://your-domain.com/api/stripe/webhook`
   - **Events:**
     - `checkout.session.completed`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_failed`

## 4. Local Development

```bash
npm install
npm run dev
# App runs at http://localhost:3000
```

## 5. Deploy to Vercel

```bash
vercel login
vercel link
```

Add ALL env vars in **Vercel Dashboard → Settings → Environment Variables**.

```bash
vercel --prod
```

### Auto-Deploy Setup

Connect your GitHub repo in Vercel Dashboard:
- Push to `main` → production deployment
- Pull requests → preview deployments

## 6. Post-Deployment

1. Update `NEXT_PUBLIC_URL` in Vercel env vars to your production URL
2. Update Stripe webhook URL to production domain
3. Verify `vercel.json` cron triggers content agent at 6 AM UTC
4. Run Lighthouse audit — targets:
   - Performance: 90+
   - Accessibility: 95+
   - Best Practices: 90+
   - SEO: 95+

## 7. Ongoing Operations

| Frequency | Task |
|-----------|------|
| Daily | Content agent runs at 6 AM UTC (Vercel cron) |
| Weekly | Review content queue in admin dashboard (`/admin/content`) |
| Monthly | Check Stripe billing, review analytics, audit npm dependencies |
| Quarterly | Update Anthropic API model strings if new versions available |

## 8. Monitoring

- **Vercel Analytics:** Auto-enabled for Web Vitals monitoring
- **Error tracking:** Check Vercel logs for runtime errors
- **Database:** Monitor Supabase Dashboard → Database → Health
- **Stripe:** Monitor Stripe Dashboard → Events for webhook failures

## 8a. Backups & Disaster Recovery

**T18 DEPLOY-MED-001 (Opt B)** — Supabase PITR + drilled recovery.

- **Daily snapshots** — enabled by default on Supabase Pro (7-day
  retention).
- **Point-in-Time Recovery (PITR)** — MUST be enabled before launch:
  Supabase Dashboard → Project Settings → Database → Point-in-Time
  Recovery → Enable. RPO ≤ 2 min, RTO ~1 h.
- **Recovery runbook** → [`docs/DISASTER_RECOVERY.md`](./docs/DISASTER_RECOVERY.md)
  documents PITR drills, snapshot restores, total-region fallback, and
  the monthly drill cadence.
- **Operator script** → `scripts/disaster-recovery.sh` wraps the common
  `pg_dump` / PITR operations so you aren't typing `psql` under
  pressure. Commands: `snapshot`, `verify`, `pitr-drill`,
  `dump-table`, `restore-table`, `reconcile`.

## 9. Troubleshooting

| Issue | Solution |
|-------|---------|
| 3D components crash on server | Ensure all R3F imports use `dynamic(() => import(...), { ssr: false })` |
| Content Agent returns 503 | Check `ANTHROPIC_API_KEY` is set in Vercel env vars |
| Stripe checkout fails | Verify all 4 price IDs match Stripe Dashboard products |
| Build fails with Three.js errors | `next.config.ts` must externalize `three`, `@react-three/fiber`, `@react-three/drei` via `serverExternalPackages` |
| Hydration mismatch | Check that `<html>` has `suppressHydrationWarning` and A11yProvider uses mounted guard |

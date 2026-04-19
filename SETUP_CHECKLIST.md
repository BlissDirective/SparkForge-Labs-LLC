# SparkForge — Stripe + SQL + Vercel End-to-End Setup Checklist

> **Target audience:** Someone standing up SparkForge on fresh Supabase + Stripe + Vercel accounts.
> **Companion doc:** `DEPLOYMENT.md` (narrative walkthrough). This file is a tight, actionable checklist.
> **Branch context:** Audit-subscription-payment branch adds Gap 1–5 (admin tooling, trials, downgrade, usage, celebration). The checklist below assumes you are deploying with those features included.

---

## Quick-Start Order

```
┌───────────────────────────────────────────────────────────────┐
│ 1. Supabase project + SQL migrations (5 min)                  │
│ 2. Stripe products, prices, webhook endpoint (10 min)         │
│ 3. Anthropic + Sentry API keys (2 min)                        │
│ 4. Vercel project + env vars + deploy (10 min)                │
│ 5. Post-deploy verification — 4 smoke tests (5 min)           │
└───────────────────────────────────────────────────────────────┘
```

---

# Phase 1 — Supabase

## 1.1 Create Project

- [ ] Sign in at [supabase.com](https://supabase.com) → **New Project**
- [ ] Note the **project ref** (the subdomain in your `*.supabase.co` URL)
- [ ] From **Project Settings → API**, copy:
  - [ ] `Project URL` → will become `NEXT_PUBLIC_SUPABASE_URL`
  - [ ] `anon` public key → will become `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - [ ] `service_role` secret key → will become `SUPABASE_SERVICE_ROLE_KEY` (⚠️ server-only)
- [ ] **AUTH-HIGH-004 — Enable email confirmation** (required for signup to gate login behind email verification):
  - [ ] In Supabase dashboard → **Authentication → Providers → Email** → toggle **"Confirm email" ON**
  - [ ] In **Authentication → URL Configuration**, set:
    - **Site URL** = `https://<your-prod-domain>` (or `http://localhost:3000` during dev)
    - **Redirect URLs** includes `https://<your-prod-domain>/api/auth/callback` (and your dev variant)

## 1.2 Run SQL Migrations — IN ORDER

Open **SQL Editor** in the Supabase dashboard and run these files **one at a time, in this exact order**. Each file is idempotent (uses `IF NOT EXISTS`).

| # | File | Purpose |
|---|------|---------|
| 1 | `sql/001_schema.sql` | Base tables: `parents`, `children`, `content`, `progress`, `badges`, etc. |
| 2 | `sql/001a_indexes.sql` | Performance indexes |
| 3 | `sql/002_rls.sql` | Row-level security policies |
| 4 | `sql/003_functions.sql` | Database functions (XP calc, level titles) |
| 5 | `sql/004_badges_seed.sql` | Seed 70+ badges |
| 6 | `sql/005_content_seed.sql` | Seed base content (labs 1–10) |
| 7 | `sql/006_cron.sql` | pg_cron jobs (daily prompt/game counter resets) |
| 8 | `sql/schema-stage8.sql` | Subscription columns on `parents`, `subscription_events` table |
| 9 | `sql/schema-stage8-dashboard-fn.sql` | Parent dashboard aggregate function |
| 10 | `sql/schema-stage9.sql` | Content queue + agent runs |
| 11 | `sql/schema-fll-content-types.sql` | FL-Lite content types |
| 12 | **`sql/schema-stage8-patch-admin-trials.sql`** (new) | **Gap 1+2: `stripe_subscription_id`, `trial_ends_at`, `subscription_period_end`** |
| 13 | **`sql/schema-stage8-patch-children-archive.sql`** (new) | **Gap 3: `children.deactivated_at` for soft-archive on downgrade** |
| 14 | `sql/stage9-seed-content.sql` | Seed agent-generated content samples |
| 15 | **`sql/008_subscription_events_processed.sql`** (Phase 1 audit) | **PAY-CRIT-001: adds `processed` + `processed_at` on `subscription_events` for webhook replay protection. Backfills existing rows as processed.** |
| 16 | **`sql/009_subscription_events_split.sql`** (Phase 1 audit) | **DB-CRIT-001: creates admin-only `subscription_events_detail` for raw Stripe payload; migrates and drops `data` from metadata table; adds parent SELECT policy. MUST run after 008.** |
| 17 | **`sql/010_rls_belt_and_suspenders.sql`** (Phase 1 audit) | **DB-CRIT-002: defensive re-assertion of RLS on all 12 protected tables. Idempotent. Emits warnings on any unprotected `public` table.** |
| 18 | **`sql/011_parents_email_verified_at.sql`** (Phase 2 audit) | **AUTH-HIGH-004: adds nullable `parents.email_verified_at` column + partial index on unverified rows. Stamped by `/api/auth/callback`. Consumed by Stripe checkout gate and EmailVerifyBanner.** |
| 19 | **`sql/012_xp_daily_cap.sql`** (Phase 2 audit) | **API-HIGH-003: adds `children.xp_awarded_today` + `xp_reset_date` columns with a BEFORE UPDATE trigger `reset_daily_xp` that zeroes the counter at the start of each new day. Consumed by `/api/gamification/xp` to enforce `DAILY_XP_CAP = 10000` per child.** |
| 20 | **`sql/013_content_admin_tighten.sql`** (Phase 2 audit) | **DB-HIGH-001: drops the overly broad `content_admin_all FOR ALL` policy and splits it into SELECT / INSERT / UPDATE (no DELETE so admins cannot hard-delete content). Adds `content.updated_by` + `content.update_reason` audit columns.** |
| 21 | **`sql/014_audit_log.sql`** (Phase 2 audit) | **DB-HIGH-002: creates generic `audit_log` table + `audit_trigger()` SECURITY DEFINER function attached to `parents`, `children`, `content`, `content_queue`, `subscription_events` for INSERT/UPDATE/DELETE. Admin-read-only RLS. 90-day pg_cron retention job (`audit-log-retention`, 00:15 UTC).** |
| 22 | **`sql/015_pg_cron_daily_resets.sql`** (Phase 2 audit) | **DB-HIGH-003: schedules `daily-reset-prompts` (00:00 UTC), `daily-reset-xp` (00:02 UTC), and `weekly-reset-games` (Mon 00:04 UTC) pg_cron jobs that actively zero stale `children` counters. BEFORE UPDATE triggers + app-level `reset_date >= today` guards remain as defense-in-depth. Skips cleanly on Supabase Free (no pg_cron).** |

### Verify Phase 1 audit migrations (after running 008–010)

```sql
-- 008: processed flag exists on subscription_events
SELECT column_name FROM information_schema.columns
 WHERE table_name = 'subscription_events' AND column_name IN ('processed', 'processed_at');
-- Expect 2 rows.

-- 009: subscription_events_detail table exists + data column gone from metadata
SELECT table_name FROM information_schema.tables
 WHERE table_schema = 'public' AND table_name = 'subscription_events_detail';
-- Expect 1 row.

SELECT column_name FROM information_schema.columns
 WHERE table_name = 'subscription_events' AND column_name = 'data';
-- Expect 0 rows (column dropped).

-- 010: every public table has RLS enabled
SELECT tablename FROM pg_tables
 WHERE schemaname = 'public' AND rowsecurity = false;
-- Expect 0 rows. If any, run `sql/verify_rls.sql` for details.
```

### Verify Phase 2 audit migrations (after running 011–012)

```sql
-- 011: parents.email_verified_at column + unverified partial index
SELECT column_name, data_type FROM information_schema.columns
 WHERE table_name = 'parents' AND column_name = 'email_verified_at';
-- Expect 1 row, type `timestamp with time zone`.

SELECT indexname FROM pg_indexes
 WHERE tablename = 'parents' AND indexname = 'idx_parents_unverified';
-- Expect 1 row.

-- 012: children daily-XP counter columns + reset trigger
SELECT column_name, data_type FROM information_schema.columns
 WHERE table_name = 'children' AND column_name IN ('xp_awarded_today', 'xp_reset_date')
 ORDER BY column_name;
-- Expect 2 rows (xp_awarded_today = integer, xp_reset_date = date).

SELECT tgname FROM pg_trigger
 WHERE tgrelid = 'children'::regclass AND tgname = 'reset_daily_xp_trigger';
-- Expect 1 row.

SELECT proname FROM pg_proc WHERE proname = 'reset_daily_xp';
-- Expect 1 row (the trigger function).

-- 013: content admin policies split (no DELETE) + audit columns
SELECT polname FROM pg_policy
 WHERE polrelid = 'content'::regclass
 ORDER BY polname;
-- Expect rows including: content_admin_select, content_admin_insert,
--   content_admin_update, content_read_published.
-- MUST NOT include the old content_admin_all.

SELECT column_name FROM information_schema.columns
 WHERE table_name = 'content' AND column_name IN ('updated_by', 'update_reason')
 ORDER BY column_name;
-- Expect 2 rows.

-- 014: audit_log table + triggers on 5 critical tables
SELECT table_name FROM information_schema.tables
 WHERE table_schema = 'public' AND table_name = 'audit_log';
-- Expect 1 row.

SELECT tgname, tgrelid::regclass::text AS target_table
  FROM pg_trigger
 WHERE tgname LIKE 'audit_trigger_%'
 ORDER BY tgname;
-- Expect 5 rows: parents, children, content, content_queue,
--                subscription_events.

SELECT proname FROM pg_proc WHERE proname = 'audit_trigger';
-- Expect 1 row.

-- Optional (Pro plans only): verify pg_cron retention job
SELECT jobname FROM cron.job WHERE jobname = 'audit-log-retention';
-- Expect 1 row on Supabase Pro; 0 rows on Free (no pg_cron).

-- 015: daily / weekly reset cron jobs
SELECT jobname, schedule FROM cron.job
 WHERE jobname IN ('daily-reset-prompts', 'daily-reset-xp', 'weekly-reset-games')
 ORDER BY jobname;
-- Expect 3 rows on Supabase Pro; 0 rows on Free.
```

A separate verification script `sql/verify_rls.sql` is also available — not a migration, but a hard gate used by CI. Run it from your machine with:

```bash
psql "$SUPABASE_DB_URL" -f sql/verify_rls.sql
# or
supabase db execute -f sql/verify_rls.sql
```

It raises an exception (non-zero exit) if any `public` table lacks RLS or has no policies.

> The two **bold NEW** files are included in this branch. Their full SQL is provided in [Appendix A](#appendix-a--sql-code-blocks) for copy-paste without needing to clone the repo.

### Verify migrations ran

Run this in the SQL Editor and confirm all columns appear:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'parents'
ORDER BY ordinal_position;
```

Expected columns (post Gap 1+2 + Phase 2 audit 011):
`id, email, full_name, stripe_customer_id, subscription_tier, subscription_status, onboarding_complete, coppa_consent_at, is_admin, stripe_subscription_id, trial_ends_at, subscription_period_end, email_verified_at, created_at, updated_at`

```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'children' AND column_name IN (
  'deactivated_at', 'xp_awarded_today', 'xp_reset_date'
) ORDER BY column_name;
```

Must return 3 rows (post Gap 3 archive migration + Phase 2 audit 012 daily-XP counters).

## 1.3 Create First Admin User (recommended)

Sign up once through the app (`/signup`), then promote to admin in the SQL Editor:

```sql
-- Promote a parent account to admin
UPDATE parents SET is_admin = true WHERE email = 'your-email@example.com';

-- Verify the promotion
SELECT email, is_admin FROM parents WHERE email = 'your-email@example.com';
```

To **revoke** admin access later:

```sql
UPDATE parents SET is_admin = false WHERE email = 'your-email@example.com';
```

Admin users see a floating **AdminNavDock** (bottom-left) on every dashboard page with links to:

| Admin Page | URL | Purpose |
|---|---|---|
| Content Queue | `/admin/content` | Review + approve AI-generated content |
| Subscriptions | `/admin/subscriptions` | Cancel/change any user's plan |
| Archived Children | `/admin/archived-children` | Restore soft-archived child profiles |

Admin pages are also reachable via keyboard navigation (sr-only Sidebar).

---

# Phase 2 — Stripe

## 2.1 API Keys (Test Mode First)

- [ ] Sign in at [dashboard.stripe.com](https://dashboard.stripe.com)
- [ ] **Developers → API keys**, copy:
  - [ ] `Publishable key` → `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (starts `pk_test_…`)
  - [ ] `Secret key` → `STRIPE_SECRET_KEY` (starts `sk_test_…`)

## 2.2 Create Products + 4 Prices

- [ ] **Products → Add Product** → name: **Spark Plus**
  - [ ] Price 1: **$7.99 USD / month** recurring → copy price ID → `STRIPE_PLUS_MONTHLY_ID`
  - [ ] Price 2: **$79.99 USD / year** recurring → copy price ID → `STRIPE_PLUS_YEARLY_ID`
- [ ] **Products → Add Product** → name: **Spark Forge**
  - [ ] Price 1: **$14.99 USD / month** recurring → copy price ID → `STRIPE_FORGE_MONTHLY_ID`
  - [ ] Price 2: **$149.99 USD / year** recurring → copy price ID → `STRIPE_FORGE_YEARLY_ID`

> **Trial periods (Gap 2)** are handled in code via `TRIAL_DAYS` in `src/lib/tier-config.ts`. Do NOT set trial periods in Stripe Dashboard — doing so would double-apply them.

## 2.3 Webhook Endpoint

- [ ] **Developers → Webhooks → Add endpoint**
- [ ] Endpoint URL: `https://<your-vercel-domain>/api/stripe/webhook`
  - For local dev testing: use `stripe listen --forward-to localhost:3000/api/stripe/webhook`
- [ ] **Listen to events** — check these 5:
  - [ ] `checkout.session.completed`
  - [ ] `customer.subscription.created`  ← needed for Gap 2 trial starts
  - [ ] `customer.subscription.updated`
  - [ ] `customer.subscription.deleted`
  - [ ] `invoice.payment_failed`
- [ ] Click **Add endpoint**, then **Reveal signing secret** → `STRIPE_WEBHOOK_SECRET` (starts `whsec_…`)

## 2.4 Enable Customer Portal

- [ ] **Settings → Billing → Customer portal**
- [ ] Set **Business information** (name, privacy policy URL, terms URL)
- [ ] Under **Functionality**, enable:
  - [ ] Customers can update their payment method
  - [ ] Customers can view their invoices
- [ ] Save

---

# Phase 3 — Optional Services

## 3.1 Anthropic (for Prompt Lab + Content Agent)

- [ ] [console.anthropic.com](https://console.anthropic.com) → **API Keys → Create Key**
- [ ] Copy → `ANTHROPIC_API_KEY` (starts `sk-ant-…`)

> The codebase gracefully returns 503 with a helpful message if this key is missing (ENH-9A), so you can launch without AI features and add it later.

## 3.2 Sentry (for error + performance monitoring)

- [ ] [sentry.io](https://sentry.io) → **Create Project** → Next.js
- [ ] Copy DSN → `NEXT_PUBLIC_SENTRY_DSN` **and** `SENTRY_DSN`
- [ ] **Settings → Auth Tokens → Create Token** → scope: `project:releases`, `org:read` → `SENTRY_AUTH_TOKEN`
- [ ] Record org + project slugs → `SENTRY_ORG`, `SENTRY_PROJECT`

## 3.3 Upstash Redis (rate limiting — AUTH-HIGH-003)

The app rate-limits the auth, signup, demo, and AI endpoints. Without a shared backend, limits reset to zero on every serverless cold-start, so attackers can bypass them by making requests fast enough to hit fresh isolates. Upstash provides a globally-replicated Redis counter at negligible latency. **Required for production.** Local dev and CI automatically fall back to an in-memory counter.

- [ ] [console.upstash.com](https://console.upstash.com) → sign up → **Redis → Create database**
  - Name: `sparkforge-prod` (anything is fine)
  - Primary region: closest to your Vercel deployment region
  - Eviction: leave default
  - Type: **Free** tier handles up to 10K requests/day — plenty for the rate-limit check volume
- [ ] On the database page, scroll to **REST API** → copy:
  - **UPSTASH_REDIS_REST_URL** (the HTTPS URL ending in `.upstash.io`)
  - **UPSTASH_REDIS_REST_TOKEN** (the long bearer token)
- [ ] Add both to Vercel → Project Settings → Environment Variables (Production + Preview + Development)
- [ ] Redeploy; confirm the one-time fallback-warning no longer appears in production logs

### Verification

After deploying with Upstash configured, hit `/api/auth/demo` 4× in under 1 hour from the same IP. The 4th call should return HTTP 429. Without Upstash, on Vercel you'd see the limit only rarely trigger because each request may land on a different isolate.

> You can launch without Upstash — the app still boots and logs a one-time warning — but the rate limits are effectively unenforced. Treat this as a production must-have.

## 3.4 CSRF Secret (AUTH-HIGH-004 / API-HIGH-004)

The app mints CSRF tokens via HMAC-SHA256 for the double-submit cookie pattern (see `src/lib/csrf.ts`). This requires a secret key.

- [ ] Generate a 32+ character random string:
  ```bash
  openssl rand -hex 32
  # or
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```
- [ ] Add to Vercel → Project Settings → Environment Variables as **`CSRF_SECRET`** (Production + Preview + Development, secret)
- [ ] Also add to local `.env.local`

### Verification

After deploy, open DevTools on any page → Application → Cookies. You should see a `sparkforge-csrf` cookie (`SameSite=Lax`, `Secure` in prod, NOT httpOnly — JS must read it). A `curl -X POST` without the cookie + header to any mutating endpoint should return `403 { "code": "CSRF_FAILED" }`.

> If unset, `CSRF_SECRET` falls back to `SUPABASE_SERVICE_ROLE_KEY` for token HMACs. Usable but not ideal — rotating the service key would invalidate every session's CSRF cookie. Always set `CSRF_SECRET` explicitly in production.

## 3.5 Resend (for trial reminder emails)

Transactional email is used for trial-ending reminders (48h and 24h before expiry). The codebase uses Resend's REST API directly (no npm dependency) and degrades gracefully if unconfigured — the cron returns `{ skipped: true }` and the app runs normally without email.

- [ ] [resend.com](https://resend.com) → sign up → **API Keys → Create API Key**
- [ ] Copy → `RESEND_API_KEY` (starts `re_…`)
- [ ] **Domains → Add Domain** → verify your sending domain (DNS records)
- [ ] Optionally set `EMAIL_FROM` (default: `SparkForge <noreply@sparkforge.app>`)

> You can launch without Resend and add it later. Trial reminders simply won't send. All other subscription features (checkout, webhook, downgrade, admin tools) work without email.

### Test the email template (requires admin)

After deploy, send a test reminder to yourself:

```bash
curl -X POST https://<domain>/api/admin/trial-reminders/test \
  -H "Cookie: <your-session-cookie>" \
  -H "Content-Type: application/json" \
  -d '{"to":"your-email@example.com","window":"48h","tier":"plus"}'
```

Or use the admin test endpoint via the browser console after logging in as admin.

---

# Phase 4 — Vercel

## 4.1 Create Project

- [ ] [vercel.com](https://vercel.com/new) → import the GitHub repo
- [ ] Framework preset: **Next.js** (auto-detected)
- [ ] Root directory: **(leave default)**
- [ ] Build command: **(leave default — `next build`)**

## 4.2 Environment Variables

Add these to **Project Settings → Environment Variables**. Paste values from the earlier phases. Mark each either `Production, Preview, Development` or split as appropriate.

### Required

| Variable | Phase | Secret? |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | 1.1 | No |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 1.1 | No |
| `SUPABASE_SERVICE_ROLE_KEY` | 1.1 | **Yes** |
| `STRIPE_SECRET_KEY` | 2.1 | **Yes** |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | 2.1 | No |
| `STRIPE_WEBHOOK_SECRET` | 2.3 | **Yes** |
| `STRIPE_PLUS_MONTHLY_ID` | 2.2 | No |
| `STRIPE_PLUS_YEARLY_ID` | 2.2 | No |
| `STRIPE_FORGE_MONTHLY_ID` | 2.2 | No |
| `STRIPE_FORGE_YEARLY_ID` | 2.2 | No |
| `NEXT_PUBLIC_URL` | set to `https://<domain>` | No |
| `NEXT_PUBLIC_APP_URL` | set to `https://<domain>` | No |
| `CRON_SECRET` | generate a random 32+ char string | **Yes** |
| `CSRF_SECRET` | 32+ random chars; HMAC secret for CSRF tokens (AUTH-HIGH-004). Falls back to `SUPABASE_SERVICE_ROLE_KEY` if unset. | **Yes** |
| `UPSTASH_REDIS_REST_URL` | 3.3 (Upstash) — required for real rate limits | No |
| `UPSTASH_REDIS_REST_TOKEN` | 3.3 (Upstash) — required for real rate limits | **Yes** |

### Optional (feature-gated)

| Variable | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Prompt Lab + Content Agent (returns 503 if missing) |
| `RESEND_API_KEY` | Trial reminder emails (cron skips gracefully if missing) |
| `EMAIL_FROM` | Sender address — default `SparkForge <noreply@sparkforge.app>` |
| `NEXT_PUBLIC_SENTRY_DSN` | Client-side error tracking |
| `SENTRY_DSN` | Server-side error tracking |
| `SENTRY_ORG` / `SENTRY_PROJECT` / `SENTRY_AUTH_TOKEN` | Sentry source map uploads |
| `NEXT_PUBLIC_FF_*` | Feature flags (welcome_achievement, level_ceremony, etc.) |
| `ENABLE_CONTENT_AGENT` | Set `true` to enable cron-driven content generation |

## 4.3 Cron Jobs

Already defined in `vercel.json` — no action needed. Vercel auto-registers:

| Cron Path | Schedule | Purpose |
|---|---|---|
| `/api/agent/schedule` | Daily 06:00 UTC | Content generation pipeline |
| `/api/agent/trending` | Monday 08:00 UTC | Trending topics scan |
| `/api/cron/trial-reminders` | Daily 10:00 UTC | Trial expiry emails (48h + 24h window) |

All cron endpoints require the `CRON_SECRET` bearer token. Vercel injects this automatically for cron invocations. The trial-reminders cron gracefully skips if `RESEND_API_KEY` is missing.

## 4.4 Deploy

- [ ] Click **Deploy**. Wait for build to complete (~4–6 min first run).
- [ ] Copy the production URL.
- [ ] Return to **Phase 2.3** and **update the webhook URL** from `localhost:3000` to your Vercel domain.
- [ ] Return to **Phase 4.2** and **update `NEXT_PUBLIC_URL` + `NEXT_PUBLIC_APP_URL`** to match the deployed domain, then **redeploy**.

---

# Phase 5 — Post-Deploy Verification

> **Staging environment (optional but strongly recommended):** See [`STAGING_NOTES.md`](./STAGING_NOTES.md) for the full operator guide to running a preview-environment staging stack (separate Supabase project + Stripe restricted test-mode key + Upstash staging + preview-only CSRF secret). DEPLOY-HIGH-001 fix.

> **Automated smoke checks:** `scripts/staging-smoke-test.sh` runs on every Vercel preview deploy via `.github/workflows/staging-smoke.yml`. It verifies `/api/health`, public HTML rendering, CSRF gate, middleware allowlist, and CSP headers — a failure blocks merges.

## 5.1 Health Smoke Tests

```bash
# 1. Health endpoint
curl https://<domain>/api/health
# Expected: { "status": "ok", "timestamp": "..." }

# 2. Homepage responds
curl -I https://<domain>/
# Expected: HTTP/2 200
```

## 5.2 Stripe End-to-End Test

- [ ] Visit `https://<domain>/signup` → create a test account
- [ ] Navigate to `/parent/subscription`
- [ ] Click **Upgrade to Spark Plus**
- [ ] On Stripe Checkout, use test card `4242 4242 4242 4242`, any future expiry, any CVC
- [ ] Return to `/parent/subscription?success=true`
- [ ] Verify **CelebrationBanner** appears (Gap 5) ✓
- [ ] Verify **TrialBanner** appears with countdown (Gap 2) ✓
- [ ] Query Supabase to confirm:

```sql
SELECT email, subscription_tier, subscription_status, stripe_subscription_id, trial_ends_at
FROM parents WHERE email = 'your-test-account@…';
```

Expected: `tier='plus'`, `status='active'`, `stripe_subscription_id` populated, `trial_ends_at` ~7 days in future.

## 5.3 Webhook Smoke Test (automated)

Run the built-in smoke-test script against your dev server:

```bash
# Start dev server in one terminal
npm run dev

# In another terminal
npx tsx scripts/smoke-test-webhook.ts
```

It will:
1. Construct a fake `checkout.session.completed` event
2. Sign it with your local `STRIPE_WEBHOOK_SECRET`
3. POST it to `/api/stripe/webhook`
4. Query Supabase for the resulting `subscription_events` row
5. Print pass/fail summary

> Full documentation in [Appendix C](#appendix-c--webhook-smoke-test).

## 5.4 Admin Access Check

- [ ] Promote your test account to admin (see 1.3 above)
- [ ] Sign in, navigate to `/admin/subscriptions`
- [ ] Confirm the parent list loads and your test user appears
- [ ] Verify the floating admin dock (top-left) is visible on every dashboard page

## 5.5 In-App Downgrade Check (Gap 3)

- [ ] On the upgraded test account, return to `/parent/subscription`
- [ ] Click **Downgrade to Spark Free**
- [ ] Verify the `DowngradeConfirmModal` opens and shows the feature delta
- [ ] Click **Confirm Downgrade**
- [ ] Check toast: "Your plan will switch to Spark Free on [date]"
- [ ] Verify Supabase `parents.subscription_status='active'` but a Stripe portal check shows `cancel_at_period_end=true`

## 5.6 Archived Children Restore Check

- [ ] As admin, navigate to `/admin/archived-children`
- [ ] Confirm any children archived in 5.5 appear in the table
- [ ] Verify the "At limit" badge appears if the parent has no room to restore
- [ ] Click **Restore** on one archived child → confirm modal shows impact summary
- [ ] Type an optional reason → click **Confirm Restore**
- [ ] Verify success toast + child disappears from the archived list
- [ ] Confirm the child reappears in `/api/children` (parent's active profile list)
- [ ] Query Supabase to verify `deactivated_at` is now NULL:

```sql
SELECT display_name, deactivated_at
FROM children WHERE parent_id = '<your-parent-id>';
```

## 5.7 Trial Reminder Email Check (requires Resend)

Skip this section if `RESEND_API_KEY` is not configured.

- [ ] As admin, send a test reminder:

```bash
curl -X POST https://<domain>/api/admin/trial-reminders/test \
  -H "Cookie: <session-cookie>" \
  -H "Content-Type: application/json" \
  -d '{"to":"your-email@example.com","window":"48h","tier":"plus"}'
```

- [ ] Check your inbox for the `[TEST] Your Spark Plus trial ends in 2 days` email
- [ ] Verify dark-themed HTML renders correctly (Frost-Prismatic colors)
- [ ] Verify the "Manage Subscription" button links to `/parent/subscription`
- [ ] Verify plain-text fallback is readable

> The daily cron (`/api/cron/trial-reminders`) auto-sends real reminders at 10:00 UTC. Each parent receives at most one 48h reminder and one 24h reminder per trial (deduplicated via `subscription_events`).

## 5.8 Unit + Integration Test Suite

Run the full test suite locally to verify everything compiles and passes:

```bash
# Unit tests (fast, no network, no DB)
npm test

# Expected output:
#   Test Files  3 passed (3)
#   Tests       23 passed (23)
#   Duration    ~6s
```

**Test breakdown:**

| Test File | Tests | What it covers |
|---|---|---|
| `tests/unit/webhook-signature.test.ts` | 6 | HMAC signing, round-trip via `constructEvent`, tampering rejection |
| `tests/unit/webhook-handler.test.ts` | 17 | Full handler: checkout, sub update/delete, invoice failed, tier derivation, status mapping, audit trail, idempotency |

```bash
# TypeScript type-check (no emit)
npx tsc --noEmit

# Production build (catches ESLint + type errors across all routes)
npm run build
```

---

# Appendix A — SQL Code Blocks

## A1. `schema-stage8-patch-admin-trials.sql` (Gap 1 + Gap 2)

```sql
-- ════════════════════════════════════════════════════
-- STAGE 8 PATCH — Subscription Admin Tooling + Trials
-- ════════════════════════════════════════════════════
-- Adds columns that unblock:
--   Gap 1: stripe_subscription_id  — programmatic cancel/change
--   Gap 2: trial_ends_at            — code-supported trial UX
--
-- Safe to re-run: uses IF NOT EXISTS throughout.
-- Run order: AFTER sql/schema-stage8.sql
-- Run in:    Supabase SQL Editor (single block)
-- ════════════════════════════════════════════════════

-- ─── Gap 1: Stripe subscription ID ──────────────────
-- Stores the Stripe Subscription object ID so server code
-- can call stripe.subscriptions.update() / cancel() without
-- pushing the user into the hosted Customer Portal.
ALTER TABLE parents
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT UNIQUE;

-- Lookup index for webhook + admin queries
CREATE INDEX IF NOT EXISTS idx_parents_stripe_subscription_id
  ON parents(stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

-- ─── Gap 2: Trial end timestamp ─────────────────────
-- Populated from Stripe's subscription.trial_end on webhook.
-- Null means the user is not (and has not been) on a trial.
ALTER TABLE parents
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

-- Lookup index — used by scheduled reminder jobs and
-- "trial expiring soon" banners.
CREATE INDEX IF NOT EXISTS idx_parents_trial_ends_at
  ON parents(trial_ends_at)
  WHERE trial_ends_at IS NOT NULL;

-- ─── Gap 2: Subscription period end (optional metadata) ──
-- Stores current_period_end so the UI can show
-- "Changes apply [date]" when downgrading.
ALTER TABLE parents
  ADD COLUMN IF NOT EXISTS subscription_period_end TIMESTAMPTZ;
```

## A2. `schema-stage8-patch-children-archive.sql` (Gap 3)

```sql
-- ════════════════════════════════════════════════════
-- STAGE 8 PATCH — Children Soft-Archive
-- ════════════════════════════════════════════════════
-- Adds deactivated_at column to children so a tier downgrade
-- that drops below the parent's current child count can archive
-- the overflow without losing their XP, progress, or badges.
--
-- Soft-archive semantics:
--   deactivated_at IS NULL → active child (counted, visible)
--   deactivated_at IS NOT NULL → archived (hidden from parent UI,
--     excluded from tier limit checks, progress preserved)
--
-- Queries in src/app/api/children/* and src/middleware/tierCheck.ts
-- filter on this column. RLS remains unchanged (parent still owns
-- the row) so admin tooling can restore archived children.
--
-- Safe to re-run: uses IF NOT EXISTS.
-- Run order: AFTER sql/001_schema.sql
-- ════════════════════════════════════════════════════

ALTER TABLE children
  ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ;

-- Partial index: speeds up the common "list my active children" query
-- by indexing only non-archived rows.
CREATE INDEX IF NOT EXISTS idx_children_active_by_parent
  ON children(parent_id, created_at)
  WHERE deactivated_at IS NULL;

-- Optional: comment for schema docs
COMMENT ON COLUMN children.deactivated_at IS
  'Soft-archive timestamp. NULL = active. Populated by /api/stripe/subscription/change when a tier downgrade requires reducing the active child count. See Gap 3 in claude/audit-subscription-payment-xrg1p.';
```

---

# Appendix B — Backfill Script (for existing paid users)

If you already have parents with active Stripe subscriptions before deploying this branch, backfill the new `stripe_subscription_id`, `trial_ends_at`, and `subscription_period_end` columns:

```bash
# Dry run — shows what WOULD be written (safe)
npx tsx scripts/backfill-stripe-subs.ts

# Review output, then commit:
npx tsx scripts/backfill-stripe-subs.ts --commit
```

Requires these env vars in the shell (not just `.env.local`):

```bash
export STRIPE_SECRET_KEY=sk_test_...
export NEXT_PUBLIC_SUPABASE_URL=https://....supabase.co
export SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

Or source `.env.local` first: `set -a && source .env.local && set +a`.

---

# Appendix C — Webhook Smoke Test

The script at `scripts/smoke-test-webhook.ts` exercises the full webhook path without requiring Stripe to actually fire an event.

## What it does

1. Reads `STRIPE_WEBHOOK_SECRET` and a target parent email from env/args
2. Fetches the target parent row via Supabase service role
3. Constructs a fake `checkout.session.completed` event referencing that parent's `id` and `customer_id`
4. Signs the event body using the same HMAC-SHA256 scheme Stripe uses
5. POSTs to `http://localhost:3000/api/stripe/webhook` (or `--url` override)
6. Waits 500ms, then queries `subscription_events` for the new row
7. Exits with code 0 on pass, 1 on fail, and prints a colored report

## Requirements

```bash
# Run locally against a dev server:
npm run dev  # in one terminal

# Then in another terminal:
npx tsx scripts/smoke-test-webhook.ts \
  --email=your-test-account@example.com \
  --tier=plus
```

Optional flags:

| Flag | Default | Purpose |
|---|---|---|
| `--email=<email>` | (required) | Parent to simulate upgrading |
| `--tier=<free\|plus\|forge>` | `plus` | Target tier in the mock metadata |
| `--url=<webhook-url>` | `http://localhost:3000/api/stripe/webhook` | Webhook endpoint to call |
| `--no-db-check` | off | Skip the Supabase verification step |

## Env vars needed

```bash
STRIPE_WEBHOOK_SECRET=whsec_...
NEXT_PUBLIC_SUPABASE_URL=https://....supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## Exit codes

| Code | Meaning |
|---|---|
| 0 | Webhook returned 200 and DB row was created |
| 1 | Any step failed — see printed error |
| 2 | Missing required env var or flag |

---

# Appendix D — Admin API Endpoints Reference

All admin endpoints require `parents.is_admin = true` via the `requireAdmin()` middleware.

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/api/admin/subscriptions` | List all parent subscriptions (500 max) |
| `POST` | `/api/admin/subscriptions/cancel` | Cancel a parent's subscription via Stripe |
| `POST` | `/api/admin/subscriptions/change` | Change a parent's plan/interval via Stripe |
| `GET` | `/api/admin/children/archived` | List all soft-archived children with parent info + tier limit status |
| `POST` | `/api/admin/children/:childId/restore` | Restore a single archived child (checks tier limit first) |
| `POST` | `/api/admin/trial-reminders/test` | Send a test trial reminder email to any address |

### Restore endpoint details

```
POST /api/admin/children/<childId>/restore
Body: { "reason": "optional audit note" }

Success: { childId, parentId, parentEmail, displayName, activeCountAfter, maxChildren }
Errors:
  404 — Child not found
  400 — Child is already active
  400 — CHILDREN_OVER_LIMIT (parent is at tier max — archive another first or upgrade)
  500 — DB update failed (missing migration?)
```

### Trial test endpoint details

```
POST /api/admin/trial-reminders/test
Body: { "to": "email@example.com", "window": "48h|24h|final", "tier": "plus|forge" }

Success: { to, window, tier, subject, resendId }
Errors:
  503 — EMAIL_NOT_CONFIGURED (RESEND_API_KEY missing)
  500 — Resend API rejected the send
```

---

# Appendix E — Admin Operations Guide

## Daily operations

| Task | How | Frequency |
|---|---|---|
| Review AI content | `/admin/content` → approve/reject queued items | Daily |
| Check subscription health | `/admin/subscriptions` → filter by `past_due` | Daily |
| Verify cron ran | Vercel dashboard → **Cron Jobs** tab → check green status | Daily |

## Weekly operations

| Task | How | Frequency |
|---|---|---|
| Review archived children | `/admin/archived-children` → restore any incorrectly archived | Weekly |
| Check trial conversions | SQL: `SELECT COUNT(*) FROM parents WHERE trial_ends_at < NOW() AND subscription_tier != 'free'` | Weekly |
| Review subscription events | SQL: `SELECT event_type, COUNT(*) FROM subscription_events GROUP BY event_type ORDER BY count DESC` | Weekly |

## Common admin SQL queries

```sql
-- List all admins
SELECT email, full_name FROM parents WHERE is_admin = true;

-- Promote an admin
UPDATE parents SET is_admin = true WHERE email = 'your-email@example.com';

-- Revoke admin
UPDATE parents SET is_admin = false WHERE email = 'your-email@example.com';

-- Count active vs archived children per parent
SELECT
  p.email,
  p.subscription_tier,
  COUNT(*) FILTER (WHERE c.deactivated_at IS NULL) AS active,
  COUNT(*) FILTER (WHERE c.deactivated_at IS NOT NULL) AS archived
FROM parents p
LEFT JOIN children c ON c.parent_id = p.id
GROUP BY p.id, p.email, p.subscription_tier
ORDER BY archived DESC;

-- Find parents with trials ending in the next 48 hours
SELECT email, subscription_tier, trial_ends_at,
  EXTRACT(EPOCH FROM (trial_ends_at - NOW())) / 3600 AS hours_remaining
FROM parents
WHERE trial_ends_at IS NOT NULL
  AND trial_ends_at > NOW()
  AND trial_ends_at <= NOW() + INTERVAL '48 hours';

-- Audit trail for a specific parent
SELECT stripe_event_id, event_type, created_at, data
FROM subscription_events
WHERE parent_id = '<parent-uuid>'
ORDER BY created_at DESC
LIMIT 20;

-- Find all trial reminder emails sent
SELECT parent_id, data->>'window' AS window, data->>'sent_at' AS sent_at
FROM subscription_events
WHERE event_type = 'trial.reminder.sent'
ORDER BY created_at DESC;

-- Find all admin child restores
SELECT
  parent_id,
  data->>'child_name' AS child_name,
  data->>'admin_email' AS restored_by,
  data->>'reason' AS reason,
  data->>'restored_at' AS restored_at
FROM subscription_events
WHERE event_type = 'admin.child.restored'
ORDER BY created_at DESC;
```

## Emergency procedures

### Force-downgrade a parent (bypass Stripe)

If a parent's Stripe state is out of sync with Supabase:

```sql
-- Nuclear option: reset to free tier in DB only
-- (Stripe subscription may still be active — check dashboard)
UPDATE parents SET
  subscription_tier = 'free',
  subscription_status = 'canceled',
  stripe_subscription_id = NULL,
  trial_ends_at = NULL,
  subscription_period_end = NULL
WHERE email = 'problem-user@example.com';
```

### Restore ALL archived children for a parent

```sql
UPDATE children SET deactivated_at = NULL
WHERE parent_id = '<parent-uuid>' AND deactivated_at IS NOT NULL;
```

> Warning: this may put the parent over their tier's child limit. Check their tier first.

### Re-sync a parent from Stripe

If the webhook missed an event, the backfill script can re-sync:

```bash
npx tsx scripts/backfill-stripe-subs.ts --commit
```

### Manually trigger trial reminders

```bash
# Local dev
curl http://localhost:3000/api/cron/trial-reminders \
  -H "Authorization: Bearer $CRON_SECRET"

# Production (via Vercel, use the cron tab to trigger manually)
```

---

# Appendix F — Full Test Suite Reference

## Test pyramid

```
┌────────────────────────┐
│   E2E (Playwright)     │  ← Not in this branch (future)
├────────────────────────┤
│   Smoke (scripts/)     │  ← Live dev server, real DB
├────────────────────────┤
│   Unit (vitest)        │  ← Mocked, fast, CI-safe
└────────────────────────┘
```

## Running tests

```bash
# All unit tests (CI-safe, no network)
npm test

# With coverage report
npm test -- --coverage

# Run a specific test file
npm test -- tests/unit/webhook-handler.test.ts

# Watch mode (re-runs on file change)
npx vitest watch
```

## Test inventory

| File | Tests | Layer | Dependencies |
|---|---|---|---|
| `tests/unit/webhook-signature.test.ts` | 6 | Unit | `stripe` (real SDK, no network) |
| `tests/unit/webhook-handler.test.ts` | 17 | Unit | Mocked Supabase + Stripe |
| `scripts/smoke-test-webhook.ts` | 1 | Smoke | Live dev server + Supabase |

### webhook-signature.test.ts (6 tests)

| # | Test | Verifies |
|---|---|---|
| 1 | Signature format | `t=<unix>,v1=<hex64>` pattern |
| 2 | Timestamp freshness | Within 5 seconds of now |
| 3 | Round-trip verify | `constructEvent()` accepts our signed payload |
| 4 | Tampered body rejected | Modified body fails verification |
| 5 | Wrong secret rejected | Mismatched HMAC key fails |
| 6 | Empty signature rejected | No signature header fails |

### webhook-handler.test.ts (17 tests)

| # | Test | Verifies |
|---|---|---|
| 1 | Stripe not configured → 503 | `getStripe()` returns null |
| 2 | Missing signature → 503 | No `stripe-signature` header |
| 3 | Missing webhook secret → 503 | `STRIPE_WEBHOOK_SECRET` unset |
| 4 | Invalid signature → 400 | `constructEvent` throws |
| 5 | checkout.session.completed | Writes all Gap 1+2 fields to parents |
| 6 | Checkout defaults tier to plus | Missing metadata.tier → 'plus' |
| 7 | Checkout skips without supabase_id | No parents update attempted |
| 8 | sub.updated + Plus price → tier=plus | Price ID → tier derivation |
| 9 | sub.updated + Forge price → tier=forge | Price ID → tier derivation |
| 10 | sub.updated + unknown price | No tier overwrite |
| 11 | sub.updated 'trialing' → 'active' | Status mapping |
| 12 | sub.updated 'past_due' → 'past_due' | Status mapping |
| 13 | sub.updated trial_end → ISO | Unix seconds → ISO conversion |
| 14 | sub.deleted → free + clear fields | Downgrade + null stripe_subscription_id |
| 15 | invoice.payment_failed → past_due | Only status updated |
| 16 | Audit upsert with idempotency | onConflict + ignoreDuplicates |
| 17 | Unknown event → 200 + no parents update | Graceful passthrough |

---

# Troubleshooting

## "Stripe price IDs not configured"

Cause: `STRIPE_PLUS_MONTHLY_ID` or similar still starts with `price_placeholder_…`.
Fix: Complete Phase 2.2 and set the real price IDs in Vercel env, then redeploy.

## Webhook signature verification fails

Cause: The `STRIPE_WEBHOOK_SECRET` in Vercel doesn't match the secret shown in the Stripe Dashboard for that endpoint.
Fix: Copy the secret from the **specific endpoint you created** (not a different one), paste into Vercel env, redeploy.

## Users stuck on "free" after payment

Cause: Webhook fired but couldn't update the DB — usually an RLS issue, wrong `SUPABASE_SERVICE_ROLE_KEY`, or the `parents` row has no `stripe_customer_id` match.
Fix:
1. Check **Developers → Webhooks → [your endpoint] → Events** in Stripe for error responses
2. Check Vercel **Function logs** for the webhook route
3. Run the smoke-test script (Appendix C) to reproduce locally
4. Verify `SUPABASE_SERVICE_ROLE_KEY` is correct

## `current_period_end` type errors on build

Cause: Stripe SDK version mismatch. This branch uses the 2026-02-25 API where `current_period_end` moved from `Subscription` to `SubscriptionItem`.
Fix: Run `npm install` to pull `stripe@^20.4.0`. All affected queries now read from `sub.items.data[0].current_period_end`.

## Children appear after downgrade but shouldn't

Cause: `sql/schema-stage8-patch-children-archive.sql` wasn't run — `deactivated_at` column missing.
Fix: Run Phase 1.2 step 13. Re-downgrade to trigger the archive flow.

## Admin nav dock not visible

Cause: `parents.is_admin` is `false` for your user.
Fix: Run the promote-admin SQL from Phase 1.3:

```sql
UPDATE parents SET is_admin = true WHERE email = 'your-email@example.com';
```

Then refresh the page. The dock appears at bottom-left on every dashboard page.

## Trial reminder emails not sending

Cause 1: `RESEND_API_KEY` not set → cron returns `{ skipped: true }` (by design).
Fix: Add the key per Phase 3.3.

Cause 2: No parents have `trial_ends_at` in the next 48 hours.
Fix: Check with the SQL query from Appendix E ("Find parents with trials ending in next 48 hours").

Cause 3: Reminder already sent (deduplicated).
Fix: Check `subscription_events` for existing `trial.reminder.sent` rows for that parent.

## Restore button disabled on archived children page

Cause: The parent's current active child count equals their tier's maximum.
Fix: Either archive a different active child first, or upgrade the parent's tier via `/admin/subscriptions`, then retry the restore.

## Tests failing locally

Cause: Missing or outdated dependencies.
Fix:
```bash
npm install
npm test
```

If `webhook-handler.test.ts` fails with import errors, ensure `vitest.config.ts` has the `@` alias pointing to `./src`.

## Cron endpoint returns 401

Cause: `CRON_SECRET` mismatch between environment and request.
Fix: Ensure the same secret is in both your `.env.local` and the `Authorization: Bearer <secret>` header. Vercel injects this automatically for scheduled crons.

---

# Checklist Summary

- [ ] **Phase 1 — Supabase:** project created, 14 SQL files run in order, first admin user promoted
- [ ] **Phase 2 — Stripe:** 4 prices created, webhook endpoint added with 5 events, customer portal enabled
- [ ] **Phase 3 — Optional services:** Anthropic + Sentry + Resend keys collected (skip any to launch without)
- [ ] **Phase 4 — Vercel:** project imported, 13+ required env vars set, 3 crons registered, deployed, webhook URL updated
- [ ] **Phase 5.1–5.3:** Health + Stripe + webhook smoke tests passing
- [ ] **Phase 5.4:** Admin dock visible, `/admin/subscriptions` loads
- [ ] **Phase 5.5:** In-app downgrade flow works end-to-end
- [ ] **Phase 5.6:** Archived children restore flow works (admin tool)
- [ ] **Phase 5.7:** Trial reminder email received and renders correctly (if Resend configured)
- [ ] **Phase 5.8:** `npm test` passes (23 tests across 2 files)
- [ ] **Post-launch:** backfill script run (if any pre-existing paid users)

Once all checkboxes are green, SparkForge is fully operational with Stripe, Supabase, Vercel, email reminders, admin tooling, and the Gap 1–5 subscription features enabled.

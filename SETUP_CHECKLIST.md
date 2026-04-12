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

> The two **bold NEW** files are included in this branch. Their full SQL is provided in [Appendix A](#appendix-a--sql-code-blocks) for copy-paste without needing to clone the repo.

### Verify migrations ran

Run this in the SQL Editor and confirm all columns appear:

```sql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'parents'
ORDER BY ordinal_position;
```

Expected columns (post Gap 1+2):
`id, email, full_name, stripe_customer_id, subscription_tier, subscription_status, onboarding_complete, coppa_consent_at, is_admin, stripe_subscription_id, trial_ends_at, subscription_period_end, created_at, updated_at`

```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'children' AND column_name = 'deactivated_at';
```

Must return 1 row (post Gap 3 archive migration).

## 1.3 Create First Admin User (optional but recommended)

Sign up once through the app (`/signup`), then promote to admin:

```sql
UPDATE parents SET is_admin = true WHERE email = 'your-email@example.com';
```

Admins can access `/admin/subscriptions` and `/admin/content`.

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

### Optional (feature-gated)

| Variable | Purpose |
|---|---|
| `ANTHROPIC_API_KEY` | Prompt Lab + Content Agent (returns 503 if missing) |
| `NEXT_PUBLIC_SENTRY_DSN` | Client-side error tracking |
| `SENTRY_DSN` | Server-side error tracking |
| `SENTRY_ORG` / `SENTRY_PROJECT` / `SENTRY_AUTH_TOKEN` | Sentry source map uploads |
| `NEXT_PUBLIC_FF_*` | Feature flags (welcome_achievement, level_ceremony, etc.) |
| `ENABLE_CONTENT_AGENT` | Set `true` to enable cron-driven content generation |

## 4.3 Cron Jobs

Already defined in `vercel.json` — no action needed. Vercel auto-registers:

- `/api/agent/schedule` — daily at 06:00 UTC (content generation)
- `/api/agent/trending` — weekly Monday 08:00 UTC (trending topics)

Both cron endpoints require the `CRON_SECRET` header to execute. Vercel injects this automatically for cron invocations.

## 4.4 Deploy

- [ ] Click **Deploy**. Wait for build to complete (~4–6 min first run).
- [ ] Copy the production URL.
- [ ] Return to **Phase 2.3** and **update the webhook URL** from `localhost:3000` to your Vercel domain.
- [ ] Return to **Phase 4.2** and **update `NEXT_PUBLIC_URL` + `NEXT_PUBLIC_APP_URL`** to match the deployed domain, then **redeploy**.

---

# Phase 5 — Post-Deploy Verification

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
Fix: Run the `UPDATE parents SET is_admin = true WHERE email = '…'` command in SQL Editor, then refresh the page.

---

# Checklist Summary

- [ ] **Phase 1 — Supabase:** project created, 14 SQL files run in order, first admin user promoted
- [ ] **Phase 2 — Stripe:** 4 prices created, webhook endpoint added with 5 events, customer portal enabled
- [ ] **Phase 3 — Optional services:** Anthropic + Sentry keys collected (skip if launching without)
- [ ] **Phase 4 — Vercel:** project imported, 13+ required env vars set, deployed, webhook URL updated
- [ ] **Phase 5 — Verification:** 5 smoke tests passing
- [ ] **Post-launch:** backfill script run (if any pre-existing paid users)

Once all checkboxes are green, SparkForge is fully operational with Stripe, Supabase, Vercel, and the Gap 1–5 subscription features enabled.

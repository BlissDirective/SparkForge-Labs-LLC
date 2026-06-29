# SparkForge — Staging Environment Guide

> DEPLOY-HIGH-001 (Option C): How to run a proper staging environment on top of Vercel Preview Deployments, plus the automated smoke tests that run against each preview URL.

---

## Why staging

Without a staging env every merge goes straight to production. That means schema migrations, Stripe webhook tweaks, cron-job changes, and third-party integrations all get their first real exercise with real customers watching. A staging env gives the team a safe stage for:

- **Schema migrations** — run the SQL first, verify columns + policies land correctly
- **Webhook signatures** — use a separate `STRIPE_WEBHOOK_SECRET` and test checkout end-to-end
- **Cron jobs** — confirm daily/weekly resets actually fire
- **CSP changes** — catch CSP breakages before users see blank screens
- **Third-party upgrades** — Next.js / Supabase / Stripe SDK bumps rehearse here

---

## Architecture

```
┌────────────────────────┐      ┌────────────────────────┐
│  GitHub PR (branch)    │─────▶│  Vercel Preview Deploy │
│  (any claude/** branch)│      │  https://*.vercel.app  │
└────────────────────────┘      └────────────┬───────────┘
                                             │
              ┌──────────────────────────────┼────────────────────────────┐
              │                              │                            │
              ▼                              ▼                            ▼
  ┌─────────────────────┐      ┌──────────────────────────┐   ┌───────────────────────┐
  │ Supabase (staging)  │      │ Stripe (restricted key)  │   │ Upstash (staging DB)  │
  │ separate project    │      │ test mode                │   │ separate instance     │
  └─────────────────────┘      └──────────────────────────┘   └───────────────────────┘
```

Production uses its own dedicated Supabase / Stripe live / Upstash instances. **Never share env values across environments** — a single staging env leak can compromise prod data if they share credentials.

---

## Operator setup (~30 min, one-time)

### 1. Supabase staging project
- [ ] [supabase.com](https://supabase.com) → **New Project** → name `sparkforge-staging`
- [ ] Run **every** SQL migration from `SETUP_CHECKLIST.md §1.2` in the staging project's SQL Editor. The same run-order applies — staging is a full clone of prod schema.
- [ ] Note staging `Project URL`, `anon` key, `service_role` key

### 2. Stripe restricted key
- [ ] In Stripe Dashboard → **Developers → Restricted Keys → Create**
- [ ] Name: `sparkforge-preview`
- [ ] Permissions: grant `Checkout sessions: write`, `Customers: write`, `Subscriptions: write`, plus webhook verification. Do NOT grant `All permissions`.
- [ ] Still in test mode (use `sk_test_…` prefix)
- [ ] Copy the key

### 3. Stripe webhook endpoint for staging
- [ ] **Developers → Webhooks → Add endpoint**
- [ ] URL: a wildcard-capable domain like `https://sparkforge-*.vercel.app/api/stripe/webhook` — or add a specific preview URL and rotate as needed.
- [ ] Events: same as prod (`checkout.session.completed`, `customer.subscription.*`, `invoice.payment_failed`)
- [ ] Copy the generated `whsec_…` signing secret

### 4. Upstash Redis (staging)
- [ ] [console.upstash.com](https://console.upstash.com) → **Create database** → name `sparkforge-staging`
- [ ] Free tier is fine for staging
- [ ] Copy REST URL + token

### 5. Vercel preview env vars
In your Vercel project → **Settings → Environment Variables** set these **with environment = "Preview" only** (NOT Production):

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | staging Supabase URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | staging anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | staging service role key |
| `STRIPE_SECRET_KEY` | `sk_test_…` restricted key |
| `STRIPE_WEBHOOK_SECRET` | staging whsec |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | `pk_test_…` (can reuse prod publishable — it's public) |
| `STRIPE_PLUS_MONTHLY_ID` etc. | test-mode price IDs |
| `UPSTASH_REDIS_REST_URL` | staging Upstash URL |
| `UPSTASH_REDIS_REST_TOKEN` | staging Upstash token |
| `CSRF_SECRET` | different value than prod (`openssl rand -hex 32`) |
| `NEXT_PUBLIC_APP_URL` | set to `$VERCEL_URL` — Vercel auto-populates this per deploy |

Production variables remain unchanged.

### 6. Confirm
Push any branch → Vercel builds a preview → open the preview URL → `/login` loads → the CI `staging-smoke` job (see next section) passes.

---

## Automated preview smoke tests

The workflow `staging-smoke` runs `scripts/staging-smoke-test.sh` against the preview URL on every preview deploy. The smoke test is stateless — no test accounts needed — and covers:

1. `/api/health` returns 200 and reports `overall: 'ok'`
2. `/login` HTML renders 200
3. CSRF gate rejects tokenless POST → 403 or 401
4. Protected API without session → 401
5. Content-Security-Policy header present + `'unsafe-inline'` absent from `script-src`

A failure blocks merge (see GitHub branch protection rules).

### Deeper smokes (not automated here)

User-journey smokes (signup → child create → game complete → xp award → webhook) require either:
- Pre-provisioned test parent row in the staging Supabase, OR
- A Playwright browser-driven E2E suite

Both are tracked as Phase-4 enhancement candidates (`API-ENH-004` observability / `DEPLOY-ENH-001` CI pipeline). Until they land, run `scripts/smoke-test-webhook.ts` manually against staging after webhook-related changes:

```bash
BASE_URL=https://sparkforge-xyz.vercel.app \
STRIPE_WEBHOOK_SECRET=whsec_staging \
  npx tsx scripts/smoke-test-webhook.ts --email=your-test@example.com --tier=plus
```

---

## Incident response

If a staging smoke check fails on a preview deploy:

1. **Do not merge** — staging is reproducing a regression.
2. Check the CI logs for the specific failed assertion.
3. Pull the preview URL locally with `vercel pull` or reproduce against `localhost:3000`.
4. Fix on the same branch; force-push triggers a new preview + smoke re-run.

If prod is also affected, revert the last merge to main (Vercel rolls back within ~1 min).

---

## Future enhancements

Listed in the Final Audit roadmap but out of scope for the DEPLOY-HIGH-001 fix:

- **Supabase branching** (when GA) — replace the separate staging project with ephemeral per-PR DBs
- **Playwright E2E suite** against preview URLs (DEPLOY-ENH-001)
- **Sentry preview-env filtering** so staging errors don't mix with prod dashboards
- **Stripe workbench** for webhook replay testing

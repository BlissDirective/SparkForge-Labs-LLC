# Phase 5 — Systems & Cost Summary

**Date:** April 22, 2026 · **Branch:** `claude/phase-5-auth-enhancements-S5N0E`
**Scope:** Third-party services + package additions + projected monthly cost impact for Phase 5 First 10 enhancements.

---

## 1. Packages Introduced

| Task | Package | Version | Runtime / Build | Bundle impact |
|---|---|---|---|---|
| #3 | `@simplewebauthn/browser` | ^13.3 | Runtime (client) | ~18 KB gzipped, lazy-loaded on /login + /settings |
| #3 | `@simplewebauthn/server` | ^13.3 | Runtime (server) | Server-only, ~0 KB on client |
| #6 | `@gltf-transform/core` | ^4 | **Build-time only** (scripts/optimize-3d-assets.mjs) | 0 on client |
| #6 | `@gltf-transform/extensions` | ^4 | Build-time only | 0 on client |
| #6 | `@gltf-transform/functions` | ^4 | Build-time only | 0 on client |
| #6 | `meshoptimizer` | ^1.1 | Runtime (lazy via drei) | ~45 KB gzipped, loaded only when a GLB references meshopt geom |
| #7 | `cmdk` | ^1.1 | Runtime (client) | ~7 KB gzipped |
| #9 | `@asteasolutions/zod-to-openapi` | ^8.5 | Runtime (server) | Server-only; ~0 on client |
| #10 | `@tanstack/react-query-persist-client` | ^5 | Runtime (client) | ~2 KB gzipped (peer of already-present react-query) |
| #10 | `@tanstack/query-async-storage-persister` | ^5 | Runtime (client) | ~1 KB gzipped |
| #10 | `idb-keyval` | ^6 | Runtime (client) | ~1 KB gzipped |

**Net First-Load JS impact (Phase 5 total):** +35-40 KB on pages that actually need the features. Features are flag-gated so non-opted-in users see ~0 KB.

---

## 2. Third-Party Services / Tier Uplifts

| Task | Service | Change | Monthly cost delta |
|---|---|---|---|
| #5 | Supabase | **Pro plan required** for `pgaudit` extension | $25/mo (if not already on Pro) |
| #5 | Supabase | Log retention window (operator decision) | $0 with default 7-day window; $0.10-$0.50/GB/mo if extending via Log Archive |
| #2/#4 | Supabase | No extra cost (anonymous auth + auth.sessions are on all plans) | $0 |
| #3 | FIDO Alliance MDS3 | Public endpoint, no auth | $0 (no API key required) |
| #3 | Supabase | Slight MAU uptick from Passkey-enabled users (no separate anon users needed) | $0 |
| #6 | Vercel | KTX2 + Draco transcoders (~270 KB) served from /public | $0 (static) |
| #6 | Vercel | Asset transform CI step (`npm run optimize:3d`) | 15-45s extra CI time per deploy |
| #6 | Vercel | Potential bandwidth savings from ~20× smaller GLBs | **Net saving** once deployed |
| #8 | Stripe | No extra cost (/invoices/upcoming is billed as 1 standard API call) | $0 |
| #8 | Stripe | Optional Stripe Tax (Max tier — future) | 0.5% per transaction when enabled |
| #9 | No external service | Spec + codegen are in-repo | $0 |
| #10 | No external service | IndexedDB is browser-native | $0 |

### Prerequisite summary

| Prereq | Status | Action needed |
|---|---|---|
| Supabase Pro plan | **REQUIRED** for #5 (pgaudit) | Upgrade in Supabase dashboard |
| Vercel COOP/COEP headers | **REQUIRED** for #1 SharedArrayBuffer | Add to `vercel.json` (see SETUP_CHECKLIST) |
| Stripe API key configured | Already in place (`STRIPE_SECRET_KEY`) | Confirm present in prod |
| Anthropic API key | Not used by Phase 5 | — |

---

## 3. Infrastructure Impact

### 3.1 SQL migrations landed

| File | Runtime cost | Blast radius |
|---|---|---|
| `sql/019_demo_role_rls.sql` | Adds ~12 RESTRICTIVE policies across 12 tables. Each row read/write gains one extra boolean check. Negligible at our write volume (<10 qps peak). | Row-level |
| `sql/020_passkey_credentials.sql` | Adds 2 tables + pg_cron job. Tables are bounded (≤ N_users rows) and indexed. | Isolated |
| `sql/021_enable_pgaudit.sql` | pgaudit extension — up to 5% write-path perf hit (official docs). Log volume grows ~1KB/write. | Cluster-wide (once enabled) |

### 3.2 Cron jobs added

| Job | Cadence | File |
|---|---|---|
| `passkey-challenge-cleanup` | every 10 min | `sql/020_passkey_credentials.sql` |
| `audit-log-retention` (existing, reaffirmed by #5) | daily 00:15 UTC | `sql/014_audit_log.sql` |
| **preload manifest build** (Max tier, not yet scheduled) | future: daily | `src/app/api/jobs/preload-manifest/route.ts` GET is on-demand |

### 3.3 New HTTP endpoints

| Route | Method | Feature flag |
|---|---|---|
| `/api/auth/passkeys/register-options` | POST | `PASSKEY_AUTH` |
| `/api/auth/passkeys/verify-registration` | POST | `PASSKEY_AUTH` |
| `/api/auth/passkeys/authenticate-options` | POST | `PASSKEY_AUTH` |
| `/api/auth/passkeys/verify-authentication` | POST | `PASSKEY_AUTH` |
| `/api/auth/passkeys` | GET, DELETE | `PASSKEY_AUTH` |
| `/api/auth/sessions` | GET, DELETE | (always on; rejects demo) |
| `/api/stripe/invoice-preview` | POST | `PRORATION_PREVIEW` |
| `/api/jobs/preload-manifest` | GET | (always on) |
| `/api/docs` | GET (`?ui=1` for Swagger) | (always on; public by design) |

---

## 4. Cost Estimate Summary

| Scenario | Monthly delta |
|---|---|
| Minimum (prereqs already met, #5 Pro already active) | **$0** |
| Typical (upgrade Supabase Free→Pro for #5) | **+$25/mo** |
| Heavy Stripe Tax adoption (future Max tier #8) | **+0.5% of transaction volume** |
| Growth into #1 OffscreenCanvas telemetry backend | Budget for Sentry performance traces (~$26/100K traces) |

No Phase 5 feature introduces per-seat or per-user billing beyond Supabase Pro's flat fee.

---

## 5. Risk Posture

| Item | Rollback path |
|---|---|
| Every feature flag is **off by default** | Set `NEXT_PUBLIC_FF_*=false` in Vercel to kill any feature without a deploy |
| SQL migrations are idempotent + reversible in discrete units | DROP EXTENSION + DROP POLICY scripts are trivial to author |
| `/api/docs` is `force-dynamic` | Cannot poison Next's prerender cache |
| IndexedDB writes are namespaced (`sparkforge` DB) | User can clear via browser devtools; no collision with other apps |
| PgAudit logs are additive, not destructive | Can `ALTER DATABASE postgres RESET pgaudit.log` to disable |

---

## 6. Phase 5 Next-10 addendum (April 22, 2026)

Second batch of 10 enhancements (tasks #11–#20 in CLAUDE.md). Tier
selections per user: see individual task commits on branch
`claude/phase-5-auth-enhancements-S5N0E`.

### 6.1 Packages introduced (Next-10)

| Task | Package | Version | Runtime / Build | Bundle impact |
|---|---|---|---|---|
| #15 | `@vercel/otel` | ^2.1 | Runtime (server) | Server-only |
| #15 | `@opentelemetry/api` | ^1.9 | Runtime (server) | Server-only |
| #17 | `next-intl` | ^4 | Runtime (client + server) | ~9 KB gzipped on pages using `useTranslations` |
| #20 | `xstate` | ^5.30 | Runtime (client) | ~15 KB gzipped, tree-shaken per machine |
| #20 | `@xstate/react` | ^6.1 | Runtime (client) | ~2 KB gzipped |

**Net First-Load impact (Next-10 total):** +15-25 KB on pages that
import the machines / useTranslations. No impact on other pages.

### 6.2 Third-party services / tier uplifts (Next-10)

| Task | Service | Change | Monthly cost delta |
|---|---|---|---|
| #11 | Supabase | Google / Apple / Azure OAuth providers enabled in Auth settings (free) | $0 |
| #12 | Supabase | TOTP MFA factor is on all plans | $0 |
| #13 | Supabase | Realtime is on all plans; delta = bandwidth of JSON change events | ~$0 at current MAU |
| #14 | Stripe | Smart Retries is on all plans; win-back coupon inventory is flat | $0 |
| #14 | Resend | Dunning sequence adds ~4 extra transactional emails per churned user | ~$0-$1/mo typical; $0.001/email over 3K free tier |
| #15 | Vercel | OTLP endpoint is on all Vercel plans; Sentry receives OTel spans at current plan limits | $0 incremental |
| #17 | Anthropic | Claude Haiku 4.5 translation runs ad-hoc (~$0.01 per full catalog translation) | Negligible (~$1/year at monthly run cadence) |
| #18 | — | BatchedMesh is a Three.js feature; no service cost | $0 |
| #19 | GitHub Actions | Added jobs: playwright (~2 min), lighthouse (~1.5 min), bundle-size (~30s) | Within free public-repo minutes; ~3 min/run against paid quotas |
| #20 | — | XState is a local library | $0 |

### 6.3 Prerequisite summary (Next-10)

| Prereq | Status | Action needed |
|---|---|---|
| Google OAuth app | **REQUIRED** for #11 | Configure in Supabase dashboard + Google Cloud Console |
| Apple Services ID | **REQUIRED** for #11 | Configure in Supabase + Apple Developer Portal |
| Azure AD app registration | **REQUIRED** for #11 | Configure in Supabase + Azure Portal |
| Stripe Smart Retries enabled | **REQUIRED** for #14 | Dashboard → Billing → Retry rules → set max retry window = 7d |
| `CRON_SECRET` env | **REQUIRED** for #14 cron route | Present from Phase 1; reaffirmed |
| `ANTHROPIC_API_KEY` | Optional for #17 | Only needed when running `npm run translate:i18n` to refresh non-English locales |
| `SENTRY_DSN` or `OTEL_EXPORTER_OTLP_ENDPOINT` | Optional for #15 | OTel registration is skipped when neither is set |

### 6.4 Infrastructure impact (Next-10)

| File | Runtime cost | Blast radius |
|---|---|---|
| `sql/022_auth_events.sql` | 1 table + 3 indexes + 180d pg_cron retention job | Isolated (new table) |
| `sql/023_mfa_backup_codes.sql` | 1 table + 1 SECURITY DEFINER RPC | Isolated |
| `sql/024_realtime_progress.sql` | Adds `progress` + `children` to `supabase_realtime` publication + REPLICA IDENTITY FULL | Publication only; no schema change |
| `sql/025_dunning.sql` | 5 new columns on `parents` + 2 partial indexes | Parents table — negligible row-size impact |

New cron jobs:
- `purge_auth_events_180d` — daily at 03:17 UTC (pg_cron)
- `/api/cron/dunning` — daily at 10:15 UTC (Vercel Cron)

New HTTP endpoints (feature-flagged where relevant):
- `POST /api/auth/oauth/[provider]`, `GET /api/auth/identities`, `DELETE /api/auth/identities/[provider]` (#11)
- `POST /api/auth/mfa/enroll`, `/verify-enrollment`, `GET /api/auth/mfa/factors`, `DELETE /api/auth/mfa/factors/[factorId]`, `POST /api/auth/mfa/challenge`, `POST /api/auth/mfa/verify` (#12, flag `MFA_TOTP`)
- `POST /api/i18n/locale` (#17)
- `GET /api/cron/dunning` (#14)

### 6.5 Cost estimate summary (Next-10)

| Scenario | Monthly delta |
|---|---|
| Minimum (all prereqs met, flags default-off) | **$0** |
| Typical (OAuth providers live + MFA enabled + dunning active) | **$0** incremental — Supabase + Stripe are on existing tier |
| Heavy i18n iteration (monthly en.json edit + re-translate) | **~$0.10/mo** Claude Haiku |
| Lighthouse CI on 20+ PRs/mo | **$0** within GitHub free minutes |

### 6.6 Risk posture (Next-10)

| Item | Rollback path |
|---|---|
| OAuth disable | Unset providers in Supabase dashboard; existing email/password users unaffected |
| MFA disable | Set `NEXT_PUBLIC_FF_MFA_TOTP=false`; existing enrolled factors become dormant until flag re-enabled |
| Realtime disable | `ALTER PUBLICATION supabase_realtime DROP TABLE progress, children;` — one SQL statement |
| Dunning disable | Set `dunning_stage = NULL` via SQL; remove cron from `vercel.json`; emails stop immediately |
| OTel disable | Unset `SENTRY_DSN` + `OTEL_EXPORTER_OTLP_ENDPOINT` — `registerOTel` is skipped |
| i18n disable | Clear `NEXT_LOCALE` cookie; users fall back to English |
| BatchedMesh disable | `NEXT_PUBLIC_FF_BATCHED_COCKPIT=false` — legacy per-mesh path remains authoritative |
| CI job failures | Individual jobs can be marked `continue-on-error: true` without affecting main gates |
| XState disable | Each machine is opt-in via its hook; not importing the hook leaves games unchanged |

---

*End of Phase 5 Systems & Costs document · Next-10 added April 22, 2026*

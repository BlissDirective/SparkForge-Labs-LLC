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

*End of Phase 5 Systems & Costs document · April 22, 2026*

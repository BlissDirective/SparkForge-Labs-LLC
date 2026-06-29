# Phase 5 — Next 10 Enhancement Options (v3)

**Date:** April 22, 2026
**Purpose:** Min / Recommended / Max / Ultra tier options for the third batch of Phase 5 enhancements. Format matches the prior two rounds so selections can be collected in a single interactive session.

---

## #21 — PERF-ENH-002: Route-level code-splitting audit

Heavy 3D panels + charts are currently bundled into the dashboard layout. Audit suggests 15–25% First Load JS reduction possible.

| Tier | Scope | Cost | Benefit | Risk |
|---|---|---|---|---|
| **Min** | Audit bundle with `next build --profile`; document top 10 offenders; ship 1 `dynamic()` import (biggest win) | $0 | Small win; data for later rounds | No regression; low reward |
| **Recommended** | Dynamic-import all 3D panels; split @nivo charts into lazy route; targeted `dynamic({ ssr: false })` on GuideAvatar3D | $0 | -15–20% First Load JS on dashboard | Brief loading flashes on first visit per route |
| **Max** | + Route-group code-splitting (`(auth)`, `(dashboard)`, `(admin)` already groups; enforce chunk isolation via webpack config) | $0 | Per-route bundle parity; better caching | Small maintenance burden on config |
| **Ultra** | + Module-federation for the admin app (separate remote); per-user chunk prefetch based on role | $0 infra; 2-3 days engineering | Admin bundle never ships to children | Module federation in Next 15 is experimental |

---

## #22 — SEC-ENH-001: Content Security Policy hardening

Current CSP uses a per-request nonce but still permits `'unsafe-eval'` for some WASM paths and `data:` for inline SVGs. Audit shows 4 directives that can tighten.

| Tier | Scope | Cost | Benefit | Risk |
|---|---|---|---|---|
| **Min** | Report-only mode for 1 week, collect violations | $0 | Baseline data | No enforcement change |
| **Recommended** | Remove `'unsafe-eval'` (migrate last 2 eval-using deps); restrict `connect-src` to known domains; enforce `form-action 'self'` | $0 | Meaningful defense-in-depth | Risk of breaking a rarely-used path if audit misses something |
| **Max** | + Trusted-Types policy; `require-trusted-types-for 'script'`; custom policy for React | $0 | XSS mitigation at sink-level | React + Next has rough edges with Trusted Types |
| **Ultra** | + Subresource Integrity (SRI) on every external script; CSP violation telemetry piped to Sentry + weekly review | $0 + Sentry quota | Near-zero injection surface | SRI brittle when CDN assets version |

---

## #23 — STATE-ENH-006: Zustand store lint + dead-selector detector

15 Zustand stores. Audit finds ~8 orphaned selectors + 3 stores with overlapping fields.

| Tier | Scope | Cost | Benefit | Risk |
|---|---|---|---|---|
| **Min** | Manual audit + inline deletions of orphans | $0 | -500 LOC, clearer store shape | Human-error risk on rename |
| **Recommended** | CI script scans `useXStore(s => s.field)` call sites vs store shape; fails on orphans; auto-suggest selector names | $0 | Regression-proof | New lint step adds ~5s CI |
| **Max** | + AST-based store-field usage index (ts-morph); detect overlapping fields across stores; suggest mergers | $0 + 1 day | Catches architectural drift | Tooling requires maintenance |
| **Ultra** | + Automatic store-shape visualizer (Mermaid diagrams in docs/ regenerated per PR) | $0 | Great onboarding artifact | Diagrams can rot if not part of CI |

---

## #24 — AUTH-ENH-009: Session risk scoring

Current `/settings/sessions` lists devices but makes no judgment. Risk score would flag "new country + new UA + off-hours" combos.

| Tier | Scope | Cost | Benefit | Risk |
|---|---|---|---|---|
| **Min** | Compute 3-feature score (country change, UA change, hours-since-last-seen) client-side; show a bubble in UI | $0 | Useful-at-a-glance | No enforcement |
| **Recommended** | Server-side score; session row flagged in DB; soft-logout (require re-auth) at threshold 0.8 | $0 | Real mitigation | Friction on legitimate traveller |
| **Max** | + Per-parent risk profile that learns typical behavior; adaptive threshold | ~$5/mo if using MaxMind GeoIP | Fewer false positives | Requires 2–4 weeks of data to warm up |
| **Ultra** | + Passkey required for > 0.9 risk; Slack webhook for admin on suspected takeover | MaxMind + admin-on-call hours | Near-miss detection | Complexity; on-call fatigue |

---

## #25 — DB-ENH-003: Query performance monitoring

No current visibility into slow Supabase queries. Supabase Pro exposes pg_stat_statements.

| Tier | Scope | Cost | Benefit | Risk |
|---|---|---|---|---|
| **Min** | Document top-5 slow queries from manual `pg_stat_statements` scan | $0 | One-time awareness | Goes stale |
| **Recommended** | Weekly cron exports top-20 queries to `query_perf_log`; admin dashboard page | $0 | Regression visibility | ~1MB/week log growth |
| **Max** | + Threshold alerts; auto-EXPLAIN on any query > 500ms p95 | $0 + Sentry alert rules | Proactive tuning | False positive storms during traffic spikes |
| **Ultra** | + Supabase Query Performance Advisor API integration; auto-suggest indexes | Supabase advisor API pricing TBD | One-click optimization | Vendor lock-in |

---

## #26 — UX-ENH-011: Accessibility audit (WCAG 2.2 AA)

Claude Code v6.5 notes WCAG sweep for `text-white/10-40 → /50+`. Audit remaining:

| Tier | Scope | Cost | Benefit | Risk |
|---|---|---|---|---|
| **Min** | Run axe-core across 10 key routes; fix contrast-ratio failures | $0 | Legal baseline | Doesn't catch dynamic issues |
| **Recommended** | + Screen-reader smoke tests (NVDA + VoiceOver script); focus-visible audit; skip-link verification | $0 | Covers most common a11y gaps | 2–3 days manual |
| **Max** | + Keyboard-only nav reachability test in CI (playwright-axe); 404 on any unreachable interactive element | $0 | Catches regressions forever | CI flakes if anchors shift |
| **Ultra** | + Pay for external audit (WCAG 2.2 AA certification via Deque or Level Access) | $3-7K one-time | Certifiable; useful for RFPs | Cost |

---

## #27 — API-ENH-005: Rate-limit dashboard + tuning

Current rate limits are hardcoded per-key. No visibility into 429 rates.

| Tier | Scope | Cost | Benefit | Risk |
|---|---|---|---|---|
| **Min** | Count 429s per rate-limit key in Upstash; log daily totals | $0 | Awareness | No UI |
| **Recommended** | Admin dashboard page showing 429-per-key trends; suggest limit adjustments | $0 | Data-driven tuning | Manual action required |
| **Max** | + Per-parent rate-limit exemption (paid-tier bonus); dynamic reshaping based on abuse signals | $0 | Reward good users | State sprawl |
| **Ultra** | + ML-based anomaly detection on request patterns; auto-ban on confirmed abuse | ~$30/mo OpenAI small-model | Real abuse mitigation | False-positive bans |

---

## #28 — DEPLOY-ENH-002: Preview environments per PR

Vercel preview URLs exist but lack isolated Supabase + Stripe test data.

| Tier | Scope | Cost | Benefit | Risk |
|---|---|---|---|---|
| **Min** | Document using prod-test Supabase branch for previews (manual) | $0 | Some isolation | Fragile |
| **Recommended** | Auto-branch Supabase per PR via Supabase Branching; run migrations; teardown on PR close | $25/mo Supabase Pro already | Clean PR validation | Slow cold-start (~30s extra CI) |
| **Max** | + Seeded test data per branch; per-branch Stripe Test Clock; Playwright runs against the preview | Stripe Test Clock is free | E2E runs against "real" infra | CI minutes × 2 |
| **Ultra** | + Auto-generated smoke report attached to PR; Lighthouse score on preview URL | $0 | Review velocity | Comment spam if not sticky |

---

## #29 — PERF-ENH-003: Service worker + offline gameplay

Existing `OfflineBanner` detects offline. No offline gameplay.

| Tier | Scope | Cost | Benefit | Risk |
|---|---|---|---|---|
| **Min** | Workbox precache of shell + fonts | $0 | Offline first-paint | No gameplay offline |
| **Recommended** | Precache the 5 flagship games + shared assets; queue progress writes via Background Sync | $0 | Playable on flaky networks | Complex sync reconciliation |
| **Max** | + Offline AI Guide (cached prompts); prompt-lab fallback to cached responses | $0 | Guide works offline | Stale responses |
| **Ultra** | + Offline 3D cockpit (precache ~40MB assets); Background Sync for all writes; Workbox runtime analytics | +40MB PWA cache | Full offline app | 40MB is aggressive — parental bandwidth concern |

---

## #30 — STATE-ENH-007: Cross-tab state sync

A parent with the dashboard open in two tabs gets stale data in the inactive tab.

| Tier | Scope | Cost | Benefit | Risk |
|---|---|---|---|---|
| **Min** | `storage` event listener to invalidate React Query on login/logout | $0 | Auth state synced | Other state still drifts |
| **Recommended** | BroadcastChannel for cross-tab invalidation of children + progress caches | $0 | All queries sync | Minor perf overhead |
| **Max** | + Zustand persist middleware emits to BroadcastChannel; UI state (active child, panel open) sync | $0 | Seamless multi-tab | Ripple effects if not careful |
| **Ultra** | + Leader-election pattern (first tab owns Realtime channels; followers subscribe via BroadcastChannel) | $0 | 1× Supabase connection per parent instead of per-tab | Complex state machine; edge cases |

---

## Selection format (to be collected in interactive session)

```
#21 PERF-ENH-002 Route-level code-splitting audit:     [ Min / Recommended / Max / Ultra ]
#22 SEC-ENH-001  CSP hardening:                        [ Min / Recommended / Max / Ultra ]
#23 STATE-ENH-006 Zustand store lint:                  [ Min / Recommended / Max / Ultra ]
#24 AUTH-ENH-009 Session risk scoring:                 [ Min / Recommended / Max / Ultra ]
#25 DB-ENH-003   Query performance monitoring:         [ Min / Recommended / Max / Ultra ]
#26 UX-ENH-011   WCAG 2.2 AA accessibility audit:      [ Min / Recommended / Max / Ultra ]
#27 API-ENH-005  Rate-limit dashboard + tuning:        [ Min / Recommended / Max / Ultra ]
#28 DEPLOY-ENH-002 Preview environments per PR:        [ Min / Recommended / Max / Ultra ]
#29 PERF-ENH-003 Service worker + offline gameplay:    [ Min / Recommended / Max / Ultra ]
#30 STATE-ENH-007 Cross-tab state sync:                [ Min / Recommended / Max / Ultra ]
```

---

*End of Phase 5 Next-10 v3 Options · April 22, 2026*

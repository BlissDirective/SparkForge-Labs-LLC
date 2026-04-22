# SparkForge — Automation Playbook

**Scope:** How to automate every repeatable admin / developer / operator task using the Claude API + MCP connectors.
**Audience:** Platform owner, on-call engineer, any future contributor picking up ops work.
**Companion docs:** `docs/DISASTER_RECOVERY.md`, `SETUP_CHECKLIST.md`, `CLAUDE.md`, `TESTING.md`.
**Last updated:** April 21, 2026 · **Version:** 1.0

---

## 0. Philosophy — Automation Severity Matrix

Automation is not a single "on/off" switch. Each automatable task lands in one of four severity tiers, and **the tier dictates the mechanism**. Skip this principle and you ship an agent that either does nothing useful or does catastrophic things autonomously.

| Tier | Description | Mechanism | Example |
|---|---|---|---|
| **T0 · Observe** | Read-only checks, no state change | Cron → Claude API → log + Slack | Row-count drift detector |
| **T1 · Propose** | Drafts a fix, opens a PR, never merges | Claude → GitHub MCP → PR w/ risk note | Schema-drift remediation PR |
| **T2 · Auto-remediate (allowlist)** | Fires a narrow, reversible, pre-approved action | Claude → tool call → log event | Retry failed trial-reminder email |
| **T3 · Human-gated** | Destructive or high-blast-radius action | Claude drafts → Admin acknowledges via OpsAlertDock → human runs | PITR promote, Stripe refund, DDL |

**Design rule:** an action may move from T3 → T2 only after ≥30 days of clean T1 "propose" history for that exact action shape. Never skip tiers.

---

## 1. Architecture Overview

```
┌──────────────────────────────────────────────────────────────────┐
│ VERCEL CRON (schedules)                                          │
│  every 15m → /api/ops/health-check      (T0)                     │
│  hourly    → /api/ops/backup-verify     (T0)                     │
│  hourly    → /api/ops/stripe-reconcile  (T0 + T1)                │
│  daily 03  → /api/ops/deep-audit        (T0 + T1)                │
│  daily 04  → /api/ops/perf-probe        (T0)                     │
│  weekly M  → /api/ops/weekly-report     (T0)                     │
│  monthly 1 → /api/ops/pitr-drill        (T2, staging only)       │
└──────────────────────────────────────────────────────────────────┘
                                  ↓
┌──────────────────────────────────────────────────────────────────┐
│ CLAUDE OPS AGENT  (Claude Agent SDK, claude-sonnet-4-5)          │
│   System prompt:                                                  │
│     - DR runbook excerpt                                          │
│     - Severity matrix (T0–T3)                                     │
│     - Allowlisted remediation set                                 │
│   MCP tool stack (on demand):                                    │
│     · Supabase MCP     — SQL, snapshot list, PITR branch        │
│     · Postgres MCP     — read-only analytics, schema inspection  │
│     · Vercel MCP       — env var read, deploy status, logs       │
│     · Stripe MCP       — events, webhooks, subscription list     │
│     · GitHub MCP       — issue create, PR, label, review         │
│     · Sentry MCP       — error rate, new issues, release health  │
│     · Gmail / Resend   — notifications + weekly digests          │
│     · Slack webhook    — real-time alerts                        │
│     · Playwright MCP   — headless e2e runs                       │
└──────────────────────────────────────────────────────────────────┘
                                  ↓
             ┌────────────────────┼────────────────────┐
             ↓                    ↓                    ↓
       ops_alerts table   auto-remediate log   GitHub PR / issue
       (RLS admin-only)   (idempotency keys)   (runbook section cited)
                                  ↓
                          OpsAlertDock (admin UI)
                          Slack #ops-{warnings,alerts}
                          Resend email to on-call
                          Gmail digest (weekly summary)
```

The agent is a **Vercel Function** with its own cron schedule. It never runs on the same function as user traffic so a runaway loop can't starve the app.


---

## 2. MCP Connector Inventory

| MCP server | Role in automation | Risk level |
|---|---|---|
| `@supabase/mcp-server-supabase` | SQL, snapshots, PITR branches, RLS introspection | R/W — scope to `service_role` only inside the ops agent |
| `@modelcontextprotocol/server-postgres` (read-only) | Analytical queries, schema diff, row-count drift | R-only |
| `@vercel/mcp` | Env var read, deploy status, function logs, cron status | R/W — never let Claude rotate prod env |
| Stripe MCP (or thin wrapper over `stripe` SDK) | Event list, webhook status, subscription diff | R-only (refunds are T3) |
| `@sentry/mcp-server` | Error rate, release health, new-issue detection | R-only |
| GitHub MCP | Issue/PR create, comment, label | R/W — scoped PAT (issues + PRs only, no force-push) |
| Gmail MCP / Resend API | Weekly digests, on-call fallback email | W-only |
| Slack incoming webhook | Real-time alerts | W-only |
| Playwright MCP | Headless e2e smoke runs | R-only |
| `@anthropic-ai/mcp-fs` | Repo file reads (for context-aware PR drafts) | R-only |

**Scoping rule:** every MCP server mounted to the ops agent uses a **purpose-built credential** (not the same keys your app uses). Revoking one breaks only the agent, not the product.

---

## 3. The Shared Primitives (Build Once)

Every automation below depends on these five primitives. Ship them first; everything else plugs in.

### 3.1 `ops_alerts` table + RLS

```sql
CREATE TABLE ops_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  severity text NOT NULL CHECK (severity IN ('info','degraded','incident','remediated')),
  title text NOT NULL,
  body text,
  runbook_section text,              -- e.g. 'DISASTER_RECOVERY.md#4.1'
  source_cron text,                  -- e.g. 'ops/deep-audit'
  tier text NOT NULL CHECK (tier IN ('T0','T1','T2','T3')),
  auto_remediated boolean DEFAULT false,
  idempotency_key text UNIQUE,       -- prevents duplicate alerts from the same cron tick
  payload jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now(),
  acknowledged_at timestamptz,
  acknowledged_by uuid REFERENCES parents(id),
  resolved_at timestamptz,
  resolved_by uuid REFERENCES parents(id),
  resolution_note text
);
CREATE INDEX ops_alerts_unack ON ops_alerts (created_at DESC) WHERE acknowledged_at IS NULL;
ALTER TABLE ops_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY ops_admin_read ON ops_alerts FOR SELECT
  USING (EXISTS (SELECT 1 FROM parents WHERE id = auth.uid() AND is_admin = true));
CREATE POLICY ops_admin_ack ON ops_alerts FOR UPDATE
  USING (EXISTS (SELECT 1 FROM parents WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM parents WHERE id = auth.uid() AND is_admin = true));
-- INSERT policy: service_role only (agent uses service_role key).
```

### 3.2 `<OpsAlertDock />` — admin-only notification surface

Mounted next to `<AdminNavDock />` in the dashboard layout. Renders only when `parent.is_admin === true`. Polls `ops_alerts` every 60 s (React Query) for unacknowledged rows, severity-colored. Click → expand → runbook link + "Acknowledge" + "Resolve" buttons.

### 3.3 `withOpsAgent(prompt, tools)` helper

```ts
// src/lib/ops/agent.ts
export async function withOpsAgent(opts: {
  cronRoute: string;           // 'ops/deep-audit'
  tier: 'T0' | 'T1' | 'T2';
  systemPrompt: string;
  mcpTools: McpTool[];
  maxTurns?: number;           // default 8
}) {
  const start = Date.now();
  // Sentry transaction for observability + latency SLO
  return traceAiApiCall('ops-agent', opts.cronRoute, async () => {
    const agent = new Anthropic().beta.agents.run({
      model: 'claude-sonnet-4-5',
      system: opts.systemPrompt,
      tools: opts.mcpTools,
      max_turns: opts.maxTurns ?? 8,
    });
    // … append every assistant tool_use to ops_agent_audit table …
    return agent;
  });
}
```

Every agent invocation is logged to `ops_agent_audit` with tool calls + decisions so the human can audit what Claude did yesterday.

### 3.4 Idempotency keys

Every cron handler computes a stable idempotency key (e.g. `${route}:${hour}:${severity}:${target}`) and early-returns if an alert with that key already exists. Prevents alert storms when a condition persists.

### 3.5 Remediation allowlist registry

```ts
// src/lib/ops/allowlist.ts
export const REMEDIATION_ALLOWLIST: Record<string, RemediationSpec> = {
  'retry-trial-reminder': { maxPerHour: 5, requiresHealth: true, rollback: 'log-only' },
  'clear-stuck-webhook-events': { maxPerHour: 1, requiresHealth: true, rollback: 'dry-run-first' },
  'rotate-upstash-key-ttl': { maxPerHour: 1, requiresHealth: false, rollback: 'noop' },
  'regen-design-matrix-pr': { maxPerHour: 1, requiresHealth: false, rollback: 'pr-not-commit' },
};
```

Anything not in the registry → propose + PR/issue, never auto-act.


---

## 4. DISASTER_RECOVERY.md — Automated Coverage Map

Every row in the runbook mapped to its automation tier, Claude prompt, and MCP tools.

| Runbook section | Task | Tier | Cron | MCP tools | Notes |
|---|---|---|---|---|---|
| §2 PITR Enablement | Verify PITR is ON in Supabase | T0 | daily | Supabase | Alerts if disabled |
| §3.1 Staging PITR drill | Full drill + log result | T2 | monthly 1st 02:00 UTC | Supabase, GitHub, Slack | Staging only |
| §3.2 Snapshot restore drill | Snapshot-restore rehearsal on staging | T2 | quarterly | Supabase, GitHub | Rotates with §3.1 |
| §4.1 Small incident PITR | Create branch project, diff rows | T1 | on-demand (via alert) | Supabase, GitHub | Drafts PR with reconciliation SQL |
| §4.2 Snapshot restore | Find most recent clean snapshot + summary | T1 | on-demand | Supabase, Slack | Posts exact dashboard click-path |
| §4.3 Region outage | Standby project health | T0 | every 15m | Supabase × 2 regions | Monitors standby; never promotes autonomously |
| §6 Drill log | Append drill results to `docs/DISASTER_RECOVERY.md` | T1 | after every drill | GitHub | Opens PR w/ RPO + RTO row |
| §7 Escalation | Page on-call | T0 | any INCIDENT | Slack, Gmail, PagerDuty | Follows severity matrix |

### 4.1 The `/api/ops/pitr-drill` cron spec

```ts
// Vercel cron: monthly on 1st at 02:00 UTC
export async function GET(req: NextRequest) {
  const denial = verifyCronBearer(req, { routeName: 'pitr-drill' });
  if (denial) return denial;

  return withOpsAgent({
    cronRoute: 'ops/pitr-drill',
    tier: 'T2',
    systemPrompt: PITR_DRILL_PROMPT,
    mcpTools: [supabaseStagingMCP, githubMCP, slackMCP],
    maxTurns: 12,
  });
}
```

System prompt excerpt:

```
You are running the monthly staging PITR drill per
docs/DISASTER_RECOVERY.md §3.1. Your tools:

  - supabase_staging  — execute SQL, list snapshots, create PITR branch
  - github            — open a PR with the drill log row
  - slack             — post to #ops-drills

Procedure:
  1. INSERT 3 marker rows into staging.test_drill_rows.
  2. Record T0 as UTC ISO-8601 string; wait 5 minutes.
  3. DELETE one marker (note the marker's UUID).
  4. Create a PITR branch restored to T0.
  5. SELECT from test_drill_rows on the branch — deleted row MUST be present.
  6. Record RPO (T0 to now) + RTO (branch creation time).
  7. Drop the branch.
  8. Open a PR appending a row to the §6 drill log in
     docs/DISASTER_RECOVERY.md.
  9. Post Slack summary with RPO/RTO + PR link.

If any step fails: DO NOT retry. Post to #ops-alerts immediately,
tagged @on-call, with the failing step + error. Open a GitHub issue
with severity:incident.
```

---

## 5. SETUP_CHECKLIST.md — Automated Coverage Map

Setup is mostly one-time, but many **verifications** are recurring and perfect for automation.

### 5.1 One-time setup (automated where possible)

| Section | Task | Automation approach |
|---|---|---|
| §1.2 SQL migrations | Run ordered migrations | **Script + MCP:** `scripts/run-migrations.mjs` reads `sql/*.sql` in order, executes via Supabase MCP, checks expected tables after each. Agent reports on completion. |
| §1.2 Verify migrations | `SELECT count(*) FROM …` across 12+ tables | **T0 continuous:** `ops/schema-verify` cron checks table list + expected columns daily. Alerts on drift. |
| §1.2.1 Connection pooling | Supabase dashboard toggle | T3 — dashboard click; agent can only verify the flag via Supabase settings API. |
| §1.3 Create first admin | `UPDATE parents SET is_admin = true WHERE email = …` | **T2 allowlist:** agent runs when a manual `/api/ops/promote-admin` is triggered with admin email + HMAC approval. |
| §2.1 Stripe API keys | Paste into Vercel | T3 — Claude can **verify** keys work via Stripe MCP's `balance.retrieve()`, not set them. |
| §2.2 Products + prices | Create 4 Stripe prices | **T1 proposal:** agent compares configured price IDs against `STRIPE_*_ID` env vars; opens issue if any missing. |
| §2.3 Webhook endpoint | Create + copy secret | **T0 verify:** daily cron pings `/api/stripe/webhook` with a synthetic event (see §5.3 below). |
| §3.3 Upstash Redis | Create DB + copy URL/token | **T0 verify:** agent queries Upstash for the rate-limit keys daily to confirm connectivity. |
| §3.4 CSRF secret | Generate + set env var | **T0 verify:** agent confirms `/api/health` headers include CSP + CSRF cookie. |
| §3.5 Resend | API key + domain verification | **T0 verify:** daily test-email cron (dry-run) confirms Resend accepts auth. |
| §4.3 Vercel cron jobs | Configure 3 crons in `vercel.json` | **T0 verify:** Vercel MCP queries cron status daily; alerts if any disabled or not-yet-run. |

### 5.2 Recurring operator tasks → cron-ified

Lifted from Appendix E ("Admin Operations Guide"):

| Original task | Frequency | Agent replacement |
|---|---|---|
| Review AI content queue | daily | **T1:** agent surfaces items idle > 48 h with a summary + recommended disposition (approve / reject / request revision). |
| Check subscription health | daily | **T0:** agent counts `past_due` parents + posts delta-from-yesterday to Slack. |
| Verify cron ran | daily | **T0:** agent checks each Vercel cron's last-run timestamp + success code. |
| Review archived children | weekly | **T0:** agent lists children archived ≤ 7d ago + parent email + archive reason (suspicious?). Admin decides. |
| Trial conversion count | weekly | **T0:** agent runs the SELECT, posts to Slack, graphs week-over-week. |
| Subscription events summary | weekly | **T0:** agent groups by event_type + emits weekly report. |
| Promote an admin | ad-hoc | **T3:** agent drafts the SQL but never executes (destructive). |

### 5.3 Post-deploy smoke automation

All of §5.1–§5.8 in SETUP_CHECKLIST.md can become a single `/api/ops/post-deploy-smoke` endpoint triggered by Vercel's `deployment.succeeded` webhook:

```ts
// Triggered by Vercel → our webhook endpoint on every production deploy
export async function POST(req: NextRequest) {
  verifyVercelWebhookSignature(req);
  return withOpsAgent({
    cronRoute: 'ops/post-deploy-smoke',
    tier: 'T0',
    systemPrompt: POST_DEPLOY_SMOKE_PROMPT,
    mcpTools: [fetchMCP, stripeMCP, supabaseMCP, playwrightMCP, githubMCP],
  });
}
```

The agent runs, in parallel when safe:

1. **§5.1 Health + homepage** — 2 fetches, expects 200 + JSON shape
2. **§5.2 Stripe checkout** — Playwright MCP driven: signup → test card → verify `parents` row shape
3. **§5.3 Webhook smoke** — runs `scripts/smoke-test-webhook.ts` equivalent via Stripe MCP event injection
4. **§5.4 Admin access** — requireAdmin spot check
5. **§5.5 Downgrade flow** — Playwright MCP clicks through
6. **§5.6 Archive restore** — REST flow via service_role
7. **§5.7 Trial reminder** — synthetic trial expiring in 47 h; cron trigger; Resend delivery check
8. **§5.8 Unit + type + lint + build** — GitHub Actions already handles; agent reports on latest run

Posts a pass/fail matrix to Slack. Any fail → rolls back via Vercel MCP (`promote-previous-deployment`) + opens incident.


---

## 6. Test Automation — Smoke, Unit, Integration, E2E, Performance

### 6.1 What's already automated (inherited from Phase 1–4)

| Layer | Tool | Runs when | Scope |
|---|---|---|---|
| TypeScript | `npx tsc --noEmit` | pre-commit + CI | Entire repo |
| ESLint | `npm run lint` | pre-commit + CI | Repo-wide; rules at `error` for img, perf-high-001, contrast |
| Unit tests | Vitest | CI + local watch | 332 tests, 47 files |
| Regression guards (repo-scan) | Vitest | CI | no-raw-img, no-low-contrast, no-bare-useXStore, cockpit-config-single-source, design-matrix-sync, font-hierarchy, spacing-budget, lab-colors |
| E2E smoke | Playwright | manual + CI | `tests/e2e/health.spec.ts`, `a11y-sidebar`, `a11y-game-focus` (skipped until seed) |
| Build | Next.js build | CI | Prerender + type + bundle |

### 6.2 What Claude adds

| Cadence | Agent + tools | Purpose |
|---|---|---|
| **every 15 min** | Claude + fetch + Sentry MCP | Synthetic traffic probe: `/api/health`, homepage, one signed-in user-journey if feasible. Diffs p95 latency vs yesterday's baseline. |
| **hourly** | Claude + Stripe MCP + Supabase MCP | Stripe ↔ DB reconciliation: every Stripe `customer.subscription.updated` from the last hour has a matching row in `subscription_events.processed=true`. |
| **daily 03:00** | Claude + Playwright MCP | Run the full e2e suite headless against production (read-only routes only). |
| **daily 03:30** | Claude + Postgres MCP | Index-usage scan: `EXPLAIN ANALYZE` the 12 critical queries from §3 of the audit; alert if any is doing a seq scan. |
| **daily 04:00** | Claude + Vercel MCP | Bundle-size delta: pulls last-24h deploys' first-load-js figures; alerts on >10 kB regression. |
| **daily 04:15** | Claude + Sentry MCP | Release-health report: error rate, crash-free users, top 5 new issues. Summary to Slack + email. |
| **weekly Mon 09:00** | Claude + GitHub MCP + Supabase MCP + Sentry MCP | Weekly digest (see §9.4). |

### 6.3 Synthetic user journeys (Playwright MCP)

A set of **seeded read-only** flows the agent runs daily against production:

| Flow | What it proves |
|---|---|
| Marketing landing → signup page | Homepage/SEO surfaces healthy |
| Login form → wrong password → error surfaced | Auth error path intact |
| Signup → COPPA step → guard enforces | COPPA consent wall up |
| Demo login → dashboard → 60min expiry banner | Demo session infrastructure live |
| Arcade listing → game-slug page (not started) | Game registry routing intact |
| Admin login → /admin/content queue renders | Admin surfaces live |

Each flow is a Playwright script stored in `tests/e2e/synthetic/`. Agent invokes via Playwright MCP and reports per-flow PASS/FAIL + screenshot on failure.

### 6.4 Performance automation (Web Vitals + 3D)

| Metric | Source | Agent action |
|---|---|---|
| LCP, INP, CLS | Sentry Performance | Daily baseline diff; alerts on >20% regression |
| First-load JS per route | Vercel MCP build output | Alerts on routes growing past budget (home < 250 kB, games < 350 kB) |
| Cockpit cold-load time | Sentry span `hero.animate` | Weekly graph; alerts on p95 > 3 s |
| Frame-time at 60 fps | `useFrameTimeMonitor` telemetry → Sentry breadcrumbs | Weekly: % of sessions with sustained 60 fps per device bucket |
| Bundle-size budget (`scripts/check-bundle-size.mjs`) | CI | Already automated — agent surfaces the trend |

### 6.5 Load / chaos (future, T2)

One cron per week: agent runs a *read-only* load probe against `/api/content/library` with 100 concurrent fetches, measures p95. Not write-path. Any write-path load testing stays on staging with human triggering.

---

## 7. Audit-Derived Automations (Scanning All 137 Findings)

Items in the `Final-Audit_04-15-2026.md` that are inherently recurring verification work, grouped by section.

### 7.1 Auth (AUTH-*)

| Finding | Automation | Tier |
|---|---|---|
| AUTH-HIGH-002 middleware audit (requireAuth/requireAdmin coverage) | `scripts/audit-api-auth.sh` already exists — agent runs it daily + opens issue on any route missing calls | T1 |
| AUTH-HIGH-003 rate limit effectiveness | Agent probes `/api/auth/login` with 10 bad attempts in 60 s; expects 429 by attempt 6 | T0 |
| AUTH-HIGH-004 email verification | Agent counts `parents WHERE email_verified_at IS NULL AND created_at < NOW() - INTERVAL '7 days'` | T1 (weekly) |
| AUTH-MED-002 COPPA consent enforcement | Agent attempts `POST /api/children` as an un-consented test parent; expects 403 | T0 |
| AUTH-MED-003 account lockout | Agent probes failed-login-count trigger | T0 |
| AUTH-LOW-001 demo session ID entropy | Script verifies `crypto.randomUUID()` used (grep) + no `Math.random()` in auth paths | T0 |
| AUTH-LOW-002 logout scope | Synthetic signin → signout → reuse token → expects 401 | T0 |

### 7.2 Database (DB-*)

| Finding | Automation | Tier |
|---|---|---|
| DB-CRIT-001 RLS on subscription_events | Agent queries `pg_policies` for every table in `information_schema.tables`; alerts on any user-facing table with no policy | T0 daily |
| DB-CRIT-002 RLS on Stage 8/9 tables | Same CI scan above covers it | T0 |
| DB-HIGH-001 content_admin_all policy | Agent checks policy scope daily; alerts if it has been widened since baseline | T0 |
| DB-HIGH-002 audit logging | Once `audit_log` is added (audit §3.DB-HIGH-002), agent posts daily summary of sensitive changes | T0 |
| DB-HIGH-003 prompts_used_today reset drift | Agent verifies daily cron-reset worked via `SELECT count(*) WHERE prompts_used_today > 0 AND prompts_reset_date = yesterday` at 00:05 UTC | T0 + T2 |
| DB-MED-003 index usage | Nightly `EXPLAIN ANALYZE` on 12 critical queries; alerts on seq scans | T0 |
| DB-MED-004 connection pooling | Agent samples Supabase connection count every hour; alerts if > pool limit | T0 |
| DB-ENH-001 RLS testing suite | Agent runs cross-parent access tests daily; expects 0 rows returned for impersonation queries | T0 |

### 7.3 Payments (PAY-*)

| Finding | Automation | Tier |
|---|---|---|
| PAY-CRIT-001 webhook idempotency | Agent replays a random `subscription_events` row as a Stripe test; expects `processed=true` short-circuit | T0 |
| PAY-HIGH-001 payment method validation | Synthetic test card → checkout → verify `parents.subscription_status=active` within 30s | T0 |
| PAY-HIGH-002 customer ID lookup | Agent counts `customer_id IS NULL` in recent `subscription_events` | T0 |
| PAY-HIGH-003 stuck past_due parents | Agent surfaces parents stuck > 7 days | T1 weekly |
| PAY-MED-003 invoice failures | Agent polls `invoice.payment_failed` events hourly, groups by parent, drafts dunning actions for admin review | T1 hourly |
| PAY-ENH-003 dunning automation | T2 allowlist: send canned reminder email once per failed invoice, max 3 attempts, then escalate to T3 | T2 |
| PAY-ENH-004 subscription analytics | Weekly MRR / churn / conversion report to Slack + Gmail | T0 weekly |

### 7.4 API Security (API-*)

| Finding | Automation | Tier |
|---|---|---|
| API-HIGH-001 Zod schema coverage | Agent greps API routes for `parseBody(...)` vs lack thereof; opens issue on any missing | T1 daily |
| API-HIGH-002 rate limiting coverage | Agent verifies every write-route has `applyRateLimit`; drafts PR for missing | T1 daily |
| API-HIGH-004 CSRF coverage | Agent checks POST/PUT/DELETE routes all require CSRF header | T0 daily |
| API-MED-003 AI content safety | Agent samples 100 recent AI-generated `content_queue` items, runs safety check via Claude; flags any that slipped through | T1 daily |

### 7.5 UX / Design (UX-*)

| Finding | Automation | Tier |
|---|---|---|
| UX-HIGH-002 sidebar keyboard nav | Playwright a11y audit (axe-core) on 5 routes | T0 daily |
| UX-HIGH-003 offline banner | Agent simulates offline; expects banner | T0 daily |
| UX-HIGH-005 contrast regression | **Already automated** — vitest guard + ESLint error (Phase 4) | T0 CI |
| UX-MED-001 save indicator | Playwright: game → complete round → expects save-indicator toast | T0 daily |
| UX-MED-002 demo expiry warning | Playwright: demo login → stub clock to +50 min → expects T-10 warning | T0 daily |

### 7.6 Performance (PERF-*)

| Finding | Automation | Tier |
|---|---|---|
| PERF-CRIT-002 memory monitor alerts | Agent polls `ops_memory_samples` table (new); alerts if p95 > budget | T0 |
| PERF-HIGH-001 bare store subscription | **Already automated** — vitest guard + ESLint error (Phase 4) | T0 CI |
| PERF-HIGH-002 texture compression | Agent checks asset pipeline output for KTX2 coverage; reports on weekly digest | T0 weekly |
| PERF-HIGH-003 setInterval leak | Agent checks `rate-limit.ts` + `api-helpers.ts` haven't reintroduced unreferenced intervals | T0 daily |
| PERF-MED-003 adaptive postFX | Telemetry-driven: if average frame time > 20 ms for > 10% of sessions in a day, recommend flipping `performanceMode` default | T1 weekly |

### 7.7 Deployment (DEPLOY-*)

| Finding | Automation | Tier |
|---|---|---|
| DEPLOY-CRIT-001 env var leakage | Agent scans `process.env.NEXT_PUBLIC_*` usages; alerts on any variable that looks secret (contains `KEY`, `SECRET`, `TOKEN`) | T0 daily |
| DEPLOY-HIGH-001 secrets scanner | Gitleaks in CI **already planned**; agent posts weekly "no leaks in X days" | T0 CI |
| DEPLOY-HIGH-003 uptime monitor | Agent runs probes; posts delta | T0 |
| DEPLOY-MED-001 PITR drill | **Automated** (see §4) | T2 monthly |
| DEPLOY-MED-002 Sentry env tags | **Automated** Phase 4 T16 — agent verifies `release` tag is present in every event | T0 daily |
| DEPLOY-MED-003 verifyCronBearer | **Automated** Phase 4 T17 — agent probes cron endpoints without bearer; expects 401 | T0 daily |

### 7.8 State Management (STATE-*)

| Finding | Automation | Tier |
|---|---|---|
| STATE-HIGH-001 stale cache cross-tab | Agent runs Playwright dual-tab test daily | T0 |
| STATE-HIGH-002 hydration mismatch | Agent checks Sentry for `Hydration` error tag; alerts on any | T0 |
| STATE-MED-001/002/003 | **Resolved** Phase 2 T5a-c + Phase 2 audit fixes | — |


---

## 8. Agent Cookbook — Concrete Prompts

Five drop-in system prompts for the agents above.

### 8.1 Observer (T0 health check)

```
You are SparkForge's ops guardian (T0: observe only, never mutate).

Tools:
  - postgres (read-only)
  - vercel (read-only)
  - sentry (read-only)
  - slack (webhook)

Checks to run:
  1. `SELECT now()` via postgres MCP — must return within 2 s.
  2. Vercel recent deploys — newest is 'READY' and < 24 h old.
  3. Sentry error rate last 15 min vs baseline; alert if > 3× baseline.
  4. `/api/health` fetch — 200 + `status:ok`.

For each fail, insert a row into ops_alerts with:
  severity = 'degraded' (first fail) or 'incident' (2+ consecutive),
  source_cron = 'ops/health-check',
  tier = 'T0',
  runbook_section = 'DISASTER_RECOVERY.md#4.1',
  idempotency_key = `health:${hour_utc}:${check_name}`.

Post to #ops-warnings for degraded, #ops-alerts (+ @on-call) for incident.
Never take write actions.
```

### 8.2 Proposer (T1 schema drift)

```
You are SparkForge's schema-drift detector (T1: propose PR, never merge).

Tools: postgres (R), github, slack.

Each run:
  1. SELECT current schema via information_schema.
  2. Compare against ops/expected-schema.json.
  3. For every diff row:
     - If missing table on prod (drift) → severity:incident, open issue.
     - If extra column / policy / index → severity:degraded, open PR
       with `REVIEW REQUIRED` label that proposes reverting OR
       updating the baseline.
  4. If no diff, append dated row to ops_heartbeat (healthy).

Every PR body includes:
  - Exact diff
  - Runbook section (DISASTER_RECOVERY.md §6.3 if table missing)
  - Risk note
  - One-click revert command
```

### 8.3 Remediator (T2 trial-reminder retry)

```
You are SparkForge's trial-reminder remediator (T2: fire allowlisted action).

Allowlist entry: 'retry-trial-reminder'
  maxPerHour: 5, requiresHealth: true, rollback: 'log-only'

Each run:
  1. Query subscription_events WHERE event_type = 'trial.reminder.sent'
     AND processed = false AND created_at > NOW() - '24h'.
  2. For each row, re-POST /api/cron/trial-reminders with single-parent payload.
     Use verifyCronBearer header.
  3. If success → mark processed=true, log 'remediated'.
  4. If retry also fails → escalate: create ops_alerts row severity:incident,
     open GitHub issue, STOP retrying this parent (circuit-breaker).

Safety:
  - Never send same reminder twice (idempotency_key = parent_id + window).
  - Abort if health-check posted incident in last 10 minutes.
```

### 8.4 Reconciler (T0/T1 Stripe ↔ DB)

```
You are SparkForge's Stripe reconciler.

Tools: stripe (R), postgres (R), github, slack.

Each run (hourly):
  1. `stripe.events.list({ created: { gte: last_hour }, limit: 100 })`.
  2. For every event, confirm subscription_events has a row with
     matching stripe_event_id AND processed = true.
  3. If ANY event is missing from DB:
     - 1 event missing → degraded + Slack
     - 3+ events missing → incident + on-call + open issue
  4. Post hourly tick count to ops_heartbeat.
```

### 8.5 Digest writer (T0 weekly report)

```
You are SparkForge's weekly digest author.

Tools: postgres (R), sentry (R), vercel (R), stripe (R), gmail.

Produce a markdown digest containing:
  1. MRR, new signups, trial-to-paid conversion (week + WoW delta)
  2. Top 5 Sentry issues by user-count
  3. p95 LCP / INP / CLS per route
  4. Cron-job health: % ran-on-time, any misses
  5. Admin-queue backlog: count, oldest item age
  6. Sessions started, games completed, XP awarded totals

Tone: direct, numbers-first, action items at bottom (which are T1
proposals the admin can act on next week).

Send via Gmail MCP to ops@sparkforge.example, CC on-call.
Also insert a summary row into ops_digests table.
```

---

## 9. Cost Model

| Agent | Model | Runs/mo | Tokens/run | Monthly cost |
|---|---|---|---|---|
| Health check (15 min) | Haiku 4.5 | 2,880 | 2 k in / 1 k out | ~$6 |
| Backup verify (hourly) | Haiku 4.5 | 720 | 3 k in / 1 k out | ~$2 |
| Stripe reconcile (hourly) | Sonnet 4.5 | 720 | 8 k in / 2 k out | ~$20 |
| Schema drift (daily 03) | Sonnet 4.5 | 30 | 15 k in / 5 k out | ~$3 |
| Post-deploy smoke | Sonnet 4.5 | ~40 | 25 k in / 10 k out | ~$8 |
| PITR drill (monthly) | Sonnet 4.5 | 1 | 30 k in / 15 k out | ~$0.30 |
| Weekly digest | Sonnet 4.5 | 4 | 50 k in / 20 k out | ~$4 |
| Synthetic journeys | Haiku 4.5 | 30 × 6 flows | 5 k in / 2 k out | ~$3 |
| **TOTAL** | — | — | — | **~$45 / month** |

Within a rounding error of the product's existing infra cost. Prompt caching on the invariant parts of the system prompts drops this another 30–40%.

**Budget ceiling rule:** bake a `max_tokens_per_month` env var into the agent runtime. When approached, agent downgrades to Haiku or stops non-essential work.

---

## 10. Risk Register (Automation-Specific)

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Agent loops on a failing check, burns tokens | Med | Low (cost) | `max_turns: 8`, per-route monthly budget |
| False-positive incident during degraded LB | High (first month) | Med | Require 2 consecutive failures before pager |
| Agent opens duplicate PRs | Med | Low | Idempotency key + PR-title fingerprint dedup |
| Agent auto-remediates an action that shouldn't have been | Low | High | Allowlist + T2→T3 hard escalation on unknown shapes |
| Stripe test-mode drift into production | Low | High | Stripe MCP scoped to `restricted` key (no mode switch) |
| Service-role key leakage | Low | Critical | Key rotation quarterly + Vercel env is admin-only |
| MCP server supply-chain compromise | Low | High | Pin versions; audit `node_modules` weekly; allowlist outbound domains |
| Slack alert fatigue | Med | Med | Severity routing: degraded → #warnings, incident → #alerts + @on-call |
| Agent bypasses cron auth (compromised CRON_SECRET) | Low | Critical | Timing-safe `verifyCronBearer` (Phase 4 T17) + rotate CRON_SECRET quarterly |

---

## 11. Mythos-Inspired Testing Enhancements

Applying OpenMythos concepts (Mythos.md §8) to our automation layer:

- **ACT halting for probes:** each agent halts once cumulative evidence crosses a confidence threshold. Don't run all 20 synthetic journeys every run — stop at 5 consecutive PASSes and mark the rest "sampled out today."
- **MoE routing per alert type:** a health-check failure routes to Haiku for quick triage; a schema-drift incident routes to Sonnet for diff analysis and PR drafting. Cheap experts for cheap tokens.
- **Loop-index embedding for regressions:** each agent run embeds `{week-of-year, day-of-week}` into its prompt context so seasonal drift (e.g., Monday deploy volume) is handled without a separate rule.
- **LTI-stable injection:** never let auto-remediations compound. If a T2 action fires, block further T2 of the same shape for 10 minutes. Prevents runaway loops.
- **Shared-expert pattern:** one system-prompt preamble (runbook excerpt + severity matrix + allowlist) is reused across every agent to keep behavior consistent; only the task-specific tail differs.

---

## 12. Rollout Sequence (4 Weeks to Full Coverage)

| Week | Deliverable | Risk |
|---|---|---|
| **1** | Primitives ship: `ops_alerts` table, `<OpsAlertDock />`, `withOpsAgent` helper, idempotency keys, allowlist registry, Slack webhook + Gmail | Zero |
| **1b** | T0 agents: `/api/ops/health-check` (15 min), `/api/ops/backup-verify` (hourly) | Zero (read-only) |
| **2** | T0 continued: schema-drift, Stripe reconcile, Sentry anomaly, index-usage scan, post-deploy smoke hook | Zero |
| **2b** | Synthetic user journeys (Playwright MCP) for 6 flows | Zero (read-only) |
| **3** | T1 proposers: schema-drift PRs, missing-rate-limit PRs, weekly digest to Gmail | Low |
| **3b** | T2 allowlist — 4 safe remediations behind feature flag | Medium (staging only for week 3) |
| **4** | T2 allowlist promoted to production; PITR drill automation (monthly) | Low (staging-proven) |
| **ongoing** | Weekly review of `ops_agent_audit` log; extend allowlist only after 30 days of clean T1 decisions for the candidate action | Managed |

---

## 13. What to Build First (Tomorrow Morning)

1. **SQL migration**: `sql/019_ops_alerts.sql` (from §3.1) — 1 commit.
2. **Admin UI**: `src/components/admin/OpsAlertDock.tsx` — 1 commit.
3. **Helper**: `src/lib/ops/agent.ts` with `withOpsAgent`, `withOpsIdempotency`, `insertOpsAlert` — 1 commit.
4. **Allowlist**: `src/lib/ops/allowlist.ts` — 1 commit.
5. **First T0 route**: `/api/ops/health-check` — 1 commit.
6. **Vercel cron entry** in `vercel.json` + env var `OPS_SLACK_WEBHOOK` — 1 commit.
7. **Unit tests** for the helper — 1 commit.

Six commits. Produces a live "nothing to worry about" Slack ping every 15 minutes, an admin-visible dock, and the foundation every later piece plugs into.

---

## 14. Explicit Non-Goals

- **No autonomous production DDL.** Claude drafts; humans merge.
- **No autonomous PITR promote.** Always T3.
- **No autonomous env-var rotation.** T3 only.
- **No autonomous Stripe refunds.** T3.
- **No autonomous user-data writes to prod** beyond the 4-item allowlist.
- **No Claude-authored "auto-fix CI" commits pushed to main** without a human reviewer.

These are non-negotiable until there's > 90 days of clean audit log for a given action shape.

---

## 15. Success Criteria

After 90 days running:

| Metric | Target |
|---|---|
| Uptime-detected incidents caught before user reports | ≥ 95% |
| False-positive incident rate | ≤ 2 / week |
| Mean time to detection (MTTD) for incidents | ≤ 5 min (T0 agent) |
| Mean time to first-action draft (MTTFA) for T1 | ≤ 15 min |
| Mean time to restoration (MTTR) for auto-remediations | ≤ 2 min |
| Admin burden hours/week (reviewing automation) | ≤ 1 hour |

---

## 16. References

- `docs/DISASTER_RECOVERY.md` — runbook this plays against
- `SETUP_CHECKLIST.md` — setup steps this wraps
- `TESTING.md` — existing test inventory
- `CLAUDE.md` — project autonomy boundaries + hook points
- `Mythos.md` — looped-transformer concepts informing the multi-agent / expert-routing design
- Claude Agent SDK: `https://docs.anthropic.com/claude-code/agent-sdk`
- MCP spec: `https://modelcontextprotocol.io`
- Supabase MCP: `https://github.com/supabase/mcp-server-supabase`
- Vercel MCP: `https://github.com/vercel/mcp`

---

*Automation Playbook v1.0 · April 21, 2026 · Claude-API-native ops architecture for SparkForge.*

---

## 17. Phase 5 First 10 — Automation Additions (April 22, 2026)

Automatable ops hooks added alongside the 10 Phase 5 enhancements.

### 17.1 Cron & scheduled jobs

| Job | File | Cadence | Agent tier | Notes |
|---|---|---|---|---|
| `passkey-challenge-cleanup` | `sql/020_passkey_credentials.sql` | every 10 min | **T0 (auto)** — deletes expired rows only | Skipped cleanly when pg_cron absent. |
| `audit-log-retention` (existing, reaffirmed) | `sql/014_audit_log.sql` | daily 00:15 UTC | T0 | 90-day purge. |
| **MDS3 refresh (future — Passkey Ultra)** | `src/lib/auth/fido-mds.ts` `refreshMdsBlob()` | daily at 03:00 UTC (recommended) | T1 — needs FIDO root cert verification before auto-enabling | Static AAGUID allow-list is authoritative until full JWT verification lands. |
| **Preload manifest rebuild (future — Task #6)** | `src/app/api/jobs/preload-manifest/route.ts` GET-per-user (now); future POST rebuild-all endpoint | T1 — proposed daily 04:00 UTC | Low cost, deterministic — good T0 candidate once stable. |
| **OpenAPI client regen (Task #9)** | `scripts/generate-api-client.mjs` | post-deploy | **T1** — committed output reviewed in PR | Regenerate when `src/lib/api/openapi.ts` changes. |
| **3D asset optimize (Task #6)** | `scripts/optimize-3d-assets.mjs` | pre-deploy CI | **T0** — deterministic compression | ~15-45s CI overhead; idempotent. |

### 17.2 New DR drills

- `disaster-recovery.sh` should exercise `cleanup_expired_passkey_challenges()` as part of the monthly DR drill. Add:
  ```
  psql -c "SELECT public.cleanup_expired_passkey_challenges();"
  ```
  to the drill script's SQL phase.

### 17.3 Agent hooks

- **Session revoke incident response (Task #4)**: when a parent's `auth.sessions` count exceeds a threshold (e.g. >20 active sessions), fire a T1 alert so an operator can review for account takeover. Session dashboard already exposes the data; alerting is a separate pipeline.
- **Failed passkey verification alerting (Task #3)**: Sentry rule on `PASSKEY_VERIFICATION_FAILED` exceeding 5/hour from a single IP ⇒ T1 alert.
- **PgAudit log volume (Task #5)**: monitor log volume (Supabase log-retention). If daily volume > 5 GB, T1 operator should tighten `pgaudit.log` to `'write'` only.
- **Offline queue depth (Task #10)**: browsers report queue depth via `wireOfflineReplay`'s `onDrainComplete` callback. Sentry can ingest a breadcrumb; if `queued > 100` at drain time, that's a product incident (server likely rejecting many writes).

### 17.4 Emergent automation opportunities

| Opportunity | Trigger | Playbook |
|---|---|---|
| Auto-revoke passkeys with counter regression | Authenticator counter decreased (replay attack signal) | T0 revoke credential + T1 notify user |
| Auto-rotate demo-role deny policies | Phase 6 adds new tables; drift between 019 and new schema | T1 `IF NOT EXISTS` re-run of 019 |
| Auto-prune preload manifest cache | Children's recent-7d activity > 3σ from typical | T0 refresh manifest for affected parent |
| Session dashboard anomaly score | Sessions from >3 countries in <24h | T1 surface to the parent via email |

---

## Phase 5 Next-10 automation (April 22, 2026)

### OAuth (Task 11)

| Automatable | Mechanism | Cadence |
|---|---|---|
| Detect stale linked identity | `supabase.auth.getUserIdentities()` returns the identity but subsequent fetches return 401 — log an `oauth.link_failed` row and auto-unlink after 3 consecutive failures | Per sign-in attempt |
| `auth_events` anomaly sweep | Admin query: `event_type IN ('oauth.unlinked', 'oauth.link_failed') AND count > 5 per parent in 7d` | Weekly cron candidate |
| Audit-log retention | pg_cron job `purge_auth_events_180d` at 03:17 UTC | Daily (wired) |
| Alert on first sign-in from new provider | Email parent "you just signed in with {provider} for the first time" | Per successful sign-in (hook into callback logAuthEvent) |

### MFA (Task 12)

| Automatable | Mechanism | Cadence |
|---|---|---|
| Low-backup-code warning | When `remainingBackupCodes(parentId) <= 2`, email the parent "regenerate your backup codes" | Per-verify hook |
| Dormant-factor prune | Factors with `status='unverified'` older than 24h auto-unenrolled | Daily cron candidate |
| `mfa.challenged` failure rate | Admin dashboard: failures per hour per parent — auto-lock account at 10 in 1h | Real-time (rate-limit middleware) |

### Realtime (Task 13)

| Automatable | Mechanism | Cadence |
|---|---|---|
| Publication drift detector | CI job: `SELECT * FROM pg_publication_tables WHERE pubname='supabase_realtime'` vs expected list in `sql/024` | Weekly workflow |
| Realtime connection count alert | Supabase Dashboard → Realtime metrics → Vercel log drain at >N concurrent subscribers per parent | On-demand |

### Dunning (Task 14)

| Automatable | Mechanism | Cadence |
|---|---|---|
| Daily dunning run | `/api/cron/dunning` at 10:15 UTC, advances stages + sends emails | Daily (wired) |
| Recovery detection | `invoice.payment_succeeded` webhook auto-clears `dunning_*` + restores `dunning_tier_before` | Real-time |
| Demoted-parent alert to admin | When `dunning_stage = 3`, write an admin-visible row into `audit_log` via application layer | On-demand |
| Win-back coupon rotation | 30-day `WELCOME50` expiry; auto-cycle to `COMEBACK2026` via Stripe API | Quarterly cron candidate |

### OpenTelemetry (Task 15)

| Automatable | Mechanism | Cadence |
|---|---|---|
| P95 latency budget alerts | Sentry alerts on p95 `stripe.webhook`, `progress.write`, `ai.generate.content` breaching thresholds | Real-time |
| Span sampling tuning | `tracesSampleRate` is 0.1 in prod; auto-tune based on daily trace volume vs Sentry quota | Weekly review |
| OTLP endpoint health probe | Simple probe: create + immediately close a span at startup; fail deploy if it errors | Per deploy |

### Sparky contextual hints (Task 16)

| Automatable | Mechanism | Cadence |
|---|---|---|
| Hint efficacy analytics | Track `hintVisible`+clicked vs dismissed counters, correlate with lab/game completion; tune `stallMs` per age band | Monthly review |
| Claude token burn alert | Daily cost export from Anthropic → alert if `/api/ai/guide` guide turns exceed budget | Daily |
| Hint content safety filter | Post-filter hint text through a regex + LLM content-safety classifier before showing | Per-hint (in-flight) |

### i18n (Task 17)

| Automatable | Mechanism | Cadence |
|---|---|---|
| Translation regeneration | `npm run translate:i18n` on every PR that touches `messages/en.json` | CI job candidate |
| Translation diff review | Post the before/after translation diff as a PR comment | Per PR |
| Missing-key detector | CI script: union of all `t('...')` call sites vs en.json keys — fail CI on drift | Per PR |

### BatchedMesh (Task 18)

| Automatable | Mechanism | Cadence |
|---|---|---|
| Visual regression on toggle | Playwright screenshot diff between `BATCHED_COCKPIT=on` vs `off`; fail CI if > 0.01 pixel diff | Per PR (after migration) |
| Draw-call count regression | R3F devtools export; alert if draw calls grow > 5% between PRs | Per PR |
| Frame time capture | Dev overlay `showPerfStats` in CI — log median frametime per route | On-demand |

### CI pipeline (Task 19)

| Automatable | Mechanism | Cadence |
|---|---|---|
| Auto-raise Lighthouse budgets | When a PR's perf score is stable over 3 runs and exceeds the budget ceiling, prompt to raise the floor | On request |
| Stale workflow artifact cleanup | GitHub Actions artifact retention is 14d; extend to 30d for lighthouse-report if SLO review requires it | Operator toggle |
| Flaky-test detector | Aggregate retry count across Playwright runs; auto-tag `@flaky` on tests retried ≥ 3 times in 7 days | Weekly cron candidate |

### XState (Task 20)

| Automatable | Mechanism | Cadence |
|---|---|---|
| Machine test coverage | Every new machine should ship with a `.spec.ts` in `tests/unit/state-machines/` — enforce via CI fail on coverage drop | Per PR |
| State-history snapshot | Optionally serialize machine context into Sentry scope on errors to replay state at crash | Opt-in per hook |
| Stately.ai visualization export | `npm run xstate:export` — generate diagram SVGs for each machine into `docs/state-machines/` | Monthly or on machine change |

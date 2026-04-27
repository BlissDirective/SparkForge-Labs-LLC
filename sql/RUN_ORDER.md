# SparkForge SQL -- Run Order

Run these SQL files **in order** in the Supabase SQL Editor (Dashboard > SQL Editor > New Query).

Each file should be copy-pasted into a new query and executed individually. Wait for each to complete before running the next.

---

## Core Files (Run First, In Order)

These are required for every SparkForge deployment.

| Order | File | Status | Description |
|-------|------|--------|-------------|
| 1 | `001_schema.sql` | ACTIVE | Creates all 9 database tables (parents, children, content, progress, badges, child_badges, content_queue, sessions, prompt_history) |
| 2 | `001a_indexes.sql` | ACTIVE | Creates 14 performance indexes |
| 3 | `002_rls.sql` | ACTIVE | Enables Row Level Security on all tables and creates access policies |
| 4 | `003_functions.sql` | ACTIVE | Creates database functions (updated_at triggers, daily/weekly resets, COPPA cleanup, lab progress calculator) |
| 5 | `004_badges_seed.sql` | ACTIVE | Seeds 68 badge definitions across 9 categories. Uses ON CONFLICT for idempotent re-runs. Merged canonical version (Audit Batch 3). |
| 6 | `005_content_seed.sql` | ACTIVE | Seeds 6 starter content items for Labs 1-3 (lessons, quiz, spark fact). Uses richer quiz format with correct_index + explanation + hint. ON CONFLICT for idempotent re-runs. Merged canonical version (Audit Batch 3). |
| 7 | `005_verify.sql` | ACTIVE | Verification queries to confirm setup (run after seeds, check output) |
| 8 | `006_cron.sql` | ACTIVE | Sets up daily COPPA cleanup + streak-reset cron jobs (**Supabase Pro plan only** -- skip on free plan). Canonical cron file (Audit Batch 3). |

## Stage-Specific Files (Run When You Reach That Stage)

These add schema/data needed by specific stages. Run them **after** all core files, and only when you reach the corresponding stage in development.

| Order | File | Stage | Description |
|-------|------|-------|-------------|
| 9 | `schema-stage8.sql` | Stage 8 | Stripe & subscription fields + time limit columns. Safe to re-run (IF NOT EXISTS). Run before Stage 8 Part 1. |
| 10 | `schema-stage8-dashboard-fn.sql` | Stage 8 | Parent dashboard aggregation function (S8-HIGH-002 fix). Run after `schema-stage8.sql`. |
| 11 | `schema-stage9.sql` | Stage 9 | Agent run logging, admin flag, indexes. Safe to re-run (IF NOT EXISTS). Run before Stage 9 Part 1. |
| 12 | `stage9-seed-content.sql` | Stage 9 | 300 seed content items (150 lessons + 90 quizzes + 60 facts) across all 10 Labs. Run after `schema-stage9.sql`. |

## Migrations (Run As Needed)

| File | Purpose |
|------|---------|
| `migrate_subscription_status.sql` | Consolidates subscription_status CHECK constraint (CRIT-004). Canonical values: none, active, past_due, canceled, trialing, paused. Default: 'none'. Run if upgrading from older schema. |

## Phase 1 Audit Migrations (Final-Audit_04-15-2026.md)

Run **in order** after the stage-specific files above. These resolve Critical security findings.

| Order | File | Audit Finding | Description |
|-------|------|---------------|-------------|
| 13 | `008_subscription_events_processed.sql` | PAY-CRIT-001 (6B) | Adds `processed BOOLEAN` + `processed_at TIMESTAMPTZ` to `subscription_events`. Backfills existing rows as processed. Webhook uses these for replay protection. |
| 14 | `009_subscription_events_split.sql` | DB-CRIT-001 (4C) | Creates `subscription_events_detail` (admin-only RLS) for raw Stripe payload. Migrates existing `data` column. Drops `data` from metadata table. Adds parent SELECT policy. **Must follow 008.** |
| 15 | `010_rls_belt_and_suspenders.sql` | DB-CRIT-002 (5C) | Defensive: re-asserts `ENABLE ROW LEVEL SECURITY` on every protected table. Idempotent — safe to re-run. Emits warnings for any unprotected public table. |
| n/a | `verify_rls.sql` | DB-CRIT-002 (5C) | Verification script (NOT a migration). Run via psql or `supabase db execute -f sql/verify_rls.sql` to confirm RLS coverage. Throws exception if any public table lacks RLS or has no policies. Invoked by CI on every PR. |

## Phase 3 Audit Migrations (Final-Audit_04-15-2026.md)

Run after the Phase 2 migrations (011–015). These resolve Medium-severity findings.

| Order | File | Audit Finding | Description |
|-------|------|---------------|-------------|
| 23 | `016_perf_indexes.sql` | DB-MED-001 (B) | Composite performance indexes matching actual query shapes in `tierCheck.ts`: `idx_prompt_history_child_created`, partial `idx_progress_child_completed_at` (WHERE completed=true), `idx_subscription_events_parent_created`. Idempotent. Ends with DO $$ verification block. |
| 24 | `017_subscription_events_fk_cleanup.sql` | DB-MED-002 (B) | Replaces the implicit `ON DELETE NO ACTION` on `subscription_events.parent_id` with `ON DELETE SET NULL`, unblocking parent deletion (PAY-MED-003 flow) while preserving audit history. Adds `cleanup_orphaned_subscription_events()` SECURITY DEFINER function and a daily pg_cron job (00:20 UTC) that deletes NULL-parent rows older than 90 days. Skips cleanly on Supabase Free (no pg_cron). |
| 25 | `018_content_slug_enforce.sql` | DB-MED-003 (B) | Backfills NULL/empty slugs via a new `slugify(TEXT)` helper, then `ALTER COLUMN slug SET NOT NULL DEFAULT ''`. Adds a BEFORE INSERT trigger (`trg_content_auto_slug`) that auto-generates `slugify(title)||'-'||<8-hex>` when the caller omits slug. Idempotent. Post-apply DO block verifies 0 null/empty rows + NOT NULL + trigger installed. |

## Phase 5 Audit Migrations (Final-Audit_04-15-2026.md)

Phase 5 First 10 enhancements. Run after Phase 3 migrations (018).

| Order | File | Task | Description |
|-------|------|------|-------------|
| 26 | `019_demo_role_rls.sql` | #2 AUTH-ENH Signed Demo Tokens (Max) | Adds RESTRICTIVE `demo_deny_*` RLS policies on all 9 user-facing tables + Stage 8/9 tables (subscription_events, subscription_events_detail, agent_runs, audit_log). Blocks ALL writes from anonymous JWT sessions (`auth.jwt() ->> 'is_anonymous' = 'true'`). Defense-in-depth alongside new `requireWriteAccess()` API helper. Idempotent. Post-apply DO block verifies every required table carries a `demo_deny_*` RESTRICTIVE policy. |
| 27 | `020_passkey_credentials.sql` | #3 AUTH-ENH Passkey / WebAuthn (Ultra) | Creates `passkey_credentials` + `passkey_challenges` tables for FIDO2/WebAuthn. RLS: SELECT-own for parents, RESTRICTIVE write-deny on both tables (writes done via SECURITY DEFINER server code only). `demo_deny_passkey_credentials` mirrors 019. `cleanup_expired_passkey_challenges()` SECURITY DEFINER function + pg_cron job every 10 min (skipped cleanly when pg_cron absent). |
| 28 | `021_enable_pgaudit.sql` | #5 DB-ENH PgAudit (Min) | `CREATE EXTENSION IF NOT EXISTS pgaudit;` + `ALTER DATABASE postgres SET pgaudit.log = 'write, role, ddl'`. Output goes to Postgres logs (operator ships to SIEM/log backend). **Requires Supabase Pro plan** — on Free tier the CREATE EXTENSION call fails with permissions error (migration rolls back cleanly). Retention for the existing `audit_log` table is already handled by 014_audit_log.sql (90-day pg_cron purge). |

## COPPA Production Readiness Migrations

Run after Phase 5 migrations. These tighten compliance for the for-sale launch.

| Order | File | Task | Description |
|-------|------|------|-------------|
| 29 | `026_parents_coppa_consent_age_band.sql` | COPPA-PRD-B | Adds nullable `parents.coppa_consent_age_band TEXT` with CHECK constraint for `'A' \| 'B' \| 'C' \| 'mixed'`. Records the youngest-child age band the parent acknowledged at consent time. Required by /api/auth/consent for new VPC records. NULL on legacy rows; no backfill (no pre-launch prod accounts). Idempotent — safe to re-run. |

## Archived Files (Do NOT Run)

These have been merged into canonical files above. Kept for historical reference only.

| File | Superseded By | Reason |
|------|---------------|--------|
| `002_badges_ARCHIVED.sql` | `004_badges_seed.sql` | Duplicate badge seed with wrong rarity values and stale game count (28 instead of 35). Merged in Audit Batch 3. |
| `003_seed_content_ARCHIVED.sql` | `005_content_seed.sql` | Duplicate content seed with richer quiz format. Merged in Audit Batch 3. |
| `004_cron_ARCHIVED.sql` | `006_cron.sql` | Only had coppa-cleanup; 006 has both coppa-cleanup + streak-reset. Archived in Audit Batch 3. |

---

## Verification

After running all core files (1-8), execute the queries in `005_verify.sql` to confirm:

```sql
-- Should return 9 tables
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' ORDER BY table_name;

-- Should return 68 badges (7+7+10+10+10+5+5+8+6)
SELECT category, COUNT(*) FROM badges GROUP BY category ORDER BY category;

-- Should return 6 starter content items
SELECT world, type, target_age_band, title FROM content
WHERE status = 'published' ORDER BY world, sort_order;

-- Should show RLS enabled on all tables
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public' ORDER BY tablename;

-- Verify onboarding_complete column exists
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'parents' AND column_name = 'onboarding_complete';
```

## Expected Results

- **9 tables:** badges, child_badges, children, content, content_queue, parents, progress, prompt_history, sessions
- **68 badges** across 9 categories
- **6 starter content** items (Labs 1-3)
- All tables with `rowsecurity = true`
- `onboarding_complete` column exists with default `false`

## Notes

- The database uses `world` as the column name (not `lab`). The UI displays "Lab" but the DB stores "world".
- `parents.subscription_status` defaults to `'none'` after migration (was `'active'` in original schema -- see `migrate_subscription_status.sql`).
- `006_cron.sql` requires Supabase Pro plan (`pg_cron` extension). On free plan, manually run `SELECT cleanup_old_prompts();` periodically.
- Badge seeds and content seeds use ON CONFLICT DO UPDATE, so they are safe to re-run without creating duplicates.
- "Complete Collection" badge requires 35 games (all games in platform).
- "Ultimate Scholar" badge requires criteria_value=68 (all 67 other badges + itself).

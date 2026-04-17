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

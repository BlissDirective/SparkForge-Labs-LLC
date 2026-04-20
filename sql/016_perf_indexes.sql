-- ════════════════════════════════════════════════════════════════
-- 016_perf_indexes.sql — DB-MED-001 (Opt B)
-- ════════════════════════════════════════════════════════════════
-- Composite indexes matching the actual query shapes emitted by the
-- tier-check helpers (src/middleware/tierCheck.ts) and the admin
-- subscription-events listing. Adds no new columns; does not backfill.
--
-- Index analysis (query → existing → new):
--
--   1. checkPromptLimit()
--      SELECT ... FROM prompt_history
--        WHERE child_id = $1 AND created_at >= $today
--      Existing: idx_prompt_history_child(child_id) and
--                idx_prompt_history_created(created_at) — NEITHER is
--                a composite, so Postgres merges two bitmap scans.
--      New: idx_prompt_history_child_created(child_id, created_at DESC)
--
--   2. checkGameLimit()
--      SELECT ... FROM progress
--        WHERE child_id = $1 AND completed = true AND completed_at >= $weekAgo
--      Existing: idx_progress_completed(child_id, completed) — no date.
--      New: idx_progress_child_completed_at (partial index on completed=true)
--            → rows scanned ≈ 1–7 per child on Free tier instead of
--              "all rows ever completed for this child".
--
--   3. checkTimeLimit()
--      SELECT duration_seconds FROM sessions
--        WHERE child_id = $1 AND started_at >= $today
--      Existing: idx_sessions_dates(child_id, started_at) — ALREADY
--                perfect. No new index.
--
--   4. Admin subscription-events listing
--      SELECT ... FROM subscription_events
--        WHERE parent_id = $1 ORDER BY created_at DESC
--      Existing: REFERENCES parents(id) + the UNIQUE on stripe_event_id.
--                No index on parent_id alone; FK does NOT auto-index in Postgres.
--      New: idx_subscription_events_parent_created
--           (parent_id, created_at DESC)
--           → supports both the admin per-parent lookup AND the cleanup
--             job that DB-MED-002 will add.
--
-- Safety:
--   - All indexes are IF NOT EXISTS → idempotent
--   - Not CREATE INDEX CONCURRENTLY because Supabase SQL Editor wraps
--     every statement in an implicit transaction and CONCURRENTLY
--     cannot run inside one. Tables are small enough that a brief
--     write lock is acceptable. If you need zero-downtime indexing on
--     a larger dataset, run via `supabase db execute` or psql
--     directly.
--
-- Ref: Final-Audit_04-15-2026.md §DB-MED-001

CREATE INDEX IF NOT EXISTS idx_prompt_history_child_created
  ON prompt_history(child_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_progress_child_completed_at
  ON progress(child_id, completed_at DESC)
  WHERE completed = true;

CREATE INDEX IF NOT EXISTS idx_subscription_events_parent_created
  ON subscription_events(parent_id, created_at DESC)
  WHERE parent_id IS NOT NULL;

-- Verification: print the indexes we expect to exist.
DO $$
DECLARE
  missing TEXT[] := ARRAY[]::TEXT[];
  expected TEXT[] := ARRAY[
    'idx_prompt_history_child_created',
    'idx_progress_child_completed_at',
    'idx_subscription_events_parent_created'
  ];
  idx TEXT;
BEGIN
  FOREACH idx IN ARRAY expected LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = idx) THEN
      missing := array_append(missing, idx);
    END IF;
  END LOOP;
  IF array_length(missing, 1) > 0 THEN
    RAISE EXCEPTION '016_perf_indexes: missing indexes: %', missing;
  ELSE
    RAISE NOTICE '016_perf_indexes: all 3 composite indexes present.';
  END IF;
END $$;

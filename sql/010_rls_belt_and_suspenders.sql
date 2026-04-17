-- ════════════════════════════════════════════════════
-- Migration 010: RLS Belt-and-Suspenders Patch
-- Final-Audit 04-15-2026 finding DB-CRIT-002 (Option C)
--
-- Audit completed during Phase 1 confirms every existing user-facing
-- table already has RLS enabled and at least one policy:
--
--   parents                       (002_rls.sql)
--   children                      (002_rls.sql)
--   content                       (002_rls.sql)
--   progress                      (002_rls.sql)
--   badges                        (002_rls.sql)
--   child_badges                  (002_rls.sql)
--   content_queue                 (002_rls.sql)
--   sessions                      (002_rls.sql)
--   prompt_history                (002_rls.sql)
--   subscription_events           (schema-stage8.sql)
--   subscription_events_detail    (009_subscription_events_split.sql)
--   agent_runs                    (schema-stage9.sql)
--
-- This migration is DEFENSIVE: it re-asserts ENABLE ROW LEVEL SECURITY on
-- every table above using the IF EXISTS guard. This protects against:
--   1. A future DBA running ALTER TABLE ... DISABLE ROW LEVEL SECURITY
--      manually and forgetting to re-enable.
--   2. A future migration that recreates a table and drops the RLS state.
--   3. Provisioning a fresh Supabase project from these migrations
--      where for any reason the schema-stage8/9 RLS DO blocks didn't
--      execute (e.g. permission issue on a managed plan).
--
-- After running this migration, the verify_rls.sql script can be invoked
-- to confirm cluster-wide RLS coverage.
-- ════════════════════════════════════════════════════

DO $$
DECLARE
  tbl TEXT;
  protected_tables TEXT[] := ARRAY[
    'parents',
    'children',
    'content',
    'progress',
    'badges',
    'child_badges',
    'content_queue',
    'sessions',
    'prompt_history',
    'subscription_events',
    'subscription_events_detail',
    'agent_runs'
  ];
BEGIN
  FOREACH tbl IN ARRAY protected_tables LOOP
    -- Only act if the table actually exists (some Supabase projects may
    -- be on partial migration sets). Skip silently if not present.
    IF EXISTS (
      SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
       WHERE n.nspname = 'public' AND c.relname = tbl AND c.relkind = 'r'
    ) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
    END IF;
  END LOOP;
END $$;

-- ── Inline self-check: emit a warning for any unprotected table ───────
-- (Cannot RAISE EXCEPTION here — would block migration apply. The
-- verify_rls.sql script is the gating check used in CI.)
DO $$
DECLARE
  unprotected TEXT;
BEGIN
  FOR unprotected IN
    SELECT c.relname
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
     WHERE c.relkind = 'r'
       AND n.nspname = 'public'
       AND c.relrowsecurity = false
  LOOP
    RAISE WARNING 'Table public.% has RLS DISABLED — consider adding to migration 010', unprotected;
  END LOOP;
END $$;

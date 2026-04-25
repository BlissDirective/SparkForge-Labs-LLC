-- ════════════════════════════════════════════════════════════════
-- 017_subscription_events_fk_cleanup.sql — DB-MED-002 (Opt B)
-- ════════════════════════════════════════════════════════════════
-- Tightens the subscription_events → parents reference:
--
--   Before: parent_id UUID REFERENCES parents(id)
--           (implicit ON DELETE NO ACTION — parent deletion would fail)
--   After:  parent_id UUID REFERENCES parents(id) ON DELETE SET NULL
--           (parent deletion nulls the FK; audit history preserved)
--
-- Also adds a 90-day cleanup pg_cron job for rows where parent_id is
-- NULL (either orphaned by deletion OR the webhook arrived before the
-- parents row was linked). 90 days mirrors the audit_log retention
-- window from DB-HIGH-002.
--
-- Safe to re-run: looks up the current FK by constraint name before
-- dropping, only creates the cron job if pg_cron is available.
--
-- Ref: Final-Audit_04-15-2026.md §DB-MED-002

-- ─── 1. Drop the existing FK (if it exists under its auto-generated name) ───
--
-- Postgres auto-names the constraint subscription_events_parent_id_fkey
-- when declared inline via `REFERENCES parents(id)`. We look it up
-- generically in case a prior deployment renamed it.
DO $$
DECLARE
  fk_name TEXT;
BEGIN
  SELECT conname INTO fk_name
  FROM pg_constraint
  WHERE conrelid = 'subscription_events'::regclass
    AND contype = 'f'
    AND confrelid = 'parents'::regclass
  LIMIT 1;

  IF fk_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE subscription_events DROP CONSTRAINT %I', fk_name);
    RAISE NOTICE '017: dropped existing FK %', fk_name;
  ELSE
    RAISE NOTICE '017: no existing subscription_events → parents FK found';
  END IF;
END $$;

-- ─── 2. Re-add with ON DELETE SET NULL ───
ALTER TABLE subscription_events
  ADD CONSTRAINT subscription_events_parent_id_fkey
  FOREIGN KEY (parent_id) REFERENCES parents(id) ON DELETE SET NULL;

-- ─── 3. Create the cleanup function unconditionally ───
--
-- Always present so a Supabase Free-tier operator can invoke
--   SELECT cleanup_orphaned_subscription_events();
-- manually (or wire it into an external scheduler). The pg_cron
-- schedule in step 4 just automates the invocation on Pro.
CREATE OR REPLACE FUNCTION cleanup_orphaned_subscription_events()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  deleted INTEGER;
BEGIN
  DELETE FROM subscription_events
   WHERE parent_id IS NULL
     AND created_at < now() - interval '90 days';
  GET DIAGNOSTICS deleted = ROW_COUNT;
  RETURN deleted;
END
$fn$;

-- ─── 4. Schedule the 90-day cleanup (pg_cron) ───
--
-- Skipped cleanly on Supabase Free. Runs daily at 00:20 UTC
-- (between the existing audit-log-retention at 00:15 and any other
-- housekeeping). Unschedules any prior version by name first, so
-- re-running the migration doesn't leave duplicate cron jobs.
DO $$
DECLARE
  has_cron BOOLEAN;
BEGIN
  SELECT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron')
    INTO has_cron;

  IF NOT has_cron THEN
    RAISE NOTICE '017: pg_cron not installed — skipping cleanup schedule. '
                 'Free-tier Supabase: invoke cleanup_orphaned_subscription_events() manually.';
  ELSE
    PERFORM cron.unschedule(jobid)
      FROM cron.job
      WHERE jobname = 'subscription-events-orphan-cleanup';

    PERFORM cron.schedule(
      'subscription-events-orphan-cleanup',
      '20 0 * * *',                       -- 00:20 UTC daily
      'SELECT cleanup_orphaned_subscription_events();'
    );

    RAISE NOTICE '017: cron job "subscription-events-orphan-cleanup" scheduled';
  END IF;
END $$;

-- ─── 4. Verification ───
DO $$
DECLARE
  fk_action CHAR;
BEGIN
  SELECT confdeltype INTO fk_action
  FROM pg_constraint
  WHERE conrelid = 'subscription_events'::regclass
    AND contype = 'f'
    AND confrelid = 'parents'::regclass
  LIMIT 1;

  -- Postgres encodes ON DELETE SET NULL as 'n'
  IF fk_action <> 'n' THEN
    RAISE EXCEPTION '017: FK was not recreated with ON DELETE SET NULL '
                    '(confdeltype=%), aborting', fk_action;
  END IF;
  RAISE NOTICE '017: verification PASSED — FK has ON DELETE SET NULL';
END $$;

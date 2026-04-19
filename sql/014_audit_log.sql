-- ════════════════════════════════════════════════════
-- DB-HIGH-002 (Option B): Database-level audit logging
--
-- Captures every INSERT/UPDATE/DELETE on sensitive tables into a
-- generic `audit_log` table via a single trigger function. Survives
-- application-layer bypasses (service-role writes are still logged
-- because the trigger runs server-side, not in app code).
--
-- Critical tables covered:
--   parents              — subscription changes, admin promotions,
--                          email verification, profile edits
--   children             — creation, archive, profile updates
--   content              — lifecycle (draft/published/rejected),
--                          updated_by / update_reason (DB-HIGH-001)
--   content_queue        — admin review actions
--   subscription_events  — billing timeline
--
-- High-churn, low-forensic-value tables (progress, sessions, badges)
-- are intentionally NOT covered. They can be added later with a
-- single additional trigger line each.
--
-- Access model:
--   SELECT: parent with is_admin=true (via RLS policy)
--   INSERT/UPDATE/DELETE: only the SECURITY DEFINER trigger function
--     and the service-role key. No RLS policy for writes → normal
--     session tokens cannot tamper with the audit log.
--
-- Retention: a daily pg_cron job purges rows older than 90 days.
-- ════════════════════════════════════════════════════

-- ─── 1. Table ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS audit_log (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name     TEXT NOT NULL,
  row_id         TEXT NOT NULL,
  action         TEXT NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
  old_data       JSONB,
  new_data       JSONB,
  performed_by   UUID REFERENCES parents(id) ON DELETE SET NULL,
  performed_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE audit_log IS
  'DB-HIGH-002: immutable audit trail for sensitive-table mutations. '
  'Populated exclusively by the audit_trigger() function. 90-day '
  'retention via pg_cron.';

-- Lookup by (table, row) — the common forensic query.
CREATE INDEX IF NOT EXISTS idx_audit_log_table_row
  ON audit_log (table_name, row_id, performed_at DESC);

-- Lookup by actor — "what did admin X do?"
CREATE INDEX IF NOT EXISTS idx_audit_log_performer
  ON audit_log (performed_by, performed_at DESC)
  WHERE performed_by IS NOT NULL;

-- Retention scan index.
CREATE INDEX IF NOT EXISTS idx_audit_log_performed_at
  ON audit_log (performed_at);

-- ─── 2. RLS ───────────────────────────────────────

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Admin read-only. No INSERT/UPDATE/DELETE policies → only
-- SECURITY DEFINER trigger + service-role can write.
DROP POLICY IF EXISTS audit_log_admin_read ON audit_log;
CREATE POLICY audit_log_admin_read
  ON audit_log
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM parents WHERE id = auth.uid() AND is_admin = true)
  );

-- ─── 3. Trigger function ──────────────────────────

CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
DECLARE
  performer UUID;
  subject_id TEXT;
BEGIN
  -- Supabase injects the JWT subject as request.jwt.claim.sub on
  -- PostgREST calls. Service-role / trigger-only paths have no JWT
  -- subject and resolve to NULL, which is the correct "system
  -- change" marker in audit_log.
  BEGIN
    performer := NULLIF(current_setting('request.jwt.claim.sub', true), '')::uuid;
  EXCEPTION WHEN OTHERS THEN
    performer := NULL;
  END;

  -- All covered tables have `id` as the PK — stringify it for the
  -- polymorphic row_id column.
  IF TG_OP = 'DELETE' THEN
    subject_id := OLD.id::text;
  ELSE
    subject_id := NEW.id::text;
  END IF;

  INSERT INTO audit_log (table_name, row_id, action, old_data, new_data, performed_by)
  VALUES (
    TG_TABLE_NAME,
    subject_id,
    TG_OP,
    CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    performer
  );

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

COMMENT ON FUNCTION audit_trigger() IS
  'DB-HIGH-002: Generic AFTER INSERT/UPDATE/DELETE trigger. Writes '
  'to audit_log. SECURITY DEFINER bypasses RLS so audit rows always '
  'land regardless of the originating session role.';

-- ─── 4. Attach to covered tables ──────────────────

DROP TRIGGER IF EXISTS audit_trigger_parents ON parents;
CREATE TRIGGER audit_trigger_parents
  AFTER INSERT OR UPDATE OR DELETE ON parents
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

DROP TRIGGER IF EXISTS audit_trigger_children ON children;
CREATE TRIGGER audit_trigger_children
  AFTER INSERT OR UPDATE OR DELETE ON children
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

DROP TRIGGER IF EXISTS audit_trigger_content ON content;
CREATE TRIGGER audit_trigger_content
  AFTER INSERT OR UPDATE OR DELETE ON content
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

DROP TRIGGER IF EXISTS audit_trigger_content_queue ON content_queue;
CREATE TRIGGER audit_trigger_content_queue
  AFTER INSERT OR UPDATE OR DELETE ON content_queue
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

DROP TRIGGER IF EXISTS audit_trigger_subscription_events ON subscription_events;
CREATE TRIGGER audit_trigger_subscription_events
  AFTER INSERT OR UPDATE OR DELETE ON subscription_events
  FOR EACH ROW EXECUTE FUNCTION audit_trigger();

-- ─── 5. Retention (pg_cron required) ──────────────
-- 90-day retention: purges at 00:15 UTC daily (after
-- coppa-cleanup + streak-reset in 006_cron.sql). Skip this block on
-- Supabase Free where pg_cron is unavailable — you can run the
-- DELETE manually on the same schedule via external scheduler.

DO $body$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'audit-log-retention') THEN
      PERFORM cron.unschedule('audit-log-retention');
    END IF;
    PERFORM cron.schedule(
      'audit-log-retention',
      '15 0 * * *',
      'DELETE FROM audit_log WHERE performed_at < NOW() - INTERVAL ''90 days'''
    );
  END IF;
END
$body$;

-- ════════════════════════════════════════════════════════════════
-- 021_enable_pgaudit.sql — DB-ENH PgAudit (Min)
-- Phase 5 task #5 · Final-Audit_04-15-2026.md
-- ════════════════════════════════════════════════════════════════
-- Enables the pgaudit extension (Supabase Pro plan required) and
-- configures it to log every WRITE statement (INSERT/UPDATE/DELETE/
-- TRUNCATE). Output lands in the Supabase Postgres logs — operator
-- ships those to whatever SIEM/log backend is in place.
--
-- Min scope per Final-Audit_04-15-2026.md §3b DB-ENH-XXX Min tier:
--   - write auditing only (no read auditing — too much volume)
--   - no structured JSON shipping
--   - no hash chaining / tamper-evidence
--   - no anomaly detection
-- These are upgrade paths for Recommended / Max / Ultra tiers later.
--
-- PREREQUISITE: Supabase Pro plan. On Free tier the CREATE EXTENSION
-- call below will fail with a permissions error and the rest of the
-- file will roll back; this is expected and safe (the migration
-- remains idempotent — re-run on Pro and it will succeed).
-- ════════════════════════════════════════════════════════════════

BEGIN;

-- 1. Enable the extension. Supabase runs pgaudit at the cluster
--    level; we still need CREATE EXTENSION for the function + GUC
--    registration in THIS database.
CREATE EXTENSION IF NOT EXISTS pgaudit;

-- 2. Configure what gets audited. The supabase_admin role owns the
--    postgresql.conf equivalent; we use ALTER DATABASE so the setting
--    follows this DB even if the instance is forked.
--
--    Classes (from https://github.com/pgaudit/pgaudit/blob/master/README.md):
--      READ         SELECT, COPY FROM  (verbose — skipped at Min)
--      WRITE        INSERT, UPDATE, DELETE, TRUNCATE, COPY TO
--      FUNCTION     function call
--      ROLE         CREATE/ALTER/DROP ROLE, GRANT, REVOKE
--      DDL          DDL not covered above
--      MISC         DISCARD, FETCH, CHECKPOINT, VACUUM, etc.
--
--    Min: WRITE + ROLE + DDL. Covers the blast-radius cases without
--    log-volume pain.

ALTER DATABASE postgres SET pgaudit.log = 'write, role, ddl';
ALTER DATABASE postgres SET pgaudit.log_catalog = OFF;
ALTER DATABASE postgres SET pgaudit.log_client = OFF;
ALTER DATABASE postgres SET pgaudit.log_level = 'log';
ALTER DATABASE postgres SET pgaudit.log_parameter = ON;
ALTER DATABASE postgres SET pgaudit.log_relation = OFF;
ALTER DATABASE postgres SET pgaudit.log_statement_once = OFF;

COMMIT;

-- Post-apply verification (run as a separate SELECT after commit).
-- NOTE: The setting only takes effect on new sessions. Existing
-- connections (e.g. Supabase's pooler) may still log at the old
-- level until they recycle. Run once more after rolling a new
-- pooled connection to confirm.

-- Example verify query (paste into SQL Editor after running the migration):
--   SHOW pgaudit.log;                      -- expect: 'write, role, ddl'
--   SELECT name, setting FROM pg_settings WHERE name LIKE 'pgaudit.%';

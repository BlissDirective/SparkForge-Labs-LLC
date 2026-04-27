-- Enable pg_cron for scheduled jobs (Supabase Pro plan).
-- Required by sql/006_cron.sql, sql/014_audit_log.sql (retention),
-- sql/015_pg_cron_daily_resets.sql.
CREATE EXTENSION IF NOT EXISTS pg_cron;
GRANT USAGE ON SCHEMA cron TO postgres;

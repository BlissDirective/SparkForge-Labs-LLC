-- ════════════════════════════════════════════════════
-- CRON JOB SETUP
-- NOTE: pg_cron requires Supabase Pro plan.
-- Skip on free plan — manually run SELECT cleanup_old_prompts(); instead.
-- ════════════════════════════════════════════════════

SELECT cron.schedule(
  'coppa-cleanup',
  '0 0 * * *',
  'SELECT cleanup_old_prompts();'
);

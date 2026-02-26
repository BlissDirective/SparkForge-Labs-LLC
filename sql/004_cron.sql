-- ════════════════════════════════════════════════════
-- SPARKFORGE CRON JOB (Optional — requires Supabase Pro plan)
-- On free plan, manually run: SELECT cleanup_old_prompts();
-- ════════════════════════════════════════════════════

SELECT cron.schedule(
  'coppa-cleanup',
  '0 0 * * *',
  'SELECT cleanup_old_prompts();'
);

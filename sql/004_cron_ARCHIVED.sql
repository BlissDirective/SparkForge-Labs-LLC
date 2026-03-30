-- ARCHIVED: Superseded by 006_cron.sql — see Audit Batch 3
-- This file only had coppa-cleanup. 006_cron.sql has both coppa-cleanup + streak-reset.
-- Do NOT run this file.

-- ════════════════════════════════════════════════════
-- SPARKFORGE CRON JOB (Optional — requires Supabase Pro plan)
-- On free plan, manually run: SELECT cleanup_old_prompts();
-- ════════════════════════════════════════════════════

SELECT cron.schedule(
  'coppa-cleanup',
  '0 0 * * *',
  'SELECT cleanup_old_prompts();'
);

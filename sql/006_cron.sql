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

-- HIGH-005: Reset streaks for children inactive > 24 hours
-- Runs daily at 00:05 UTC (after coppa-cleanup)
SELECT cron.schedule(
  'streak-reset',
  '5 0 * * *',
  $$
    UPDATE children
    SET streak_count = 0, streak_shield = false
    WHERE streak_count > 0
      AND streak_shield = false
      AND (
        streak_last_date IS NULL
        OR streak_last_date < (CURRENT_DATE - INTERVAL '1 day')::date
      );
  $$
);

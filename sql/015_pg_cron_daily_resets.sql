-- ════════════════════════════════════════════════════
-- DB-HIGH-003 (Option B): pg_cron daily / weekly counter resets
--
-- The `children` table has three rolling counters:
--
--   prompts_used_today     ← daily reset (Prompt Lab budget)
--   games_played_this_week ← weekly reset (tier soft-limits)
--   xp_awarded_today       ← daily reset (DAILY_XP_CAP — 012)
--
-- Previously, resets happened only in a BEFORE UPDATE trigger on
-- `children`. That works as long as the row is written at least once
-- per day — but a child who hasn't played in 2 days returns to find
-- their row stale. The app then reads yesterday's counter and has to
-- compensate with defensive "if reset_date < today then treat as 0"
-- logic scattered across route handlers.
--
-- This migration adds pg_cron scheduled jobs that actively reset
-- stale counters every day at ~00:00 UTC, so the DB is authoritative
-- and the app doesn't rely on clever reads. The BEFORE UPDATE
-- triggers remain as belt-and-suspenders — if a cron run fails, the
-- trigger still zeroes on the next UPDATE.
--
-- Three-layer defense:
--   1. pg_cron nightly reset                   (primary — this file)
--   2. BEFORE UPDATE triggers                  (003_functions.sql / 012)
--   3. App-level "reset_date >= today" guards  (xp + prompt-lab routes)
--
-- Guarded by pg_extension.extname check: skip on Supabase Free where
-- pg_cron is unavailable (app-level defence still works there).
-- ════════════════════════════════════════════════════

DO $body$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    RAISE NOTICE 'pg_cron not installed — skipping DB-HIGH-003 cron schedules. '
                 'App-level reset guards still apply.';
    RETURN;
  END IF;

  -- ─── Daily reset: prompts_used_today ──────────────
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-reset-prompts') THEN
    PERFORM cron.unschedule('daily-reset-prompts');
  END IF;
  PERFORM cron.schedule(
    'daily-reset-prompts',
    '0 0 * * *',  -- 00:00 UTC daily
    $sql$
      UPDATE children
         SET prompts_used_today = 0,
             prompts_reset_date = CURRENT_DATE
       WHERE prompts_reset_date < CURRENT_DATE;
    $sql$
  );

  -- ─── Daily reset: xp_awarded_today (012 counter) ──
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'daily-reset-xp') THEN
    PERFORM cron.unschedule('daily-reset-xp');
  END IF;
  PERFORM cron.schedule(
    'daily-reset-xp',
    '2 0 * * *',  -- 00:02 UTC daily (just after prompts)
    $sql$
      UPDATE children
         SET xp_awarded_today = 0,
             xp_reset_date = CURRENT_DATE
       WHERE xp_reset_date < CURRENT_DATE;
    $sql$
  );

  -- ─── Weekly reset: games_played_this_week ─────────
  -- Runs Monday at 00:04 UTC (after ISO week boundary).
  IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'weekly-reset-games') THEN
    PERFORM cron.unschedule('weekly-reset-games');
  END IF;
  PERFORM cron.schedule(
    'weekly-reset-games',
    '4 0 * * 1',  -- 00:04 UTC every Monday
    $sql$
      UPDATE children
         SET games_played_this_week = 0,
             games_reset_week = date_trunc('week', CURRENT_DATE)::date
       WHERE games_reset_week < date_trunc('week', CURRENT_DATE)::date;
    $sql$
  );
END
$body$;

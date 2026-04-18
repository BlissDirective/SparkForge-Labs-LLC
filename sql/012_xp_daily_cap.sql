-- ════════════════════════════════════════════════════
-- API-HIGH-003 (Option C): Server-authoritative XP + daily cap
--
-- Adds per-child counters so the /api/gamification/xp route can
-- enforce a DAILY_XP_CAP regardless of how many requests the client
-- fires. Mirrors the existing `prompts_used_today` pattern in
-- sql/001_schema.sql so the daily-reset trigger is uniform.
--
-- Semantics:
--   - xp_awarded_today  — running total of XP awarded so far today
--                         (after streak multipliers, after daily cap).
--   - xp_reset_date     — DATE the counter was last reset. A trigger
--                         flips it to CURRENT_DATE on the first UPDATE
--                         of a new day, zeroing xp_awarded_today.
--
-- Consumed by src/app/api/gamification/xp/route.ts to decide how much
-- of the requested award actually lands vs. being clamped to the cap.
-- ════════════════════════════════════════════════════

ALTER TABLE children
  ADD COLUMN IF NOT EXISTS xp_awarded_today INT NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS xp_reset_date DATE NOT NULL DEFAULT CURRENT_DATE;

COMMENT ON COLUMN children.xp_awarded_today IS
  'API-HIGH-003: running total of XP awarded today. Reset to 0 by '
  'reset_daily_xp trigger on the first UPDATE of each new day.';

COMMENT ON COLUMN children.xp_reset_date IS
  'API-HIGH-003: date xp_awarded_today was last reset. Paired with '
  'reset_daily_xp trigger.';

-- Reuses the pattern from reset_daily_prompts() in sql/003_functions.sql
CREATE OR REPLACE FUNCTION reset_daily_xp()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.xp_reset_date < CURRENT_DATE THEN
    NEW.xp_awarded_today := 0;
    NEW.xp_reset_date := CURRENT_DATE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS reset_daily_xp_trigger ON children;
CREATE TRIGGER reset_daily_xp_trigger
  BEFORE UPDATE ON children
  FOR EACH ROW EXECUTE FUNCTION reset_daily_xp();

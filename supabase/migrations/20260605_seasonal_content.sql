-- ════════════════════════════════════════════════════
-- MIGRATION: Seasonal Content Engine (Phase 9)
-- Date: 2026-06-05
-- Season activation registry + per-child seasonal progress.
-- The season / quest / item CATALOG lives in code
-- (src/lib/seasons/SeasonEngine.ts); these tables hold only
-- activation flags and per-child state.
-- ════════════════════════════════════════════════════

-- ─── Seasons (activation registry; cron toggles is_active) ───
CREATE TABLE IF NOT EXISTS seasons (
  key TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  theme TEXT NOT NULL,
  starts_on DATE NOT NULL,
  ends_on DATE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Per-child seasonal progress ───
CREATE TABLE IF NOT EXISTS season_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  season_key TEXT NOT NULL,
  currency INTEGER NOT NULL DEFAULT 0 CHECK (currency >= 0),
  quest_progress JSONB NOT NULL DEFAULT '{}'::jsonb,
  claimed_quests JSONB NOT NULL DEFAULT '[]'::jsonb,
  purchases JSONB NOT NULL DEFAULT '[]'::jsonb,
  grand_prize_claimed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (child_id, season_key)
);

CREATE INDEX idx_season_progress_child ON season_progress(child_id, season_key);

-- ─── Seed the season activation registry (current calendar year) ───
INSERT INTO seasons (key, name, theme, starts_on, ends_on, is_active) VALUES
  ('winter-festival','Winter Festival','Winter Code Wonderland', date '2026-01-01', date '2026-01-31', false),
  ('valentines','Hearts & Algorithms','Hearts & Algorithms', date '2026-02-01', date '2026-02-14', false),
  ('spring-bloom','Spring Bloom','Garden of Knowledge', date '2026-03-15', date '2026-04-15', false),
  ('summer-explorer','Summer Explorer','Summer AI Adventure', date '2026-06-01', date '2026-08-15', false),
  ('back-to-school','Back to School','Code Academy', date '2026-09-01', date '2026-09-30', false),
  ('halloween','Spooky Circuits','Spooky Circuits', date '2026-10-15', date '2026-10-31', false),
  ('holiday','Winter AI Festival','Winter AI Festival', date '2026-12-01', date '2026-12-31', false)
ON CONFLICT (key) DO NOTHING;

-- Activate whichever season contains today (idempotent; cron keeps this fresh).
UPDATE seasons SET is_active = (CURRENT_DATE BETWEEN starts_on AND ends_on), updated_at = now();

-- ─── RLS ───
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE season_progress ENABLE ROW LEVEL SECURITY;

-- Seasons catalog/activation is readable by any signed-in user.
CREATE POLICY seasons_select_all ON seasons FOR SELECT USING (true);

-- A parent can read their own children's seasonal progress.
CREATE POLICY season_progress_select_owner ON season_progress
  FOR SELECT USING (child_id IN (SELECT id FROM children WHERE parent_id = auth.uid()));

-- No write policies: all writes go through the admin (service-role) client
-- in the API routes, which enforces ownership + claim/purchase rules.

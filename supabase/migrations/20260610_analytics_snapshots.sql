-- ════════════════════════════════════════════════════
-- MIGRATION: Advanced Analytics Dashboard (Phase 10.5)
-- Date: 2026-06-10
-- Weekly per-child analytics snapshots that power learning-velocity
-- trends and time-on-task analytics in the parent dashboard.
-- Captured by the analytics-snapshot cron.
-- ════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS analytics_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  week_starting DATE NOT NULL,
  xp INTEGER NOT NULL DEFAULT 0 CHECK (xp >= 0),
  time_minutes INTEGER NOT NULL DEFAULT 0 CHECK (time_minutes >= 0),
  games_played INTEGER NOT NULL DEFAULT 0 CHECK (games_played >= 0),
  per_lab JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (child_id, week_starting)
);

CREATE INDEX IF NOT EXISTS idx_analytics_snapshots_child ON analytics_snapshots(child_id, week_starting DESC);

ALTER TABLE analytics_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY analytics_snapshots_select_owner ON analytics_snapshots
  FOR SELECT USING (child_id IN (SELECT id FROM children WHERE parent_id = auth.uid()));

-- No write policies: snapshots are written by the cron via the admin client.

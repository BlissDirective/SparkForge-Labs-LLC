-- ════════════════════════════════════════════════════
-- MIGRATION: Adaptive Difficulty System (Phase 10.1)
-- Date: 2026-06-07
-- Per-child, per-lab dynamic difficulty state + learning-curve
-- history. The controller logic lives in code
-- (src/lib/adaptive/AdaptiveEngine.ts).
-- ════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS adaptive_difficulty (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  lab_id INTEGER NOT NULL CHECK (lab_id BETWEEN 1 AND 11),
  level TEXT NOT NULL DEFAULT 'easy'
    CHECK (level IN ('easy', 'medium', 'hard', 'expert')),
  performance NUMERIC(4,3) NOT NULL DEFAULT 0.5 CHECK (performance >= 0 AND performance <= 1),
  samples INTEGER NOT NULL DEFAULT 0 CHECK (samples >= 0),
  history JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (child_id, lab_id)
);

CREATE INDEX IF NOT EXISTS idx_adaptive_difficulty_child ON adaptive_difficulty(child_id, lab_id);

ALTER TABLE adaptive_difficulty ENABLE ROW LEVEL SECURITY;

CREATE POLICY adaptive_difficulty_select_owner ON adaptive_difficulty
  FOR SELECT USING (child_id IN (SELECT id FROM children WHERE parent_id = auth.uid()));

-- No write policies: all writes go through the admin (service-role) client.

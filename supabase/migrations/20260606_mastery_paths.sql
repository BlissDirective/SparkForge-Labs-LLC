-- ════════════════════════════════════════════════════
-- MIGRATION: Mastery Path System (Phase 10.2)
-- Date: 2026-06-06
-- Per-child mastery overlay: mastered_at snapshot, Expert Mode
-- unlock, and mastery-certificate issuance + parent approval.
-- Mastery status itself is derived from lab completion percent
-- (src/lib/mastery/MasteryEngine.ts); this table is the overlay.
-- ════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS mastery_paths (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  lab_id INTEGER NOT NULL CHECK (lab_id BETWEEN 1 AND 11),
  mastered_at TIMESTAMPTZ,
  expert_unlocked BOOLEAN NOT NULL DEFAULT false,
  certificate_issued BOOLEAN NOT NULL DEFAULT false,
  certificate_approved BOOLEAN NOT NULL DEFAULT false,
  certificate_approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (child_id, lab_id)
);

CREATE INDEX IF NOT EXISTS idx_mastery_paths_child ON mastery_paths(child_id, lab_id);

ALTER TABLE mastery_paths ENABLE ROW LEVEL SECURITY;

-- A parent can read their own children's mastery overlay.
CREATE POLICY mastery_paths_select_owner ON mastery_paths
  FOR SELECT USING (child_id IN (SELECT id FROM children WHERE parent_id = auth.uid()));

-- No write policies: all writes go through the admin (service-role) client
-- in the API routes, which verifies mastery server-side before recording.

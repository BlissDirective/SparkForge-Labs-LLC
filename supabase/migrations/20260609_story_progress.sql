-- ════════════════════════════════════════════════════
-- MIGRATION: Cross-Lab Story Campaigns (Phase 10.4)
-- Date: 2026-06-09
-- Per-child narrative campaign progress (current chapter, branching
-- choices, ending). Campaign catalog lives in code
-- (src/lib/story/StoryEngine.ts).
-- ════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS story_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  campaign_id TEXT NOT NULL,
  current_chapter INTEGER NOT NULL DEFAULT 1 CHECK (current_chapter >= 1),
  choices JSONB NOT NULL DEFAULT '[]'::jsonb,
  completed BOOLEAN NOT NULL DEFAULT false,
  ending_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (child_id, campaign_id)
);

CREATE INDEX IF NOT EXISTS idx_story_progress_child ON story_progress(child_id, campaign_id);

ALTER TABLE story_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY story_progress_select_owner ON story_progress
  FOR SELECT USING (child_id IN (SELECT id FROM children WHERE parent_id = auth.uid()));

-- No write policies: all writes go through the admin (service-role) client.

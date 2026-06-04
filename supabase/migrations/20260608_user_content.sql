-- ════════════════════════════════════════════════════
-- MIGRATION: User-Generated Content (Phase 10.3)
-- Date: 2026-06-08
-- COPPA-safe "Create a Quiz": quizzes are assembled from a
-- pre-approved question bank (no free-form text), parent-moderated
-- before sharing, and rated by the community.
-- ════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS user_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  question_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
  rating_sum INTEGER NOT NULL DEFAULT 0 CHECK (rating_sum >= 0),
  rating_count INTEGER NOT NULL DEFAULT 0 CHECK (rating_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  moderated_at TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_content_creator ON user_content(creator_child_id, status);
CREATE INDEX IF NOT EXISTS idx_user_content_published ON user_content(status, published_at DESC) WHERE status = 'approved';

CREATE TABLE IF NOT EXISTS content_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID NOT NULL REFERENCES user_content(id) ON DELETE CASCADE,
  rater_child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  stars INTEGER NOT NULL CHECK (stars BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (content_id, rater_child_id)
);

CREATE INDEX IF NOT EXISTS idx_content_ratings_content ON content_ratings(content_id);

-- ─── RLS ───
ALTER TABLE user_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_ratings ENABLE ROW LEVEL SECURITY;

-- Creators read their own content; everyone (signed-in) reads APPROVED
-- community content.
CREATE POLICY user_content_select_owner ON user_content
  FOR SELECT USING (
    status = 'approved'
    OR creator_child_id IN (SELECT id FROM children WHERE parent_id = auth.uid())
  );

-- A parent can read ratings made by their own children.
CREATE POLICY content_ratings_select_owner ON content_ratings
  FOR SELECT USING (rater_child_id IN (SELECT id FROM children WHERE parent_id = auth.uid()));

-- No write policies: all writes go through the admin (service-role) client,
-- which enforces ownership, the pre-approved-bank rule, and moderation.

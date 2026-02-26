-- ════════════════════════════════════════════════════
-- SPARKFORGE INDEXES
-- Run after 001_schema.sql
-- ════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_children_parent ON children(parent_id);
CREATE INDEX IF NOT EXISTS idx_content_world_band ON content(world, target_age_band) WHERE status = 'published';
CREATE INDEX IF NOT EXISTS idx_content_status ON content(status);
CREATE INDEX IF NOT EXISTS idx_content_type ON content(type, target_age_band);
CREATE INDEX IF NOT EXISTS idx_content_slug ON content(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_progress_child ON progress(child_id);
CREATE INDEX IF NOT EXISTS idx_progress_content ON progress(content_id);
CREATE INDEX IF NOT EXISTS idx_progress_completed ON progress(child_id, completed);
CREATE INDEX IF NOT EXISTS idx_child_badges_child ON child_badges(child_id);
CREATE INDEX IF NOT EXISTS idx_content_queue_status ON content_queue(status);
CREATE INDEX IF NOT EXISTS idx_sessions_child ON sessions(child_id);
CREATE INDEX IF NOT EXISTS idx_sessions_dates ON sessions(child_id, started_at);
CREATE INDEX IF NOT EXISTS idx_prompt_history_child ON prompt_history(child_id);
CREATE INDEX IF NOT EXISTS idx_prompt_history_created ON prompt_history(created_at);

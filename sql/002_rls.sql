-- ════════════════════════════════════════════════════
-- ROW LEVEL SECURITY POLICIES
-- ════════════════════════════════════════════════════

-- Parents: own row only
ALTER TABLE parents ENABLE ROW LEVEL SECURITY;
CREATE POLICY parents_select ON parents FOR SELECT USING (id = auth.uid());
CREATE POLICY parents_update ON parents FOR UPDATE USING (id = auth.uid());
CREATE POLICY parents_insert ON parents FOR INSERT WITH CHECK (id = auth.uid());

-- Children: parent's own children only
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
CREATE POLICY children_select ON children FOR SELECT USING (parent_id = auth.uid());
CREATE POLICY children_insert ON children FOR INSERT WITH CHECK (parent_id = auth.uid());
CREATE POLICY children_update ON children FOR UPDATE USING (parent_id = auth.uid());
CREATE POLICY children_delete ON children FOR DELETE USING (parent_id = auth.uid());

-- Content: published = everyone; admin = everything
ALTER TABLE content ENABLE ROW LEVEL SECURITY;
CREATE POLICY content_read_published ON content FOR SELECT USING (status = 'published');
CREATE POLICY content_admin_all ON content FOR ALL USING (
  EXISTS (SELECT 1 FROM parents WHERE id = auth.uid() AND is_admin = true)
);

-- Progress: child's parent only
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY progress_select ON progress FOR SELECT USING (
  child_id IN (SELECT id FROM children WHERE parent_id = auth.uid())
);
CREATE POLICY progress_insert ON progress FOR INSERT WITH CHECK (
  child_id IN (SELECT id FROM children WHERE parent_id = auth.uid())
);
CREATE POLICY progress_update ON progress FOR UPDATE USING (
  child_id IN (SELECT id FROM children WHERE parent_id = auth.uid())
);

-- Badges: public definitions
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY badges_read ON badges FOR SELECT USING (true);

-- Child badges: child's parent only
ALTER TABLE child_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY child_badges_select ON child_badges FOR SELECT USING (
  child_id IN (SELECT id FROM children WHERE parent_id = auth.uid())
);
CREATE POLICY child_badges_insert ON child_badges FOR INSERT WITH CHECK (
  child_id IN (SELECT id FROM children WHERE parent_id = auth.uid())
);

-- Content queue: admin only
ALTER TABLE content_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY content_queue_admin ON content_queue FOR ALL USING (
  EXISTS (SELECT 1 FROM parents WHERE id = auth.uid() AND is_admin = true)
);

-- Sessions: child's parent only
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY sessions_own ON sessions FOR ALL USING (
  child_id IN (SELECT id FROM children WHERE parent_id = auth.uid())
);

-- Prompt history: child's parent only
ALTER TABLE prompt_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY prompt_history_own ON prompt_history FOR ALL USING (
  child_id IN (SELECT id FROM children WHERE parent_id = auth.uid())
);

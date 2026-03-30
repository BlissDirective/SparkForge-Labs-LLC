-- ════════════════════════════════════════════════════
-- DATABASE FUNCTIONS & TRIGGERS
-- ════════════════════════════════════════════════════

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER parents_updated_at BEFORE UPDATE ON parents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER children_updated_at BEFORE UPDATE ON children
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER progress_updated_at BEFORE UPDATE ON progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Reset daily prompt count
CREATE OR REPLACE FUNCTION reset_daily_prompts()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.prompts_reset_date < CURRENT_DATE THEN
    NEW.prompts_used_today := 0;
    NEW.prompts_reset_date := CURRENT_DATE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER children_reset_prompts BEFORE UPDATE ON children
  FOR EACH ROW EXECUTE FUNCTION reset_daily_prompts();

-- Reset weekly game count
CREATE OR REPLACE FUNCTION reset_weekly_games()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.games_reset_week < date_trunc('week', CURRENT_DATE)::date THEN
    NEW.games_played_this_week := 0;
    NEW.games_reset_week := date_trunc('week', CURRENT_DATE)::date;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER children_reset_games BEFORE UPDATE ON children
  FOR EACH ROW EXECUTE FUNCTION reset_weekly_games();

-- COPPA cleanup: delete prompts older than 30 days
CREATE OR REPLACE FUNCTION cleanup_old_prompts()
RETURNS void AS $$
BEGIN
  DELETE FROM prompt_history WHERE created_at < now() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Lab completion progress calculator
CREATE OR REPLACE FUNCTION get_lab_progress(p_child_id UUID, p_world INT, p_age_band TEXT)
RETURNS TABLE(total_items BIGINT, completed_items BIGINT, percent NUMERIC) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(c.id) AS total_items,
    COUNT(p.id) FILTER (WHERE p.completed = true) AS completed_items,
    CASE WHEN COUNT(c.id) = 0 THEN 0
    ELSE ROUND(COUNT(p.id) FILTER (WHERE p.completed = true)::NUMERIC / COUNT(c.id) * 100, 1)
    END AS percent
  FROM content c
  LEFT JOIN progress p ON p.content_id = c.id AND p.child_id = p_child_id
  WHERE c.world = p_world
    AND c.target_age_band = p_age_band
    AND c.status = 'published';
END;
$$ LANGUAGE plpgsql SET search_path = public, pg_temp SECURITY DEFINER;

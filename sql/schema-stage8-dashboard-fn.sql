-- ════════════════════════════════════════════════════
-- STAGE 8 — Parent Dashboard Aggregation Function
-- S8-HIGH-002 fix: Replaces N+1 client-side queries with
-- single DB function call. Returns all children + stats.
-- ════════════════════════════════════════════════════

-- Update subscription_status CHECK to include 'paused' (S8-WARN-002 alignment)
ALTER TABLE parents DROP CONSTRAINT IF EXISTS parents_subscription_status_check;
ALTER TABLE parents ADD CONSTRAINT parents_subscription_status_check
  CHECK (subscription_status IN ('none', 'active', 'past_due', 'canceled', 'paused'));

-- Main dashboard function
CREATE OR REPLACE FUNCTION get_parent_dashboard(p_parent_id UUID)
RETURNS TABLE (
  child_id UUID,
  display_name TEXT,
  age_band TEXT,
  xp INTEGER,
  level INTEGER,
  streak_count INTEGER,
  streak_last_date DATE,
  lessons_completed BIGINT,
  quizzes_passed BIGINT,
  games_played BIGINT,
  total_time_minutes BIGINT,
  badges_earned BIGINT,
  last_active TIMESTAMPTZ,
  daily_time_limit_minutes INTEGER
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    c.id AS child_id,
    c.display_name,
    c.age_band,
    COALESCE(c.xp, 0) AS xp,
    COALESCE(c.level, 1) AS level,
    COALESCE(c.streak_count, 0) AS streak_count,
    c.streak_last_date,
    COALESCE(p_lessons.cnt, 0) AS lessons_completed,
    COALESCE(p_quizzes.cnt, 0) AS quizzes_passed,
    COALESCE(p_games.cnt, 0) AS games_played,
    COALESCE(s_time.total_mins, 0) AS total_time_minutes,
    COALESCE(b.cnt, 0) AS badges_earned,
    s_last.last_active,
    c.daily_time_limit_minutes
  FROM children c
  -- Lessons completed
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS cnt
    FROM progress
    WHERE progress.child_id = c.id AND progress.completed = true
  ) p_lessons ON true
  -- Quizzes passed (score >= 70)
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS cnt
    FROM progress
    WHERE progress.child_id = c.id AND progress.completed = true AND progress.score >= 70
  ) p_quizzes ON true
  -- Games played in last 7 days
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS cnt
    FROM progress
    WHERE progress.child_id = c.id
      AND progress.completed = true
      AND progress.completed_at >= (NOW() - INTERVAL '7 days')
  ) p_games ON true
  -- Total session time in minutes
  LEFT JOIN LATERAL (
    SELECT ROUND(COALESCE(SUM(duration_seconds), 0) / 60.0)::BIGINT AS total_mins
    FROM sessions
    WHERE sessions.child_id = c.id
  ) s_time ON true
  -- Badges earned
  LEFT JOIN LATERAL (
    SELECT COUNT(*) AS cnt
    FROM child_badges
    WHERE child_badges.child_id = c.id
  ) b ON true
  -- Last active session
  LEFT JOIN LATERAL (
    SELECT started_at AS last_active
    FROM sessions
    WHERE sessions.child_id = c.id
    ORDER BY started_at DESC
    LIMIT 1
  ) s_last ON true
  WHERE c.parent_id = p_parent_id
  ORDER BY c.created_at ASC;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_parent_dashboard(UUID) TO authenticated;

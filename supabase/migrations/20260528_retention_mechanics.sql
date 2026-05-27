-- ════════════════════════════════════════════════════
-- MIGRATION: Retention Mechanics Engine
-- Date: 2026-05-28
-- Phase 2: Streak v2, Leaderboards, Currency, Enhanced Badges
-- ════════════════════════════════════════════════════

-- ─── Streak History ───
CREATE TABLE IF NOT EXISTS streak_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  active BOOLEAN NOT NULL DEFAULT false,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  games_played INTEGER NOT NULL DEFAULT 0,
  freeze_used BOOLEAN NOT NULL DEFAULT false,
  wager_active BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(child_id, date)
);

CREATE INDEX idx_streak_history_child_date ON streak_history(child_id, date DESC);

-- ─── Streak Freezes ───
CREATE TABLE IF NOT EXISTS streak_freezes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  equipped BOOLEAN NOT NULL DEFAULT false,
  consumed BOOLEAN NOT NULL DEFAULT false,
  consumed_date DATE,
  source TEXT NOT NULL DEFAULT '7-day-milestone'
    CHECK (source IN ('7-day-milestone', '14-day-milestone', '30-day-reward', 'purchase')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_streak_freezes_child ON streak_freezes(child_id) WHERE consumed = false;

-- ─── Streak Wagers ───
CREATE TABLE IF NOT EXISTS streak_wagers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  wager_type TEXT NOT NULL CHECK (wager_type IN ('7-day', '14-day')),
  gems_bet INTEGER NOT NULL DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'failed', 'claimed')),
  days_maintained INTEGER NOT NULL DEFAULT 0,
  reward_gems INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_streak_wagers_child_active ON streak_wagers(child_id, status) WHERE status = 'active';

-- ─── Add streak columns to children ───
ALTER TABLE children
  ADD COLUMN IF NOT EXISTS longest_streak INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS streak_started_date DATE,
  ADD COLUMN IF NOT EXISTS freezes_available INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_freezes_earned INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS society_joined_at TIMESTAMPTZ;

-- ─── Gem Currency ───
CREATE TABLE IF NOT EXISTS currency_wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  gems INTEGER NOT NULL DEFAULT 0 CHECK (gems >= 0),
  gems_earned_lifetime INTEGER NOT NULL DEFAULT 0,
  gems_spent_lifetime INTEGER NOT NULL DEFAULT 0,
  last_daily_reward DATE,
  daily_reward_streak INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(child_id)
);

-- ─── Currency Transactions ───
CREATE TABLE IF NOT EXISTS currency_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (
    type IN (
      'streak_milestone', 'wager_win', 'daily_reward', 'badge_earned',
      'level_up', 'game_complete', 'quest_complete', 'purchase_freeze',
      'wager_entry', 'spent_cosmetic', 'admin_grant', 'event_reward'
    )
  ),
  amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  description TEXT NOT NULL,
  source_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_currency_transactions_child ON currency_transactions(child_id, created_at DESC);

-- ─── Leagues ───
CREATE TABLE IF NOT EXISTS leagues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier TEXT NOT NULL CHECK (tier IN ('bronze', 'silver', 'gold', 'platinum', 'diamond', 'legend')),
  week_starting DATE NOT NULL,
  week_ending DATE NOT NULL,
  max_participants INTEGER NOT NULL DEFAULT 50,
  is_sealed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_leagues_tier_week ON leagues(tier, week_starting);

-- ─── League Participants ───
CREATE TABLE IF NOT EXISTS league_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  league_id UUID NOT NULL REFERENCES leagues(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_emoji TEXT NOT NULL DEFAULT '🤖',
  xp_earned INTEGER NOT NULL DEFAULT 0,
  games_played INTEGER NOT NULL DEFAULT 0,
  quests_completed INTEGER NOT NULL DEFAULT 0,
  rank INTEGER,
  promotion_status TEXT DEFAULT 'pending'
    CHECK (promotion_status IN ('promoted', 'demoted', 'staying', 'pending')),
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT false,
  UNIQUE(league_id, child_id)
);

CREATE INDEX idx_league_participants_league ON league_participants(league_id, xp_earned DESC);
CREATE INDEX idx_league_participants_child ON league_participants(child_id);

-- ─── League History ───
CREATE TABLE IF NOT EXISTS league_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  week_starting DATE NOT NULL,
  tier TEXT NOT NULL,
  final_rank INTEGER NOT NULL,
  total_participants INTEGER NOT NULL,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  promotion_status TEXT NOT NULL,
  gems_earned INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_league_history_child ON league_history(child_id, week_starting DESC);

-- ─── RLS Policies ───

-- Streak history: parents can see their children's data
ALTER TABLE streak_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY streak_history_parent_read ON streak_history
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM children WHERE children.id = streak_history.child_id AND children.parent_id = auth.uid())
  );

-- Streak freezes
ALTER TABLE streak_freezes ENABLE ROW LEVEL SECURITY;

CREATE POLICY streak_freezes_parent_all ON streak_freezes
  FOR ALL USING (
    EXISTS (SELECT 1 FROM children WHERE children.id = streak_freezes.child_id AND children.parent_id = auth.uid())
  );

-- Streak wagers
ALTER TABLE streak_wagers ENABLE ROW LEVEL SECURITY;

CREATE POLICY streak_wagers_parent_all ON streak_wagers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM children WHERE children.id = streak_wagers.child_id AND children.parent_id = auth.uid())
  );

-- Currency wallets
ALTER TABLE currency_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY currency_wallets_parent_all ON currency_wallets
  FOR ALL USING (
    EXISTS (SELECT 1 FROM children WHERE children.id = currency_wallets.child_id AND children.parent_id = auth.uid())
  );

-- Currency transactions
ALTER TABLE currency_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY currency_transactions_parent_read ON currency_transactions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM children WHERE children.id = currency_transactions.child_id AND children.parent_id = auth.uid())
  );

-- Leagues (public read within league)
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;

CREATE POLICY leagues_public_read ON leagues FOR SELECT USING (true);

-- League participants
ALTER TABLE league_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY league_participants_league_read ON league_participants
  FOR SELECT USING (
    league_id IN (
      SELECT lp.league_id FROM league_participants lp
      WHERE lp.child_id IN (SELECT id FROM children WHERE parent_id = auth.uid())
    )
  );

-- League history
ALTER TABLE league_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY league_history_parent_read ON league_history
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM children WHERE children.id = league_history.child_id AND children.parent_id = auth.uid())
  );

-- ─── Triggers ───

-- Auto-update children stats when streak changes
CREATE OR REPLACE FUNCTION update_streak_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update longest streak if current is higher
  IF NEW.streak_count > NEW.longest_streak THEN
    NEW.longest_streak = NEW.streak_count;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_streak_stats ON children;
CREATE TRIGGER trigger_update_streak_stats
  BEFORE UPDATE OF streak_count ON children
  FOR EACH ROW
  EXECUTE FUNCTION update_streak_stats();

-- Auto-create currency wallet for new children
CREATE OR REPLACE FUNCTION create_currency_wallet()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO currency_wallets (child_id, gems)
  VALUES (NEW.id, 50) -- Start with 50 gems
  ON CONFLICT (child_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_currency_wallet ON children;
CREATE TRIGGER trigger_create_currency_wallet
  AFTER INSERT ON children
  FOR EACH ROW
  EXECUTE FUNCTION create_currency_wallet();

-- Seed existing children with wallets
INSERT INTO currency_wallets (child_id, gems, gems_earned_lifetime)
SELECT id, 50, 50 FROM children
ON CONFLICT (child_id) DO NOTHING;

-- ─── Updated get_parent_dashboard function ───
CREATE OR REPLACE FUNCTION get_parent_dashboard(p_parent_id UUID)
RETURNS TABLE (
  child_id UUID,
  display_name TEXT,
  age_band TEXT,
  level INTEGER,
  xp INTEGER,
  streak_count INTEGER,
  streak_last_date DATE,
  badges_earned BIGINT,
  games_played BIGINT,
  lessons_completed BIGINT,
  quizzes_passed BIGINT,
  total_time_minutes BIGINT,
  last_active TIMESTAMPTZ,
  daily_time_limit_minutes INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id AS child_id,
    c.display_name,
    c.age_band,
    c.level,
    c.xp,
    c.streak_count,
    c.streak_last_date,
    (SELECT COUNT(*) FROM child_badgeS cb WHERE cb.child_id = c.id) AS badges_earned,
    (SELECT COUNT(*) FROM progress p WHERE p.child_id = c.id AND p.completed = true) AS games_played,
    (SELECT COUNT(*) FROM progress p
     JOIN content cnt ON p.content_id = cnt.id
     WHERE p.child_id = c.id AND p.completed = true AND cnt.type = 'lesson') AS lessons_completed,
    (SELECT COUNT(*) FROM progress p
     JOIN content cnt ON p.content_id = cnt.id
     WHERE p.child_id = c.id AND p.completed = true AND cnt.type = 'quiz') AS quizzes_passed,
    COALESCE(
      (SELECT SUM(p.time_spent_seconds) / 60 FROM progress p WHERE p.child_id = c.id),
      0
    )::bigint AS total_time_minutes,
    (SELECT MAX(p.completed_at) FROM progress p WHERE p.child_id = c.id) AS last_active,
    c.daily_time_limit_minutes
  FROM children c
  WHERE c.parent_id = p_parent_id AND c.deactivated_at IS NULL
  ORDER BY c.created_at;
END;
$$ LANGUAGE plpgsql;

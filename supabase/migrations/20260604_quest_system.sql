-- ════════════════════════════════════════════════════
-- MIGRATION: Quest System (Phase 7)
-- Date: 2026-06-04
-- Daily quests, weekly chains, quest history
-- ════════════════════════════════════════════════════

-- ─── Active Quests (daily assignments) ───
CREATE TABLE IF NOT EXISTS active_quests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  template_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'claimed', 'expired')),
  progress INTEGER NOT NULL DEFAULT 0 CHECK (progress >= 0),
  requirement_count INTEGER NOT NULL DEFAULT 1 CHECK (requirement_count > 0),
  assigned_date DATE NOT NULL,
  expires_at DATE NOT NULL,
  claimed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Joined template fields (denormalized for fast reads)
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '🔥',
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  rarity TEXT NOT NULL DEFAULT 'common'
    CHECK (rarity IN ('common', 'uncommon', 'rare', 'epic', 'legendary')),
  type TEXT NOT NULL,
  xp_reward INTEGER NOT NULL DEFAULT 0,
  gem_reward INTEGER NOT NULL DEFAULT 0,
  sparky_expression TEXT NOT NULL DEFAULT 'happy'
);

CREATE INDEX idx_active_quests_child_date ON active_quests(child_id, assigned_date DESC);
CREATE INDEX idx_active_quests_child_status ON active_quests(child_id, status) WHERE status IN ('active', 'completed');

-- ─── Quest History (archived completed quests) ───
CREATE TABLE IF NOT EXISTS quest_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  quest_template_id TEXT NOT NULL,
  title TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  rarity TEXT NOT NULL DEFAULT 'common',
  status TEXT NOT NULL DEFAULT 'claimed' CHECK (status IN ('claimed', 'expired')),
  gems_earned INTEGER NOT NULL DEFAULT 0,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  streak_days_at_claim INTEGER NOT NULL DEFAULT 0,
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_quest_history_child ON quest_history(child_id, claimed_at DESC);
CREATE INDEX idx_quest_history_template ON quest_history(quest_template_id);

-- ─── Weekly Quest Chains ───
CREATE TABLE IF NOT EXISTS weekly_quest_chains (
  id TEXT PRIMARY KEY,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  week_starting DATE NOT NULL,
  current_step INTEGER NOT NULL DEFAULT 1 CHECK (current_step > 0),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'completed', 'claimed')),
  total_steps INTEGER NOT NULL DEFAULT 7,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_weekly_chains_child_week ON weekly_quest_chains(child_id, week_starting);

-- ─── Weekly Chain Steps ───
CREATE TABLE IF NOT EXISTS weekly_chain_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chain_id TEXT NOT NULL REFERENCES weekly_quest_chains(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL CHECK (step_number > 0),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  emoji TEXT NOT NULL DEFAULT '🎯',
  requirement_count INTEGER NOT NULL DEFAULT 1,
  progress INTEGER NOT NULL DEFAULT 0,
  xp_reward INTEGER NOT NULL DEFAULT 0,
  gem_reward INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'locked'
    CHECK (status IN ('locked', 'active', 'completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(chain_id, step_number)
);

CREATE INDEX idx_chain_steps_chain ON weekly_chain_steps(chain_id, step_number);

-- ─── RLS Policies ───
ALTER TABLE active_quests ENABLE ROW LEVEL SECURITY;
ALTER TABLE quest_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_quest_chains ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_chain_steps ENABLE ROW LEVEL SECURITY;

-- Active quests: children can read their own
CREATE POLICY active_quests_select_child ON active_quests
  FOR SELECT USING (
    child_id IN (
      SELECT id FROM children WHERE user_id = auth.uid()
    )
  );

-- Quest history: children can read their own
CREATE POLICY quest_history_select_child ON quest_history
  FOR SELECT USING (
    child_id IN (
      SELECT id FROM children WHERE user_id = auth.uid()
    )
  );

-- Weekly chains: children can read their own
CREATE POLICY weekly_chains_select_child ON weekly_quest_chains
  FOR SELECT USING (
    child_id IN (
      SELECT id FROM children WHERE user_id = auth.uid()
    )
  );

-- Chain steps: children can read their own
CREATE POLICY chain_steps_select_child ON weekly_chain_steps
  FOR SELECT USING (
    chain_id IN (
      SELECT id FROM weekly_quest_chains WHERE child_id IN (
        SELECT id FROM children WHERE user_id = auth.uid()
      )
    )
  );

-- Service role can manage all quest tables (for API routes)
CREATE POLICY active_quests_service ON active_quests
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY quest_history_service ON quest_history
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY weekly_chains_service ON weekly_quest_chains
  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY chain_steps_service ON weekly_chain_steps
  FOR ALL USING (true) WITH CHECK (true);

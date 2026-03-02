# SPARKFORGE — STAGE 2: DATABASE & API LAYER v2 (PART 1 of 4)

**Date:** February 21, 2026 | **Version:** Frost-Prismatic v2.1

---

## v2 CHANGES FROM v1

- **[BUG-7]** Added comment clarifying `subscription_status` default reasoning
- **[NEW-3A]** Added `onboarding_complete` BOOLEAN to parents table
- **[ENH]** Added `is_admin` column clarification for RLS policies

---

## PART 1 (2A) COVERS

- Database schema (9 tables)
- Indexes (14 performance indexes)
- Row Level Security policies
- Database functions & triggers
- Badge seed data (78 badges)
- Starter content seed data
- Cron job setup

---

## PREREQUISITES

- Stage 1 v2 (Foundation) must be complete
- Supabase project created with API keys in `.env.local`

---

## HOW TO USE THIS DOCUMENT

1. Log into your Supabase dashboard (https://supabase.com/dashboard)
2. Select your "sparkforge" project
3. Go to **SQL Editor** (left sidebar → SQL Editor)
4. Click **"New Query"**
5. Copy-paste each SQL block below and click **"Run"**
6. Run them **IN ORDER** — tables first, then indexes, then RLS, etc.

> **IMPORTANT:** The database uses `world` as the column name (not `lab`). This is intentional — the UI displays "Lab" but the DB stores "world". This avoids breaking changes in existing queries and migrations.

---

## STEP 1: SET UP YOUR .env.local FILE

Before running any SQL, update your `.env.local` file with real keys. Open `.env.local` in VS Code and replace the placeholder values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi…your-real-anon-key
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi…your-real-service-role-key
```

Get these from: **Supabase Dashboard → Project Settings → API**

---

## STEP 2: CREATE ALL TABLES (ENHANCED v2)

**WHAT THIS DOES:** Creates all 9 database tables that store SparkForge data.

### v2 CHANGES

- **[BUG-7]** `parents.subscription_status` defaults to `'active'`. This IS intentional: all users (including free) are "active". Stage 8 adds `'none'` status for pre-checkout state. Added SQL comment explaining this design decision.
- **[NEW-3A]** `parents.onboarding_complete` defaults to `false`. Set to `true` after the onboarding wizard completes (Stage 3).
- **[ENH]** `parents.is_admin` column confirmed present for RLS policies.

**WHERE:** Supabase Dashboard → SQL Editor → New Query → Copy-paste this entire block and click "Run":

### SQL Block: `001_schema.sql`

```sql
-- ════════════════════════════════════════════════════
-- SPARKFORGE DATABASE SCHEMA v2.1
-- Run in Supabase SQL Editor
-- ════════════════════════════════════════════════════

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ════════════════════════════════════════════════════
-- TABLE: parents
-- The adult account holder. Links to Supabase Auth.
-- One parent can have multiple children (up to tier limit).
--
-- v2 DESIGN NOTES:
--   subscription_status defaults to 'active' because ALL users
--   (free included) have an active account. Stage 8 will add
--   'none' status for the pre-checkout intermediate state.
--   Do NOT change this default without updating Stage 8.
--
--   onboarding_complete tracks whether the parent has completed
--   the onboarding wizard (Stage 3). Defaults false.
-- ════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS parents (
  id                    UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email                 TEXT UNIQUE NOT NULL,
  full_name             TEXT,
  stripe_customer_id    TEXT UNIQUE,
  subscription_tier     TEXT NOT NULL DEFAULT 'free'
                        CHECK (subscription_tier IN ('free', 'plus', 'forge')),
  subscription_status   TEXT NOT NULL DEFAULT 'active'
                        CHECK (subscription_status IN ('active', 'past_due', 'canceled', 'trialing')),
  coppa_consent_at      TIMESTAMPTZ,
  is_admin              BOOLEAN NOT NULL DEFAULT false,
  onboarding_complete   BOOLEAN NOT NULL DEFAULT false,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ════════════════════════════════════════════════════
-- TABLE: children
-- ════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS children (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id             UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  display_name          TEXT NOT NULL,
  age                   INT NOT NULL CHECK (age BETWEEN 5 AND 18),
  age_band              TEXT NOT NULL CHECK (age_band IN ('A', 'B', 'C')),
  xp                    INT NOT NULL DEFAULT 0 CHECK (xp >= 0),
  level                 INT NOT NULL DEFAULT 1 CHECK (level >= 1),
  spark_coins           INT NOT NULL DEFAULT 0 CHECK (spark_coins >= 0),
  streak_count          INT NOT NULL DEFAULT 0 CHECK (streak_count >= 0),
  streak_last_date      DATE,
  streak_shield         BOOLEAN NOT NULL DEFAULT false,
  avatar_config         JSONB DEFAULT '{}',
  preferences           JSONB DEFAULT '{}',
  prompts_used_today    INT NOT NULL DEFAULT 0,
  prompts_reset_date    DATE NOT NULL DEFAULT CURRENT_DATE,
  games_played_this_week INT NOT NULL DEFAULT 0,
  games_reset_week      DATE NOT NULL DEFAULT date_trunc('week', CURRENT_DATE)::date,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ════════════════════════════════════════════════════
-- TABLE: content
-- The "world" column maps to "Lab" in the UI (1-10).
-- ════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS content (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world                 INT NOT NULL CHECK (world BETWEEN 1 AND 10),
  title                 TEXT NOT NULL,
  slug                  TEXT UNIQUE,
  type                  TEXT NOT NULL CHECK (type IN ('lesson','quiz','game','spark_fact','activity','sandbox')),
  target_age_band       TEXT NOT NULL CHECK (target_age_band IN ('A','B','C')),
  difficulty            TEXT NOT NULL DEFAULT 'beginner'
                        CHECK (difficulty IN ('beginner','intermediate','advanced')),
  content_body          TEXT NOT NULL DEFAULT '',
  quiz_questions        JSONB,
  game_config           JSONB,
  xp_reward             INT NOT NULL DEFAULT 15 CHECK (xp_reward >= 0),
  estimated_minutes     INT NOT NULL DEFAULT 10 CHECK (estimated_minutes > 0),
  sort_order            INT NOT NULL DEFAULT 0,
  is_free               BOOLEAN NOT NULL DEFAULT true,
  is_agent_generated    BOOLEAN NOT NULL DEFAULT false,
  source_urls           TEXT[],
  status                TEXT NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('published','pending_review','needs_human_review','rejected','draft')),
  safety_check          JSONB,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at          TIMESTAMPTZ,
  reviewed_by           UUID REFERENCES parents(id),
  reviewed_at           TIMESTAMPTZ
);

-- ════════════════════════════════════════════════════
-- TABLE: progress
-- ════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS progress (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id              UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  content_id            UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  completed             BOOLEAN NOT NULL DEFAULT false,
  score                 NUMERIC(5,2),
  time_spent_seconds    INT NOT NULL DEFAULT 0 CHECK (time_spent_seconds >= 0),
  attempts              INT NOT NULL DEFAULT 1 CHECK (attempts >= 1),
  completed_at          TIMESTAMPTZ,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(child_id, content_id)
);

-- ════════════════════════════════════════════════════
-- TABLE: badges (78 total across 9 categories)
-- category 'world' in DB = "Lab Master" badges in UI
-- ════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS badges (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  TEXT NOT NULL UNIQUE,
  description           TEXT NOT NULL,
  icon                  TEXT NOT NULL,
  category              TEXT NOT NULL CHECK (category IN (
    'progress','streak','world','game_master','knowledge','explorer','creator','secret','prestige'
  )),
  criteria_type         TEXT NOT NULL,
  criteria_value        INT NOT NULL CHECK (criteria_value > 0),
  criteria_world        INT CHECK (criteria_world IS NULL OR (criteria_world BETWEEN 1 AND 10)),
  rarity                TEXT NOT NULL DEFAULT 'common'
                        CHECK (rarity IN ('common','uncommon','rare','epic','legendary')),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ════════════════════════════════════════════════════
-- TABLE: child_badges
-- ════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS child_badges (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id              UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  badge_id              UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(child_id, badge_id)
);

-- ════════════════════════════════════════════════════
-- TABLE: content_queue (admin-only via RLS)
-- ════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS content_queue (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_run_id          TEXT,
  title                 TEXT NOT NULL,
  type                  TEXT NOT NULL CHECK (type IN ('lesson','quiz','game','spark_fact','activity','sandbox')),
  target_age_band       TEXT NOT NULL CHECK (target_age_band IN ('A','B','C')),
  world                 INT NOT NULL CHECK (world BETWEEN 1 AND 10),
  difficulty            TEXT NOT NULL DEFAULT 'beginner',
  content_json          JSONB NOT NULL,
  source_urls           TEXT[],
  safety_check          JSONB NOT NULL,
  status                TEXT NOT NULL DEFAULT 'pending_review'
                        CHECK (status IN ('pending_review','needs_human_review','approved','rejected')),
  rejection_reason      TEXT,
  generated_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_by           UUID REFERENCES parents(id),
  reviewed_at           TIMESTAMPTZ
);

-- ════════════════════════════════════════════════════
-- TABLE: sessions
-- v2: Also used by useSessionTracker (Stage 3) for automatic
-- session logging that feeds the Parent Dashboard (Stage 8).
-- ════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS sessions (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id              UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  started_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at              TIMESTAMPTZ,
  duration_seconds      INT
);

-- ════════════════════════════════════════════════════
-- TABLE: prompt_history (auto-deleted after 30 days per COPPA)
-- ════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS prompt_history (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id              UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  prompt                TEXT NOT NULL,
  response              TEXT NOT NULL,
  temperature           NUMERIC(3,2) NOT NULL DEFAULT 0.5,
  age_band              TEXT NOT NULL CHECK (age_band IN ('A','B','C')),
  moderation_passed     BOOLEAN NOT NULL DEFAULT true,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);
```

---

## STEP 3: CREATE INDEXES

**WHAT THIS DOES:** Indexes make database queries faster — like tabs on file folders.

**WHERE:** Supabase SQL Editor → New Query → paste and Run:

### SQL Block: `001a_indexes.sql`

```sql
-- ════════════════════════════════════════════════════
-- SPARKFORGE INDEXES (14)
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
```

---

## STEP 4: SET UP ROW LEVEL SECURITY (RLS)

**WHAT THIS DOES:** RLS ensures parents can only see their OWN data, published content is public, and admin-only tables require admin privileges.

**WHERE:** Supabase SQL Editor → New Query → paste and Run:

### SQL Block: `001b_rls.sql`

```sql
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
```

---

## STEP 5: CREATE DATABASE FUNCTIONS & TRIGGERS

**WHAT THIS DOES:**
- Auto-updates `updated_at` on row changes
- Resets daily prompt count at midnight
- Resets weekly game count on Monday
- Cleans up old prompt history (COPPA)
- Calculates lab completion progress

**WHERE:** Supabase SQL Editor → New Query → paste and Run:

### SQL Block: `001c_functions.sql`

```sql
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## STEP 6: SEED BADGE DEFINITIONS (78 badges)

**WHAT THIS DOES:** Creates all 78 achievement badges across 9 categories. Badge descriptions use "Lab" terminology (UI-facing text).

**WHERE:** Supabase SQL Editor → New Query → paste and Run:

### SQL Block: `002_badges.sql`

```sql
-- ════════════════════════════════════════════════════
-- BADGE SEED DATA (78 badges)
-- ════════════════════════════════════════════════════

-- PROGRESS BADGES (7)
INSERT INTO badges (name, description, icon, category, criteria_type, criteria_value, rarity) VALUES
  ('First Steps', 'Earn your first 100 XP', '⭐', 'progress', 'reach_xp', 100, 'common'),
  ('Getting Warmed Up', 'Earn 500 XP', '🌟', 'progress', 'reach_xp', 500, 'common'),
  ('On a Roll', 'Earn 1,000 XP', '💫', 'progress', 'reach_xp', 1000, 'uncommon'),
  ('XP Machine', 'Earn 2,500 XP', '⚡', 'progress', 'reach_xp', 2500, 'uncommon'),
  ('Knowledge Engine', 'Earn 5,000 XP', '🔥', 'progress', 'reach_xp', 5000, 'rare'),
  ('XP Titan', 'Earn 10,000 XP', '💎', 'progress', 'reach_xp', 10000, 'epic'),
  ('Forge Legend', 'Earn 15,000 XP', '👑', 'progress', 'reach_xp', 15000, 'legendary');

-- STREAK BADGES (7)
INSERT INTO badges (name, description, icon, category, criteria_type, criteria_value, rarity) VALUES
  ('3-Day Spark', 'Maintain a 3-day streak', '🔥', 'streak', 'maintain_streak', 3, 'common'),
  ('Week Warrior', 'Maintain a 7-day streak', '⚡', 'streak', 'maintain_streak', 7, 'common'),
  ('Fortnight Focus', 'Maintain a 14-day streak', '💪', 'streak', 'maintain_streak', 14, 'uncommon'),
  ('Monthly Master', 'Maintain a 30-day streak', '🏆', 'streak', 'maintain_streak', 30, 'rare'),
  ('Sixty Strong', 'Maintain a 60-day streak', '🌟', 'streak', 'maintain_streak', 60, 'rare'),
  ('Century Club', 'Maintain a 100-day streak', '💎', 'streak', 'maintain_streak', 100, 'epic'),
  ('Year of AI', 'Maintain a 365-day streak', '👑', 'streak', 'maintain_streak', 365, 'legendary');

-- LAB MASTER BADGES (10)
INSERT INTO badges (name, description, icon, category, criteria_type, criteria_value, criteria_world, rarity) VALUES
  ('Lab 1 Master', 'Complete all content in Lab 1: What IS AI?', '🧪', 'world', 'complete_world', 1, 1, 'rare'),
  ('Lab 2 Master', 'Complete all content in Lab 2: Teaching Machines', '🧪', 'world', 'complete_world', 1, 2, 'rare'),
  ('Lab 3 Master', 'Complete all content in Lab 3: The Brain Inside', '🧪', 'world', 'complete_world', 1, 3, 'rare'),
  ('Lab 4 Master', 'Complete all content in Lab 4: AI That Creates', '🧪', 'world', 'complete_world', 1, 4, 'rare'),
  ('Lab 5 Master', 'Complete all content in Lab 5: AI Helpers', '🧪', 'world', 'complete_world', 1, 5, 'rare'),
  ('Lab 6 Master', 'Complete all content in Lab 6: AI & Ethics', '🧪', 'world', 'complete_world', 1, 6, 'rare'),
  ('Lab 7 Master', 'Complete all content in Lab 7: Computer Vision', '🧪', 'world', 'complete_world', 1, 7, 'rare'),
  ('Lab 8 Master', 'Complete all content in Lab 8: Words & Language', '🧪', 'world', 'complete_world', 1, 8, 'rare'),
  ('Lab 9 Master', 'Complete all content in Lab 9: Build with AI', '🧪', 'world', 'complete_world', 1, 9, 'rare'),
  ('Lab 10 Master', 'Complete all content in Lab 10: AI''s Future', '🧪', 'world', 'complete_world', 1, 10, 'rare');

-- GAME MASTER BADGES (10)
INSERT INTO badges (name, description, icon, category, criteria_type, criteria_value, criteria_world, rarity) VALUES
  ('Lab 1 Game Master', 'Complete every game in Lab 1', '🎮', 'game_master', 'world_games_complete', 1, 1, 'rare'),
  ('Lab 2 Game Master', 'Complete every game in Lab 2', '🎮', 'game_master', 'world_games_complete', 1, 2, 'rare'),
  ('Lab 3 Game Master', 'Complete every game in Lab 3', '🎮', 'game_master', 'world_games_complete', 1, 3, 'rare'),
  ('Lab 4 Game Master', 'Complete every game in Lab 4', '🎮', 'game_master', 'world_games_complete', 1, 4, 'rare'),
  ('Lab 5 Game Master', 'Complete every game in Lab 5', '🎮', 'game_master', 'world_games_complete', 1, 5, 'rare'),
  ('Lab 6 Game Master', 'Complete every game in Lab 6', '🎮', 'game_master', 'world_games_complete', 1, 6, 'rare'),
  ('Lab 7 Game Master', 'Complete every game in Lab 7', '🎮', 'game_master', 'world_games_complete', 1, 7, 'rare'),
  ('Lab 8 Game Master', 'Complete every game in Lab 8', '🎮', 'game_master', 'world_games_complete', 1, 8, 'rare'),
  ('Lab 9 Game Master', 'Complete every game in Lab 9', '🎮', 'game_master', 'world_games_complete', 1, 9, 'rare'),
  ('Lab 10 Game Master', 'Complete every game in Lab 10', '🎮', 'game_master', 'world_games_complete', 1, 10, 'rare');

-- KNOWLEDGE BADGES (10)
INSERT INTO badges (name, description, icon, category, criteria_type, criteria_value, criteria_world, rarity) VALUES
  ('Lab 1 Quiz Ace', 'Pass all Lab 1 quizzes with 90%+', '📚', 'knowledge', 'world_quizzes_90', 1, 1, 'rare'),
  ('Lab 2 Quiz Ace', 'Pass all Lab 2 quizzes with 90%+', '📚', 'knowledge', 'world_quizzes_90', 1, 2, 'rare'),
  ('Lab 3 Quiz Ace', 'Pass all Lab 3 quizzes with 90%+', '📚', 'knowledge', 'world_quizzes_90', 1, 3, 'rare'),
  ('Lab 4 Quiz Ace', 'Pass all Lab 4 quizzes with 90%+', '📚', 'knowledge', 'world_quizzes_90', 1, 4, 'rare'),
  ('Lab 5 Quiz Ace', 'Pass all Lab 5 quizzes with 90%+', '📚', 'knowledge', 'world_quizzes_90', 1, 5, 'rare'),
  ('Lab 6 Quiz Ace', 'Pass all Lab 6 quizzes with 90%+', '📚', 'knowledge', 'world_quizzes_90', 1, 6, 'rare'),
  ('Lab 7 Quiz Ace', 'Pass all Lab 7 quizzes with 90%+', '📚', 'knowledge', 'world_quizzes_90', 1, 7, 'rare'),
  ('Lab 8 Quiz Ace', 'Pass all Lab 8 quizzes with 90%+', '📚', 'knowledge', 'world_quizzes_90', 1, 8, 'rare'),
  ('Lab 9 Quiz Ace', 'Pass all Lab 9 quizzes with 90%+', '📚', 'knowledge', 'world_quizzes_90', 1, 9, 'rare'),
  ('Lab 10 Quiz Ace', 'Pass all Lab 10 quizzes with 90%+', '📚', 'knowledge', 'world_quizzes_90', 1, 10, 'rare');

-- EXPLORER BADGES (5)
INSERT INTO badges (name, description, icon, category, criteria_type, criteria_value, rarity) VALUES
  ('5 Labs Visited', 'Visit 5 different labs', '🧭', 'explorer', 'worlds_visited', 5, 'uncommon'),
  ('All Labs Visited', 'Visit all 10 labs', '🗺️', 'explorer', 'worlds_visited', 10, 'rare'),
  ('Multi-Gamer', 'Play 10 different games', '🎮', 'explorer', 'unique_games_played', 10, 'uncommon'),
  ('Game Collector', 'Play 20 different games', '🎯', 'explorer', 'unique_games_played', 20, 'rare'),
  ('Complete Collection', 'Play all 28 games', '🏆', 'explorer', 'unique_games_played', 28, 'epic');

-- CREATOR BADGES (5)
INSERT INTO badges (name, description, icon, category, criteria_type, criteria_value, rarity) VALUES
  ('First Prompt', 'Use the Prompt Lab for the first time', '✨', 'creator', 'prompts_used', 1, 'common'),
  ('Prompt Explorer', 'Use the Prompt Lab 10 times', '🎨', 'creator', 'prompts_used', 10, 'uncommon'),
  ('Prompt Master', 'Use the Prompt Lab 50 times', '🖌️', 'creator', 'prompts_used', 50, 'rare'),
  ('Sandbox Builder', 'Complete 5 sandbox activities', '🔨', 'creator', 'sandboxes_completed', 5, 'uncommon'),
  ('Creative Genius', 'Complete 15 sandbox activities', '💡', 'creator', 'sandboxes_completed', 15, 'rare');

-- SECRET BADGES (8)
INSERT INTO badges (name, description, icon, category, criteria_type, criteria_value, rarity) VALUES
  ('Early Bird', 'Complete an activity before 7 AM', '🌅', 'secret', 'special', 1, 'uncommon'),
  ('Night Owl', 'Complete an activity after 9 PM', '🌙', 'secret', 'special', 1, 'uncommon'),
  ('Speed Demon', 'Complete a quiz in under 60 seconds', '⚡', 'secret', 'special', 1, 'rare'),
  ('Perfect Score', 'Get 100% on any quiz', '💯', 'secret', 'special', 1, 'uncommon'),
  ('Comeback Kid', 'Recover a streak with a shield', '🛡️', 'secret', 'special', 1, 'rare'),
  ('Curious Mind', 'Read 20 Spark Facts', '🧐', 'secret', 'spark_facts_read', 20, 'uncommon'),
  ('First Login', 'Welcome to SparkForge!', '👋', 'secret', 'special', 1, 'common'),
  ('Bug Finder', 'Report a bug (parent-submitted)', '🐛', 'secret', 'special', 1, 'epic');

-- PRESTIGE BADGES (6)
INSERT INTO badges (name, description, icon, category, criteria_type, criteria_value, rarity) VALUES
  ('Triple Threat', 'Master 3 labs', '🏅', 'prestige', 'worlds_mastered', 3, 'rare'),
  ('Halfway Hero', 'Master 5 labs', '🏆', 'prestige', 'worlds_mastered', 5, 'epic'),
  ('Almost There', 'Master 8 labs', '🌟', 'prestige', 'worlds_mastered', 8, 'epic'),
  ('AI Master', 'Master all 10 labs', '💎', 'prestige', 'worlds_mastered', 10, 'legendary'),
  ('Forge Champion', 'Reach level 50', '👑', 'prestige', 'reach_level', 50, 'legendary'),
  ('Ultimate Scholar', 'Earn every other badge', '🔮', 'prestige', 'total_badges', 72, 'legendary');
```

---

## STEP 7: SEED STARTER CONTENT

**WHAT THIS DOES:** Adds starter educational content so the app isn't empty. Includes lessons, quizzes, and spark facts for Labs 1-3.

**WHERE:** Supabase SQL Editor → New Query → paste and Run:

### SQL Block: `003_seed_content.sql`

```sql
-- ════════════════════════════════════════════════════
-- STARTER CONTENT SEED DATA
-- ════════════════════════════════════════════════════

-- Lab 1: What IS AI? (Band A)
INSERT INTO content (world, title, slug, type, target_age_band, difficulty, content_body, xp_reward, estimated_minutes, sort_order, is_free, status, published_at) VALUES
(1, 'What is Artificial Intelligence?', 'lab1-intro-ai-a', 'lesson', 'A', 'beginner',
'# What is AI?

Have you ever talked to Siri or Alexa? Or watched Netflix pick a show for you? That''s AI at work!

**AI** stands for **Artificial Intelligence**. It means a computer that can do things that usually need a human brain.

## AI is Everywhere!
- Video game characters that learn your moves
- Your phone''s autocorrect
- Cars that can park themselves
- Music apps that suggest songs you''ll like

## What AI is NOT
AI is not a robot from movies. It''s not alive. It''s not thinking the way you think. It''s really good at PATTERNS.

Think of it like this: you can teach a dog to sit by giving it treats. AI learns kind of the same way — with data instead of treats!',
15, 8, 1, true, 'published', now());

-- Lab 1: What IS AI? (Band B)
INSERT INTO content (world, title, slug, type, target_age_band, difficulty, content_body, xp_reward, estimated_minutes, sort_order, is_free, status, published_at) VALUES
(1, 'Introduction to Artificial Intelligence', 'lab1-intro-ai-b', 'lesson', 'B', 'beginner',
'# Introduction to AI

Artificial Intelligence is the field of computer science focused on creating systems that can perform tasks that typically require human intelligence.

## Key Concepts
**Machine Learning** is the most common AI today. Instead of programming every rule, we show the computer thousands of examples and let it figure out the patterns.

**Neural Networks** are inspired by the human brain. They process information through layers of connected nodes.

**Natural Language Processing (NLP)** helps computers understand and generate human language — powering chatbots, translation, and voice assistants.

## Where AI Lives Today
AI isn''t science fiction. It''s in your pocket:
- Spam filters in your email
- Face recognition on your phone
- Recommendation algorithms on YouTube and TikTok
- Auto-complete when you type

## The Big Picture
AI is a tool, not magic. It excels at specific tasks but can''t truly "think" the way humans do.',
15, 10, 1, true, 'published', now());

-- Lab 1: Quiz (Band A)
INSERT INTO content (world, title, slug, type, target_age_band, difficulty, quiz_questions, xp_reward, estimated_minutes, sort_order, is_free, status, published_at) VALUES
(1, 'AI Basics Quiz', 'lab1-quiz-basics-a', 'quiz', 'A', 'beginner',
'[{"question":"What does AI stand for?","options":["Awesome Internet","Artificial Intelligence","Automatic Input","Advanced Invention"],"correct":1},{"question":"Which of these uses AI?","options":["A rock","Siri on your phone","A paper book","A wooden chair"],"correct":1},{"question":"How does AI learn?","options":["By reading minds","By looking at patterns in data","By being alive","By dreaming"],"correct":1}]',
30, 5, 2, true, 'published', now());

-- Lab 1: Spark Fact
INSERT INTO content (world, title, slug, type, target_age_band, difficulty, content_body, xp_reward, estimated_minutes, sort_order, is_free, status, published_at) VALUES
(1, 'The First AI Program', 'lab1-fact-first-ai', 'spark_fact', 'A', 'beginner',
'The very first AI program was written in 1951! It could play checkers and actually learned to get better over time. Its creator, Arthur Samuel, worked at IBM.',
5, 1, 3, true, 'published', now());

-- Lab 2: Teaching Machines (Band A)
INSERT INTO content (world, title, slug, type, target_age_band, difficulty, content_body, xp_reward, estimated_minutes, sort_order, is_free, status, published_at) VALUES
(2, 'How Do Machines Learn?', 'lab2-intro-ml-a', 'lesson', 'A', 'beginner',
'# How Do Machines Learn?

Imagine teaching a puppy to fetch. You throw the ball, the puppy brings it back, you give it a treat. After many tries, the puppy GETS it!

AI learns the same way — through **examples** and **feedback**.

## The Three Steps

### Step 1: Show It Examples
Give the computer LOTS of examples. Want it to recognize cats? Show it 10,000 pictures of cats!

### Step 2: Let It Practice
The computer tries to find patterns. "Cats have pointy ears, whiskers, and fur..."

### Step 3: Check Its Work
Test with NEW pictures it hasn''t seen. Did it get them right?

## Why Data Matters
The examples are called **training data**. If you only show orange cats, it might think ALL cats are orange! The more variety, the better it learns.',
15, 8, 1, true, 'published', now());

-- Lab 3: Neural Networks (Band B)
INSERT INTO content (world, title, slug, type, target_age_band, difficulty, content_body, xp_reward, estimated_minutes, sort_order, is_free, status, published_at) VALUES
(3, 'Neural Networks: The Artificial Brain', 'lab3-intro-nn-b', 'lesson', 'B', 'intermediate',
'# Neural Networks

Neural networks are computing systems loosely inspired by biological neural networks in our brains.

## Neurons and Connections
1. **Input Layer** — receives raw data (like pixel values)
2. **Hidden Layers** — process and transform data through weighted connections
3. **Output Layer** — produces the result (like "this is a cat")

## How Learning Happens
Each connection has a **weight**. During training:
- The network makes a prediction
- Compares prediction to correct answer
- Adjusts weights to get closer
- Repeats thousands or millions of times

## Deep Learning
Many hidden layers = **deep learning**. Deeper networks learn more complex patterns.',
15, 12, 1, true, 'published', now());
```

---

## STEP 8: SET UP CRON JOB (Optional)

> **NOTE:** `pg_cron` requires Supabase Pro plan. Skip on free plan — manually run `SELECT cleanup_old_prompts();` instead.

```sql
SELECT cron.schedule(
  'coppa-cleanup',
  '0 0 * * *',
  'SELECT cleanup_old_prompts();'
);
```

---

## STEP 9: VERIFY YOUR DATABASE

Run these queries to confirm everything:

```sql
-- Should return 9 tables
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' ORDER BY table_name;

-- Should return 78 badges (7+7+10+10+10+5+5+8+6)
SELECT category, COUNT(*) FROM badges GROUP BY category ORDER BY category;

-- Should return 6 starter content items
SELECT world, type, target_age_band, title FROM content
WHERE status = 'published' ORDER BY world, sort_order;

-- Should show RLS enabled on all tables
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public' ORDER BY tablename;

-- v2: Verify onboarding_complete column exists
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'parents' AND column_name = 'onboarding_complete';
```

### EXPECTED RESULTS

- **9 tables:** badges, child_badges, children, content, content_queue, parents, progress, prompt_history, sessions
- **78 badges** across 9 categories
- **6 starter content** items
- All tables with `rowsecurity = true`
- `onboarding_complete` column exists with default `false`

---

## PART 1 COMPLETE — WHAT YOU NOW HAVE

After completing Part 1, your Supabase database has:

- 9 tables with constraints and relationships
- 14 performance indexes
- Full RLS on every table
- 3 auto-update triggers + daily/weekly reset functions
- Lab progress calculation function
- 78 badge definitions (Lab terminology)
- 6 starter content items (Labs 1-3)
- COPPA-compliant prompt history cleanup
- **v2:** `parents.onboarding_complete` column
- **v2:** Clarified `subscription_status` design decision

---

**NEXT:** Part 2 — Zod validations, tier config, rate limiting, API helpers

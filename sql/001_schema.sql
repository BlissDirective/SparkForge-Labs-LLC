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
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  stripe_customer_id TEXT UNIQUE,
  subscription_tier TEXT NOT NULL DEFAULT 'free'
    CHECK (subscription_tier IN ('free', 'plus', 'forge')),
  subscription_status TEXT NOT NULL DEFAULT 'active'
    CHECK (subscription_status IN ('active', 'past_due', 'canceled', 'trialing')),
  coppa_consent_at TIMESTAMPTZ,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  onboarding_complete BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ════════════════════════════════════════════════════
-- TABLE: children
-- ════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS children (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  age INT NOT NULL CHECK (age BETWEEN 5 AND 18),
  age_band TEXT NOT NULL CHECK (age_band IN ('A', 'B', 'C')),
  xp INT NOT NULL DEFAULT 0 CHECK (xp >= 0),
  level INT NOT NULL DEFAULT 1 CHECK (level >= 1),
  spark_coins INT NOT NULL DEFAULT 0 CHECK (spark_coins >= 0),
  streak_count INT NOT NULL DEFAULT 0 CHECK (streak_count >= 0),
  streak_last_date DATE,
  streak_shield BOOLEAN NOT NULL DEFAULT false,
  avatar_config JSONB DEFAULT '{}',
  preferences JSONB DEFAULT '{}',
  prompts_used_today INT NOT NULL DEFAULT 0,
  prompts_reset_date DATE NOT NULL DEFAULT CURRENT_DATE,
  games_played_this_week INT NOT NULL DEFAULT 0,
  games_reset_week DATE NOT NULL DEFAULT date_trunc('week', CURRENT_DATE)::date,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ════════════════════════════════════════════════════
-- TABLE: content
-- The "world" column maps to "Lab" in the UI (1-10).
-- ════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  world INT NOT NULL CHECK (world BETWEEN 1 AND 10),
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  type TEXT NOT NULL CHECK (type IN ('lesson','quiz','game','spark_fact','activity','sandbox')),
  target_age_band TEXT NOT NULL CHECK (target_age_band IN ('A','B','C')),
  difficulty TEXT NOT NULL DEFAULT 'beginner'
    CHECK (difficulty IN ('beginner','intermediate','advanced')),
  content_body TEXT NOT NULL DEFAULT '',
  quiz_questions JSONB,
  game_config JSONB,
  xp_reward INT NOT NULL DEFAULT 15 CHECK (xp_reward >= 0),
  estimated_minutes INT NOT NULL DEFAULT 10 CHECK (estimated_minutes > 0),
  sort_order INT NOT NULL DEFAULT 0,
  is_free BOOLEAN NOT NULL DEFAULT true,
  is_agent_generated BOOLEAN NOT NULL DEFAULT false,
  source_urls TEXT[],
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('published','pending_review','needs_human_review','rejected','draft')),
  safety_check JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES parents(id),
  reviewed_at TIMESTAMPTZ
);

-- ════════════════════════════════════════════════════
-- TABLE: progress
-- ════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  content_id UUID NOT NULL REFERENCES content(id) ON DELETE CASCADE,
  completed BOOLEAN NOT NULL DEFAULT false,
  score NUMERIC(5,2),
  time_spent_seconds INT NOT NULL DEFAULT 0 CHECK (time_spent_seconds >= 0),
  attempts INT NOT NULL DEFAULT 1 CHECK (attempts >= 1),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(child_id, content_id)
);

-- ════════════════════════════════════════════════════
-- TABLE: badges (68 total across 9 categories)
-- category 'world' in DB = "Lab Master" badges in UI
-- ════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'progress','streak','world','game_master','knowledge','explorer','creator','secret','prestige'
  )),
  criteria_type TEXT NOT NULL,
  criteria_value INT NOT NULL CHECK (criteria_value > 0),
  criteria_world INT CHECK (criteria_world IS NULL OR (criteria_world BETWEEN 1 AND 10)),
  rarity TEXT NOT NULL DEFAULT 'common'
    CHECK (rarity IN ('common','uncommon','rare','epic','legendary')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ════════════════════════════════════════════════════
-- TABLE: child_badges
-- ════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS child_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  badge_id UUID NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(child_id, badge_id)
);

-- ════════════════════════════════════════════════════
-- TABLE: content_queue (admin-only via RLS)
-- ════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS content_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_run_id TEXT,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('lesson','quiz','game','spark_fact','activity','sandbox')),
  target_age_band TEXT NOT NULL CHECK (target_age_band IN ('A','B','C')),
  world INT NOT NULL CHECK (world BETWEEN 1 AND 10),
  difficulty TEXT NOT NULL DEFAULT 'beginner',
  content_json JSONB NOT NULL,
  source_urls TEXT[],
  safety_check JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending_review'
    CHECK (status IN ('pending_review','needs_human_review','approved','rejected')),
  rejection_reason TEXT,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_by UUID REFERENCES parents(id),
  reviewed_at TIMESTAMPTZ
);

-- ════════════════════════════════════════════════════
-- TABLE: sessions
-- v2: Also used by useSessionTracker (Stage 3) for automatic
--   session logging that feeds the Parent Dashboard (Stage 8).
-- ════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  duration_seconds INT
);

-- ════════════════════════════════════════════════════
-- TABLE: prompt_history (auto-deleted after 30 days per COPPA)
-- ════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS prompt_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  response TEXT NOT NULL,
  temperature NUMERIC(3,2) NOT NULL DEFAULT 0.5,
  age_band TEXT NOT NULL CHECK (age_band IN ('A','B','C')),
  moderation_passed BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

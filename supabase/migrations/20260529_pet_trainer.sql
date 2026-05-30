-- ════════════════════════════════════════════════════
-- MIGRATION: Pet Trainer Virtual Pet System
-- Date: 2026-05-29
-- Phase 4: Virtual pet retention anchor
-- ════════════════════════════════════════════════════

-- ─── Pet States ───
CREATE TABLE IF NOT EXISTS pet_states (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL UNIQUE REFERENCES children(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Pixel',
  species TEXT NOT NULL DEFAULT 'pixel' CHECK (species IN ('pixel', 'nebula', 'spark')),
  stage TEXT NOT NULL DEFAULT 'egg' CHECK (stage IN ('egg', 'baby', 'child', 'teen', 'adult')),
  evolution TEXT NOT NULL DEFAULT 'none' CHECK (evolution IN ('none', 'scholar', 'athlete', 'artist')),
  hunger NUMERIC(5,2) NOT NULL DEFAULT 80 CHECK (hunger >= 0 AND hunger <= 100),
  happiness NUMERIC(5,2) NOT NULL DEFAULT 80 CHECK (happiness >= 0 AND happiness <= 100),
  energy NUMERIC(5,2) NOT NULL DEFAULT 80 CHECK (energy >= 0 AND energy <= 100),
  cleanliness NUMERIC(5,2) NOT NULL DEFAULT 80 CHECK (cleanliness >= 0 AND cleanliness <= 100),
  care_points INTEGER NOT NULL DEFAULT 50 CHECK (care_points >= 0),
  total_care_points INTEGER NOT NULL DEFAULT 0,
  age_days INTEGER NOT NULL DEFAULT 0,
  care_quality INTEGER NOT NULL DEFAULT 50 CHECK (care_quality >= 0 AND care_quality <= 100),
  consecutive_care_days INTEGER NOT NULL DEFAULT 0,
  last_care_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  is_sleeping BOOLEAN NOT NULL DEFAULT false,
  accessories JSONB NOT NULL DEFAULT '[]'::jsonb,
  tricks_learned JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pet_states_child ON pet_states(child_id);

-- ─── Pet Care Logs ───
CREATE TABLE IF NOT EXISTS pet_care_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES pet_states(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('feed', 'play', 'clean', 'rest', 'train')),
  need_changed TEXT,
  old_value NUMERIC(5,2),
  new_value NUMERIC(5,2),
  cp_cost INTEGER NOT NULL DEFAULT 0,
  xp_earned INTEGER NOT NULL DEFAULT 0,
  trick_unlocked TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_pet_care_logs_pet ON pet_care_logs(pet_id, created_at DESC);
CREATE INDEX idx_pet_care_logs_child ON pet_care_logs(child_id, created_at DESC);

-- ─── Pet Accessories ───
CREATE TABLE IF NOT EXISTS pet_accessories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  accessory_id TEXT NOT NULL,
  equipped BOOLEAN NOT NULL DEFAULT false,
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(child_id, accessory_id)
);

CREATE INDEX idx_pet_accessories_child ON pet_accessories(child_id);

-- ─── RLS Policies ───
ALTER TABLE pet_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_care_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_accessories ENABLE ROW LEVEL SECURITY;

CREATE POLICY pet_states_parent ON pet_states
  FOR ALL USING (
    EXISTS (SELECT 1 FROM children WHERE children.id = pet_states.child_id AND children.parent_id = auth.uid())
  );

CREATE POLICY pet_care_logs_parent ON pet_care_logs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM children WHERE children.id = pet_care_logs.child_id AND children.parent_id = auth.uid())
  );

CREATE POLICY pet_accessories_parent ON pet_accessories
  FOR ALL USING (
    EXISTS (SELECT 1 FROM children WHERE children.id = pet_accessories.child_id AND children.parent_id = auth.uid())
  );

-- ─── Trigger: Update updated_at ───
CREATE OR REPLACE FUNCTION update_pet_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_pet_updated_at ON pet_states;
CREATE TRIGGER trigger_pet_updated_at
  BEFORE UPDATE ON pet_states
  FOR EACH ROW
  EXECUTE FUNCTION update_pet_updated_at();

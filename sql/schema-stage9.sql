-- ════════════════════════════════════════════════════
-- STAGE 9 SCHEMA ADDITIONS
-- Agent run logging, admin flag, indexes
-- Safe to re-run: uses IF NOT EXISTS throughout
-- ════════════════════════════════════════════════════

-- Admin flag on parents (may already exist from Stage 2)
ALTER TABLE parents ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Agent run history table
CREATE TABLE IF NOT EXISTS agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id TEXT UNIQUE NOT NULL,
  findings_count INT DEFAULT 0,
  generated_count INT DEFAULT 0,
  approved_count INT DEFAULT 0,
  flagged_count INT DEFAULT 0,
  rejected_count INT DEFAULT 0,
  duration_ms INT,
  errors JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Indexes for content_queue (table exists from Stage 2)
CREATE INDEX IF NOT EXISTS idx_content_queue_status
  ON content_queue(status);

CREATE INDEX IF NOT EXISTS idx_content_queue_generated
  ON content_queue(generated_at DESC);

CREATE INDEX IF NOT EXISTS idx_content_queue_world
  ON content_queue(world);

-- Indexes for agent_runs
CREATE INDEX IF NOT EXISTS idx_agent_runs_created
  ON agent_runs(created_at DESC);

-- RLS on agent_runs (admin-only)
ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'agent_runs' AND policyname = 'agent_runs_admin_only'
  ) THEN
    CREATE POLICY agent_runs_admin_only ON agent_runs
      FOR ALL USING (
        EXISTS (SELECT 1 FROM parents WHERE id = auth.uid() AND is_admin = true)
      );
  END IF;
END $$;

-- Make yourself admin (replace with your email)
-- UPDATE parents SET is_admin = true WHERE email = 'your@email.com';

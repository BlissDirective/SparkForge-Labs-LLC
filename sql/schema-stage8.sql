-- ════════════════════════════════════════════════════
-- STAGE 8 SCHEMA ADDITIONS
-- Stripe & subscription fields + time limit
-- Safe to re-run: uses IF NOT EXISTS throughout
-- ════════════════════════════════════════════════════

-- Subscription columns on parents table
ALTER TABLE parents
  ADD COLUMN IF NOT EXISTS subscription_tier TEXT
  DEFAULT 'free'
  CHECK (subscription_tier IN ('free', 'plus', 'forge'));

ALTER TABLE parents
  ADD COLUMN IF NOT EXISTS subscription_status TEXT
  DEFAULT 'none'
  CHECK (subscription_status IN ('none', 'active', 'past_due', 'canceled'));

ALTER TABLE parents
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;

-- v2 [ENH-8C]: Daily time limit per child (null = unlimited)
ALTER TABLE children
  ADD COLUMN IF NOT EXISTS daily_time_limit_minutes INTEGER DEFAULT NULL;

-- Index for Stripe customer lookups
CREATE INDEX IF NOT EXISTS idx_parents_stripe
  ON parents(stripe_customer_id)
  WHERE stripe_customer_id IS NOT NULL;

-- Subscription events table (logs all Stripe webhook events)
CREATE TABLE IF NOT EXISTS subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES parents(id),
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  data JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS on subscription_events
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;

-- Admin-only access to subscription events
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'subscription_events'
      AND policyname = 'sub_events_admin_only'
  ) THEN
    CREATE POLICY sub_events_admin_only
      ON subscription_events
      FOR ALL
      USING (
        EXISTS (
          SELECT 1 FROM parents
          WHERE parents.id = auth.uid()
            AND parents.is_admin = true
        )
      );
  END IF;
END $$;

-- Ensure parent can read own subscription data
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'parents'
      AND policyname = 'parent_read_own_sub'
  ) THEN
    CREATE POLICY parent_read_own_sub
      ON parents
      FOR SELECT
      USING (id = auth.uid());
  END IF;
END $$;

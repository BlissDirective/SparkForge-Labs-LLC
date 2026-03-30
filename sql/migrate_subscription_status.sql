-- ════════════════════════════════════════════════════
-- MIGRATION: Consolidate subscription_status CHECK constraint
-- CRIT-004: Three conflicting CHECK constraints across SQL files.
-- Canonical values: none, active, past_due, canceled, trialing, paused
-- Default: 'none'
-- Run ONCE on existing databases to align constraint.
-- ════════════════════════════════════════════════════

-- Drop any existing named or unnamed constraint on subscription_status
ALTER TABLE parents DROP CONSTRAINT IF EXISTS parents_subscription_status_check;

-- Re-add the canonical consolidated constraint
ALTER TABLE parents ADD CONSTRAINT parents_subscription_status_check
  CHECK (subscription_status IN ('none', 'active', 'past_due', 'canceled', 'trialing', 'paused'));

-- Update default from 'active' to 'none' (new accounts start without a subscription)
ALTER TABLE parents ALTER COLUMN subscription_status SET DEFAULT 'none';

-- Migrate any rows that have 'active' as a default-set value (optional — only if needed)
-- UPDATE parents SET subscription_status = 'none' WHERE subscription_status = 'active' AND stripe_customer_id IS NULL;

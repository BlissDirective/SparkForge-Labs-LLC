-- ════════════════════════════════════════════════════
-- Migration 009: Split Sensitive Subscription Event Data
-- Final-Audit 04-15-2026 finding DB-CRIT-001 (Option C)
--
-- Goal: subscription_events keeps only the metadata that parents may
-- legitimately see (event type, timestamp, parent_id, processed flag).
-- The full Stripe event JSON moves into subscription_events_detail
-- which is admin-only.
--
-- This enables future billing-history UX ("you upgraded to Plus on Apr
-- 15") without exposing payment-method details, customer IDs, or other
-- Stripe internals to anyone but admins.
--
-- DEPENDENCY: This migration ASSUMES sql/008 ran first (adds the
-- `processed` and `processed_at` columns).
--
-- Apply order:
--   001_schema.sql -> 001a_indexes.sql -> 002_rls.sql -> ... ->
--   schema-stage8.sql -> ... -> 008_subscription_events_processed.sql ->
--   009_subscription_events_split.sql (THIS FILE)
-- ════════════════════════════════════════════════════

-- ─── 1. Detail table (sensitive data, admin-only) ───────────────────
CREATE TABLE IF NOT EXISTS subscription_events_detail (
  stripe_event_id TEXT PRIMARY KEY
    REFERENCES subscription_events(stripe_event_id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE subscription_events_detail ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'subscription_events_detail'
      AND policyname = 'sub_events_detail_admin_only'
  ) THEN
    CREATE POLICY sub_events_detail_admin_only
      ON subscription_events_detail
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

-- ─── 2. Migrate existing data column ────────────────────────────────
-- Backfill detail table from any existing rows that still carry data.
-- ON CONFLICT DO NOTHING handles partial re-runs.
INSERT INTO subscription_events_detail (stripe_event_id, data, created_at)
SELECT stripe_event_id, data, COALESCE(created_at, now())
  FROM subscription_events
 WHERE data IS NOT NULL
ON CONFLICT (stripe_event_id) DO NOTHING;

-- ─── 3. Drop data column from metadata table ────────────────────────
-- Done last so backfill doesn't lose data. Idempotent via IF EXISTS.
ALTER TABLE subscription_events
  DROP COLUMN IF EXISTS data;

-- ─── 4. Add parent SELECT policy on metadata table ──────────────────
-- Admin-only policy already exists (sub_events_admin_only, FOR ALL).
-- Add a non-overlapping SELECT-only policy so parents can read their
-- own subscription event timeline without exposing the data column
-- (which now lives in the admin-only detail table).
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'subscription_events'
      AND policyname = 'sub_events_select_own'
  ) THEN
    CREATE POLICY sub_events_select_own
      ON subscription_events
      FOR SELECT
      USING (parent_id = auth.uid());
  END IF;
END $$;

-- ─── 5. Index for parent_id lookups (DB-MED-001 partial fix) ────────
CREATE INDEX IF NOT EXISTS idx_subscription_events_parent_id
  ON subscription_events (parent_id)
  WHERE parent_id IS NOT NULL;

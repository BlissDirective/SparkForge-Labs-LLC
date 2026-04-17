-- ════════════════════════════════════════════════════
-- Migration 008: Webhook Idempotency Guard
-- Final-Audit 04-15-2026 finding PAY-CRIT-001 (Option B)
--
-- Adds a `processed` flag + timestamp to subscription_events so the
-- Stripe webhook can short-circuit replayed deliveries before running
-- business logic (parent tier updates).
--
-- Prior behavior: every webhook delivery (including Stripe retries and
-- replays) re-ran the parent UPDATE statements. The event-log upsert
-- already deduped via UNIQUE(stripe_event_id), but the business logic
-- did not. Could cause subscription tier corruption if a stale
-- checkout.session.completed event was replayed after a downgrade.
--
-- After this migration: `processed=false` rows are eligible for
-- processing. The webhook flips them to `processed=true` after the
-- handler runs successfully.
-- ════════════════════════════════════════════════════

ALTER TABLE subscription_events
  ADD COLUMN IF NOT EXISTS processed BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE subscription_events
  ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;

-- Backfill: existing rows are pre-launch — assume already-processed so a
-- Stripe replay storm doesn't reprocess history. New rows default to false.
UPDATE subscription_events
   SET processed = true,
       processed_at = COALESCE(processed_at, created_at)
 WHERE processed = false
   AND created_at < now();

-- Index supports the webhook's idempotency lookup:
--   SELECT processed FROM subscription_events WHERE stripe_event_id = $1
-- The existing UNIQUE constraint on stripe_event_id already covers this,
-- but we add a partial index for the `processed=false` case which is the
-- hot path during normal operation (most lookups will find no row or one
-- already-processed row).
CREATE INDEX IF NOT EXISTS idx_subscription_events_unprocessed
  ON subscription_events (stripe_event_id)
  WHERE processed = false;

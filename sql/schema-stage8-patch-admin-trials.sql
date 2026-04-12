-- ════════════════════════════════════════════════════
-- STAGE 8 PATCH — Subscription Admin Tooling + Trials
-- ════════════════════════════════════════════════════
-- Adds columns that unblock:
--   Gap 1: stripe_subscription_id  — programmatic cancel/change
--   Gap 2: trial_ends_at            — code-supported trial UX
--
-- Safe to re-run: uses IF NOT EXISTS throughout.
-- Run order: AFTER sql/schema-stage8.sql
-- Run in:    Supabase SQL Editor (single block)
-- ════════════════════════════════════════════════════

-- ─── Gap 1: Stripe subscription ID ──────────────────
-- Stores the Stripe Subscription object ID so server code
-- can call stripe.subscriptions.update() / cancel() without
-- pushing the user into the hosted Customer Portal.
ALTER TABLE parents
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT UNIQUE;

-- Lookup index for webhook + admin queries
CREATE INDEX IF NOT EXISTS idx_parents_stripe_subscription_id
  ON parents(stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

-- ─── Gap 2: Trial end timestamp ─────────────────────
-- Populated from Stripe's subscription.trial_end on webhook.
-- Null means the user is not (and has not been) on a trial.
ALTER TABLE parents
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

-- Lookup index — used by scheduled reminder jobs and
-- "trial expiring soon" banners.
CREATE INDEX IF NOT EXISTS idx_parents_trial_ends_at
  ON parents(trial_ends_at)
  WHERE trial_ends_at IS NOT NULL;

-- ─── Gap 2: Subscription period end (optional metadata) ──
-- Stores current_period_end so the UI can show
-- "Changes apply [date]" when downgrading.
ALTER TABLE parents
  ADD COLUMN IF NOT EXISTS subscription_period_end TIMESTAMPTZ;

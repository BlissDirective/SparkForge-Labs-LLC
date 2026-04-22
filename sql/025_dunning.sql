-- ════════════════════════════════════════════════════
-- PAY-ENH-003 (Ultra): Dunning + Grace Period
--
-- Stripe Smart Retries handles the invoice retry schedule (operator
-- configures in the Dashboard). This migration adds the grace period
-- + dunning stage machine so the app knows when to soft-dunn, when
-- to send reminders, and when to downgrade to free tier.
--
-- Stages (4):
--   0 = payment just failed (immediate email sent)
--   1 = day-3 retry-coming email sent
--   2 = day-7 grace-ending email sent
--   3 = grace expired → downgraded to free (final account email)
--   4 = day-30 win-back offer sent (sequence complete)
--
-- Grace policy: 7 days from first failure. During grace, the parent
-- retains paid-tier access. On successful payment (webhook fires
-- invoice.payment_succeeded), all dunning_* + grace_* fields clear.
-- ════════════════════════════════════════════════════

-- ─── Parents columns ──────────────────────────────

ALTER TABLE parents
  ADD COLUMN IF NOT EXISTS grace_period_ends_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS dunning_stage         INT CHECK (dunning_stage BETWEEN 0 AND 4),
  ADD COLUMN IF NOT EXISTS dunning_started_at    TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS dunning_last_sent_at  TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS dunning_tier_before   TEXT
    CHECK (dunning_tier_before IN ('plus', 'forge'));

COMMENT ON COLUMN parents.grace_period_ends_at IS
  'PAY-ENH-003: when access reverts to free tier if invoice still unpaid. NULL = not in grace.';

COMMENT ON COLUMN parents.dunning_stage IS
  'PAY-ENH-003: current stage 0-4. NULL = no active dunning sequence.';

COMMENT ON COLUMN parents.dunning_tier_before IS
  'PAY-ENH-003: tier the parent had when dunning started. Used to restore on recovery.';

-- Cron scan index — find parents whose next stage is due.
CREATE INDEX IF NOT EXISTS idx_parents_dunning_scan
  ON parents (dunning_stage, dunning_last_sent_at)
  WHERE dunning_stage IS NOT NULL;

-- Grace-expiry scan index.
CREATE INDEX IF NOT EXISTS idx_parents_grace_expiry
  ON parents (grace_period_ends_at)
  WHERE grace_period_ends_at IS NOT NULL;

-- ─── Verification ─────────────────────────────────

DO $$
BEGIN
  ASSERT (SELECT count(*) FROM information_schema.columns
          WHERE table_name = 'parents'
            AND column_name IN (
              'grace_period_ends_at', 'dunning_stage',
              'dunning_started_at', 'dunning_last_sent_at',
              'dunning_tier_before'
            )) = 5,
    'parents dunning columns missing';
  RAISE NOTICE 'PAY-ENH-003 migration OK';
END $$;

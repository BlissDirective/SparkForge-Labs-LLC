-- ════════════════════════════════════════════════════
-- AUTH-HIGH-004 (Option C): parents.email_verified_at
--
-- Adds a nullable timestamp that records when the parent clicked the
-- Supabase email-confirmation link. NULL means the email has not yet
-- been verified.
--
-- Semantics:
--   - Set to NOW() by the /api/auth/callback handler on the first
--     successful exchangeCodeForSession for each parent.
--   - Never reset or cleared.
--   - Consumed by:
--       * /api/stripe/checkout (gate: 403 EMAIL_VERIFICATION_REQUIRED
--         when NULL)
--       * EmailVerifyBanner component in the dashboard layout.
--
-- No backfill: at launch there are no existing production accounts. If
-- future accounts exist when this runs, they will keep email_verified_at
-- NULL and users will see the dismissible banner until they verify.
--
-- RLS: no new policy needed. The parents table already enforces
-- `parent can SELECT/UPDATE own row` (sql/002_rls.sql); admin client
-- bypasses RLS for the callback stamp.
-- ════════════════════════════════════════════════════

ALTER TABLE parents
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

COMMENT ON COLUMN parents.email_verified_at IS
  'AUTH-HIGH-004: Timestamp when the parent confirmed their email via the '
  'Supabase callback link. NULL = unverified (see EmailVerifyBanner and '
  'Stripe checkout gate).';

-- Partial index on unverified accounts — supports future admin tooling
-- (e.g., "resend verification email to stale signups"). Cheap; only
-- indexes the NULL rows which should remain small.
CREATE INDEX IF NOT EXISTS idx_parents_unverified
  ON parents (created_at)
  WHERE email_verified_at IS NULL;

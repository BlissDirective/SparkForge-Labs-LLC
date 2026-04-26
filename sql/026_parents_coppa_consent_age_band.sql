-- ════════════════════════════════════════════════════
-- COPPA-PRD-B: parents.coppa_consent_age_band
--
-- Records the youngest-child age band the parent acknowledged when
-- recording COPPA parental consent. Captured at the same moment as
-- coppa_consent_at so the consent record is age-band-aware (FTC
-- 2025 amendments expect VPC to be informed about which child the
-- consent covers).
--
-- Values: 'A' (7-9), 'B' (10-12), 'C' (13-16), or 'mixed' if the
-- parent intends to add child profiles spanning more than one band.
-- Mirrors the AgeBandSchema enum in src/lib/validations.ts plus the
-- 'mixed' sentinel for multi-child households.
--
-- Semantics:
--   - Set by /api/auth/consent at the same time as coppa_consent_at
--     when the parent submits the consent form with a chosen band.
--   - NULL on legacy parent rows whose consent was recorded before
--     this migration. No backfill — pre-launch there are no prod
--     accounts. Existing E2E test fixtures continue to work.
--   - Read by audit / parent-dashboard "your consent record" view
--     when one ships.
--
-- RLS: no new policy needed — parents table already enforces
-- "parent can SELECT/UPDATE own row" (sql/002_rls.sql); admin client
-- bypasses RLS for the consent stamp.
-- ════════════════════════════════════════════════════

ALTER TABLE parents
  ADD COLUMN IF NOT EXISTS coppa_consent_age_band TEXT
    CHECK (coppa_consent_age_band IN ('A', 'B', 'C', 'mixed'));

COMMENT ON COLUMN parents.coppa_consent_age_band IS
  'COPPA-PRD-B: Youngest-child age band acknowledged at consent. '
  'A=7-9, B=10-12, C=13-16, mixed=multiple bands. NULL = legacy '
  'pre-migration consent or consent recorded without band selection.';

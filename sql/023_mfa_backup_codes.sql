-- ════════════════════════════════════════════════════
-- AUTH-ENH-006 (Recommended): MFA backup codes
--
-- Supabase's native MFA handles TOTP factor storage, challenges, and
-- verification. This migration adds BACKUP CODES — one-time recovery
-- strings a parent can use when they lose their TOTP authenticator.
--
-- Codes are hashed (scrypt via Node crypto) with a per-code salt.
-- Plain codes are shown ONCE at enrollment time and then discarded
-- client-side. Server never re-reads plaintext.
--
-- Usage lifecycle:
--   enroll  → insert 8 rows (used_at = NULL)
--   consume → set used_at = now(), decrement remaining count
--   exhaust → client prompts regenerate (Ultra tier; not in Recommended)
-- ════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS mfa_backup_codes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id     UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  code_hash     TEXT NOT NULL,       -- scrypt(code, salt) hex
  salt          TEXT NOT NULL,       -- 16-byte random hex
  used_at       TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE mfa_backup_codes IS
  'AUTH-ENH-006: single-use recovery codes for TOTP MFA. Plaintext shown once at enrollment; server stores only scrypt hash.';

-- Per-parent lookup (the only forensic query path).
CREATE INDEX IF NOT EXISTS idx_mfa_backup_codes_parent
  ON mfa_backup_codes (parent_id, used_at);

-- ─── RLS ───────────────────────────────────────────

ALTER TABLE mfa_backup_codes ENABLE ROW LEVEL SECURITY;

-- Parent can count their own codes (e.g., "6 of 8 unused") but
-- cannot read the hash or salt. Achieved by SELECT-granting only
-- the non-sensitive columns through a view. The table itself
-- remains service-role-only.
-- Simpler variant for Recommended: block parent SELECT entirely;
-- expose count through a SECURITY DEFINER RPC.

-- No SELECT/INSERT/UPDATE/DELETE policies for anon/authenticated → only
-- service role writes and reads, via the API routes that know the
-- authenticated parent_id from the session. service_role BYPASSRLS is
-- unaffected by any policy below.
--
-- We attach an explicit deny-all policy so (1) the intent is visible in
-- pg_policies and (2) sql/verify_rls.sql's policyless-table check
-- doesn't flag this as a migration regression. The behavior is the
-- same as "no policy" (default deny), just documented explicitly.
DROP POLICY IF EXISTS "deny_all_non_service" ON mfa_backup_codes;
CREATE POLICY "deny_all_non_service"
  ON mfa_backup_codes
  FOR ALL
  TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- ─── Parent-visible count RPC ─────────────────────

CREATE OR REPLACE FUNCTION mfa_backup_codes_remaining(p_parent_id UUID)
RETURNS INTEGER
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::int
  FROM mfa_backup_codes
  WHERE parent_id = p_parent_id AND used_at IS NULL
$$;

REVOKE ALL ON FUNCTION mfa_backup_codes_remaining(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION mfa_backup_codes_remaining(UUID) TO authenticated, service_role;

-- ─── Verification ─────────────────────────────────

DO $$
BEGIN
  ASSERT (SELECT count(*) FROM information_schema.tables
          WHERE table_name = 'mfa_backup_codes') = 1,
    'mfa_backup_codes table missing';
  RAISE NOTICE 'AUTH-ENH-006 migration OK';
END $$;

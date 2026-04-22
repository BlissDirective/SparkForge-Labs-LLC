-- ════════════════════════════════════════════════════════════════
-- 020_passkey_credentials.sql — AUTH-ENH Passkey / WebAuthn (Ultra)
-- Phase 5 task #3 · Final-Audit_04-15-2026.md
-- ════════════════════════════════════════════════════════════════
-- Storage for FIDO2/WebAuthn credentials. One row per authenticator
-- bound to a parent account. Children inherit via parent auth, so
-- passkeys are registered on the parent account only.
--
-- Uses @simplewebauthn/server v13 canonical field set:
--   id (credential id, base64url TEXT; PK)
--   public_key (BYTEA — COSE-encoded)
--   counter (BIGINT — signature counter for replay detection)
--   device_type ('singleDevice' | 'multiDevice')
--   backed_up (BOOLEAN — iCloud/Google-synced passkey?)
--   transports (TEXT[] — 'usb','nfc','ble','internal','hybrid','cable')
--   attestation_format (TEXT — 'none','packed','fido-u2f','android-key',
--                      'android-safetynet','tpm','apple','chromium')
--   aaguid (UUID — authenticator model ID; used with MDS3 metadata)
-- Plus SparkForge fields:
--   parent_id (FK → parents.id, CASCADE on delete)
--   nickname (TEXT — user-facing label, e.g. "MacBook Touch ID")
--   created_at, last_used_at
--   forge_attested (BOOLEAN — passed hardware-key attestation check;
--                   unlocks stricter parent-review flows on Forge tier)
--   revoked_at (soft-delete for audit trail)
-- ════════════════════════════════════════════════════════════════

BEGIN;

CREATE TABLE IF NOT EXISTS passkey_credentials (
  id TEXT PRIMARY KEY,
  parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  public_key BYTEA NOT NULL,
  counter BIGINT NOT NULL DEFAULT 0,
  device_type TEXT NOT NULL CHECK (device_type IN ('singleDevice', 'multiDevice')),
  backed_up BOOLEAN NOT NULL DEFAULT FALSE,
  transports TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  attestation_format TEXT NOT NULL DEFAULT 'none',
  aaguid UUID,
  nickname TEXT NOT NULL DEFAULT 'Passkey',
  forge_attested BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_passkey_credentials_parent_id
  ON passkey_credentials (parent_id);

-- Ephemeral challenge storage. WebAuthn registrations + authentications
-- are a 2-round-trip protocol; the server-generated challenge must be
-- remembered between rounds. We persist per-parent rather than per-
-- cookie so a mid-flight tab refresh still works.
CREATE TABLE IF NOT EXISTS passkey_challenges (
  parent_id UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('registration', 'authentication')),
  challenge TEXT NOT NULL,
  expected_origin TEXT NOT NULL,
  expected_rp_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '5 minutes'),
  PRIMARY KEY (parent_id, kind)
);

CREATE INDEX IF NOT EXISTS idx_passkey_challenges_expires
  ON passkey_challenges (expires_at);

-- ──────────────────────────────────────────────────────────────────
-- RLS — parents own their rows; no anon access.
-- ──────────────────────────────────────────────────────────────────
ALTER TABLE passkey_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE passkey_challenges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS passkey_credentials_select ON passkey_credentials;
CREATE POLICY passkey_credentials_select
  ON passkey_credentials FOR SELECT
  USING (parent_id = auth.uid());

-- Writes are done via SECURITY DEFINER RPCs from the API route; block
-- direct writes from any Postgrest-originating request.
DROP POLICY IF EXISTS passkey_credentials_noclient_write ON passkey_credentials;
CREATE POLICY passkey_credentials_noclient_write
  ON passkey_credentials
  AS RESTRICTIVE
  FOR ALL
  USING (FALSE)
  WITH CHECK (FALSE);

DROP POLICY IF EXISTS passkey_challenges_noclient ON passkey_challenges;
CREATE POLICY passkey_challenges_noclient
  ON passkey_challenges
  AS RESTRICTIVE
  FOR ALL
  USING (FALSE)
  WITH CHECK (FALSE);

-- Demo-deny reasserted for consistency with 019.
DROP POLICY IF EXISTS demo_deny_passkey_credentials ON passkey_credentials;
CREATE POLICY demo_deny_passkey_credentials
  ON passkey_credentials
  AS RESTRICTIVE
  FOR ALL
  USING (NOT public.auth_is_anonymous())
  WITH CHECK (NOT public.auth_is_anonymous());

-- ──────────────────────────────────────────────────────────────────
-- Cleanup: expired challenges older than their expires_at.
-- Runs via the existing pg_cron infrastructure (see 006_cron.sql).
-- ──────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.cleanup_expired_passkey_challenges()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  n INTEGER;
BEGIN
  DELETE FROM passkey_challenges WHERE expires_at < now();
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END
$$;

REVOKE ALL ON FUNCTION public.cleanup_expired_passkey_challenges() FROM PUBLIC;

-- Schedule the cleanup every 10 minutes — skipped cleanly when pg_cron
-- is not installed (Supabase Free tier).
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('passkey-challenge-cleanup')
      FROM (SELECT 1 FROM cron.job WHERE jobname = 'passkey-challenge-cleanup') AS x;
    PERFORM cron.schedule(
      'passkey-challenge-cleanup',
      '*/10 * * * *',
      'SELECT public.cleanup_expired_passkey_challenges()'
    );
  ELSE
    RAISE NOTICE 'pg_cron not installed — passkey-challenge-cleanup will not auto-run. Trigger manually via cleanup_expired_passkey_challenges().';
  END IF;
END
$$;

COMMIT;

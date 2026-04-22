-- ════════════════════════════════════════════════════
-- AUTH-ENH-003 (Max): OAuth sign-in + linked-account audit trail
--
-- Purpose-built auth-telemetry log. Distinct from `audit_log` (which
-- captures DB-level mutations via triggers). `auth_events` captures
-- identity-layer events that never reach a DB write — OAuth sign-in
-- success, identity link/unlink, MFA enroll/challenge, passkey
-- register/use, password change/reset, email verify.
--
-- Access model:
--   SELECT: row-owner parent OR admin (RLS)
--   INSERT: service-role only (no RLS policy → anon/authed sessions
--           cannot tamper with their own history)
--
-- Retention: 180-day pg_cron purge. Longer than audit_log (90d) since
-- auth events are lower volume and forensically more valuable.
-- ════════════════════════════════════════════════════

-- ─── 1. Parents columns (quick-access last-sign-in display) ───

ALTER TABLE parents
  ADD COLUMN IF NOT EXISTS oauth_last_provider TEXT,
  ADD COLUMN IF NOT EXISTS oauth_last_used_at  TIMESTAMPTZ;

COMMENT ON COLUMN parents.oauth_last_provider IS
  'AUTH-ENH-003: provider string of the most-recent successful OAuth sign-in (google | apple | azure). NULL if never signed in via OAuth.';

COMMENT ON COLUMN parents.oauth_last_used_at IS
  'AUTH-ENH-003: timestamp of the most-recent successful OAuth sign-in. Used to surface "Last signed in with Google" in settings.';

-- ─── 2. auth_events table ─────────────────────────

CREATE TABLE IF NOT EXISTS auth_events (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id      UUID NOT NULL REFERENCES parents(id) ON DELETE CASCADE,
  event_type     TEXT NOT NULL CHECK (event_type IN (
    'signin.password',
    'signin.oauth',
    'signin.demo',
    'signin.passkey',
    'signout',
    'oauth.linked',
    'oauth.unlinked',
    'oauth.link_failed',
    'mfa.enrolled',
    'mfa.challenged',
    'mfa.verified',
    'mfa.disabled',
    'password.changed',
    'password.reset_requested',
    'email.verified'
  )),
  provider       TEXT,                      -- 'google' | 'apple' | 'azure' | NULL
  ip             TEXT,
  user_agent     TEXT,
  metadata       JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE auth_events IS
  'AUTH-ENH-003: auth-layer telemetry distinct from audit_log (DB mutations). Populated by service-role API routes only.';

-- Per-parent history (most common query: "show me my sign-in history")
CREATE INDEX IF NOT EXISTS idx_auth_events_parent
  ON auth_events (parent_id, created_at DESC);

-- Admin analytics (most common: "show OAuth adoption by provider")
CREATE INDEX IF NOT EXISTS idx_auth_events_type_time
  ON auth_events (event_type, created_at DESC);

-- Retention scan
CREATE INDEX IF NOT EXISTS idx_auth_events_created_at
  ON auth_events (created_at);

-- ─── 3. RLS ────────────────────────────────────────

ALTER TABLE auth_events ENABLE ROW LEVEL SECURITY;

-- Parent reads own history (shown in settings "Recent activity").
DROP POLICY IF EXISTS auth_events_self_read ON auth_events;
CREATE POLICY auth_events_self_read
  ON auth_events
  FOR SELECT
  USING (parent_id = auth.uid());

-- Admin reads all.
DROP POLICY IF EXISTS auth_events_admin_read ON auth_events;
CREATE POLICY auth_events_admin_read
  ON auth_events
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM parents WHERE id = auth.uid() AND is_admin = true)
  );

-- NO INSERT/UPDATE/DELETE policies → only service-role can write.
-- Anonymous demo sessions and normal authed sessions cannot tamper
-- with their own event history.

-- ─── 4. Retention: 180-day pg_cron purge ──────────

-- Idempotent: schedules only if pg_cron is installed and the job
-- doesn't already exist. Mirrors the pattern in 015_pg_cron_daily_resets.sql.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    IF NOT EXISTS (
      SELECT 1 FROM cron.job WHERE jobname = 'purge_auth_events_180d'
    ) THEN
      PERFORM cron.schedule(
        'purge_auth_events_180d',
        '17 3 * * *',                       -- 03:17 UTC daily
        $SQL$DELETE FROM auth_events WHERE created_at < now() - INTERVAL '180 days'$SQL$
      );
    END IF;
  END IF;
END $$;

-- ─── 5. Verification ──────────────────────────────

DO $$
BEGIN
  ASSERT (SELECT count(*) FROM information_schema.columns
          WHERE table_name = 'parents' AND column_name IN ('oauth_last_provider', 'oauth_last_used_at')) = 2,
    'parents.oauth_last_* columns missing';
  ASSERT (SELECT count(*) FROM information_schema.tables
          WHERE table_name = 'auth_events') = 1,
    'auth_events table missing';
  RAISE NOTICE 'AUTH-ENH-003 migration OK';
END $$;

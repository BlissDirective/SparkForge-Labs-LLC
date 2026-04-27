-- AUTH HARDENING (Option A per user decision April 24, 2026):
-- Recreate every permissive public-schema policy currently scoped to
-- {public} with explicit TO authenticated. Anonymous users already fail
-- the `auth.uid()` comparisons so behavior is unchanged; this just scopes
-- the role list explicitly, clearing the auth_allow_anonymous_sign_ins
-- advisor lint (0012) for 12 policies + 3 deny policies.
-- RESTRICTIVE demo_deny_* (019) and RLS table-level settings unchanged.
--
-- NOTE: Supabase's `authenticated` role includes anonymous sign-ins
-- (signInAnonymously creates a JWT with is_anonymous=true claim, role=authenticated).
-- The 0012 advisor cannot trace through RESTRICTIVE policies that gate
-- on auth_is_anonymous(), so warnings remain after this migration.
-- See PROGRESS.md "Advisor false-positive note" for the documented analysis.

-- 1. agent_runs
DROP POLICY IF EXISTS agent_runs_admin_only ON agent_runs;
CREATE POLICY agent_runs_admin_only ON agent_runs
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM parents WHERE id = auth.uid() AND is_admin = true));

-- 2. audit_log
DROP POLICY IF EXISTS audit_log_admin_read ON audit_log;
CREATE POLICY audit_log_admin_read ON audit_log
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM parents WHERE id = auth.uid() AND is_admin = true));

-- 3. auth_events
DROP POLICY IF EXISTS auth_events_admin_read ON auth_events;
CREATE POLICY auth_events_admin_read ON auth_events
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM parents WHERE id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS auth_events_self_read ON auth_events;
CREATE POLICY auth_events_self_read ON auth_events
  FOR SELECT TO authenticated
  USING (parent_id = auth.uid());

-- 4. content (split admin policies from 013)
DROP POLICY IF EXISTS content_admin_insert ON content;
CREATE POLICY content_admin_insert ON content
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM parents WHERE id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS content_admin_select ON content;
CREATE POLICY content_admin_select ON content
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM parents WHERE id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS content_admin_update ON content;
CREATE POLICY content_admin_update ON content
  FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM parents WHERE id = auth.uid() AND is_admin = true))
  WITH CHECK (EXISTS (SELECT 1 FROM parents WHERE id = auth.uid() AND is_admin = true));

-- 5. parents (parent_read_own_sub from schema-stage8.sql)
DROP POLICY IF EXISTS parent_read_own_sub ON parents;
CREATE POLICY parent_read_own_sub ON parents
  FOR SELECT TO authenticated
  USING (id = auth.uid());

-- 6. passkey_credentials
DROP POLICY IF EXISTS passkey_credentials_select ON passkey_credentials;
CREATE POLICY passkey_credentials_select ON passkey_credentials
  FOR SELECT TO authenticated
  USING (parent_id = auth.uid());

DROP POLICY IF EXISTS passkey_credentials_noclient_write ON passkey_credentials;
CREATE POLICY passkey_credentials_noclient_write ON passkey_credentials
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (FALSE) WITH CHECK (FALSE);

-- 7. passkey_challenges
DROP POLICY IF EXISTS passkey_challenges_noclient ON passkey_challenges;
CREATE POLICY passkey_challenges_noclient ON passkey_challenges
  AS RESTRICTIVE FOR ALL TO authenticated
  USING (FALSE) WITH CHECK (FALSE);

-- 8. subscription_events
DROP POLICY IF EXISTS sub_events_admin_only ON subscription_events;
CREATE POLICY sub_events_admin_only ON subscription_events
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM parents WHERE id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS sub_events_select_own ON subscription_events;
CREATE POLICY sub_events_select_own ON subscription_events
  FOR SELECT TO authenticated
  USING (parent_id = auth.uid());

-- 9. subscription_events_detail
DROP POLICY IF EXISTS sub_events_detail_admin_only ON subscription_events_detail;
CREATE POLICY sub_events_detail_admin_only ON subscription_events_detail
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM parents WHERE id = auth.uid() AND is_admin = true));

-- 10. mfa_backup_codes — remove anon from role list (keep only authenticated)
DROP POLICY IF EXISTS deny_all_non_service ON mfa_backup_codes;
CREATE POLICY deny_all_non_service ON mfa_backup_codes
  FOR ALL TO authenticated
  USING (false) WITH CHECK (false);

-- Verify
DO $$
DECLARE
  public_policies INTEGER;
BEGIN
  SELECT count(*) INTO public_policies
  FROM pg_policies
  WHERE schemaname = 'public'
    AND 'public' = ANY(roles)
    AND permissive = 'PERMISSIVE';
  IF public_policies > 0 THEN
    RAISE WARNING 'Still % permissive policies scoped to {public}', public_policies;
  END IF;
END $$;

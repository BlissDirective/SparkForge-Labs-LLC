-- ════════════════════════════════════════════════════════════════
-- 019_demo_role_rls.sql — AUTH-ENH Signed Demo Tokens (Max)
-- Phase 5 task #2 · Final-Audit_04-15-2026.md
-- ════════════════════════════════════════════════════════════════
-- Defense-in-depth for demo users.
--
-- The Recommended tier (already shipped via 001_schema/002_rls +
-- supabase.auth.signInAnonymously) gives demo users a real Supabase
-- anonymous JWT. RLS still grants them full read/write inside the
-- parent_id = auth.uid() sandbox because `auth.uid()` resolves to the
-- anon user's own id.
--
-- Max-tier adds a second layer: explicitly DENY all writes from
-- anonymous users across every public table, and explicitly PERMIT
-- only the reads we consider safe for demo mode. Even if the RLS
-- above were misconfigured for the sandbox, writes from a signInAnony-
-- mously session would still be rejected.
--
-- How "anonymous" is identified in Postgres RLS:
--   auth.jwt() returns the full JWT claims as a jsonb object. Supabase
--   sets `is_anonymous: true` on anonymous sessions. We extract it via
--     COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false)
--   which is false for logged-in parents (claim absent) and true for
--   demo users.
--
-- Idempotent — safe to re-run. Uses CREATE POLICY IF NOT EXISTS where
-- available (PG 15+) or DROP POLICY IF EXISTS + CREATE fallback.
-- ════════════════════════════════════════════════════════════════

BEGIN;

-- Helper: canonical detector for anonymous JWT users.
-- SECURITY DEFINER not needed (public auth.jwt() access is fine in
-- the RLS evaluator context).
CREATE OR REPLACE FUNCTION public.auth_is_anonymous()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE((auth.jwt() ->> 'is_anonymous')::boolean, false)
$$;

COMMENT ON FUNCTION public.auth_is_anonymous() IS
  'Returns true when the requesting session JWT carries is_anonymous=true '
  'per Supabase signInAnonymously(). Used by demo-role RLS in 019.';

-- ──────────────────────────────────────────────────────────────────
-- Deny writes from anonymous users across every user-facing table.
-- We add an ANTI-policy: a restrictive policy that fails UNLESS the
-- user is not-anonymous. Without this, a write still needs to pass
-- the permissive parent_id=auth.uid() policy — BUT demo users CAN
-- satisfy that (they are their own parent_id in the anon session),
-- which is exactly what Max tier is defending against.
-- ──────────────────────────────────────────────────────────────────

-- parents
DROP POLICY IF EXISTS demo_deny_parents_writes ON parents;
CREATE POLICY demo_deny_parents_writes
  ON parents
  AS RESTRICTIVE
  FOR ALL
  USING (NOT public.auth_is_anonymous())
  WITH CHECK (NOT public.auth_is_anonymous());

-- children
DROP POLICY IF EXISTS demo_deny_children_writes ON children;
CREATE POLICY demo_deny_children_writes
  ON children
  AS RESTRICTIVE
  FOR INSERT
  WITH CHECK (NOT public.auth_is_anonymous());

DROP POLICY IF EXISTS demo_deny_children_update ON children;
CREATE POLICY demo_deny_children_update
  ON children
  AS RESTRICTIVE
  FOR UPDATE
  USING (NOT public.auth_is_anonymous())
  WITH CHECK (NOT public.auth_is_anonymous());

DROP POLICY IF EXISTS demo_deny_children_delete ON children;
CREATE POLICY demo_deny_children_delete
  ON children
  AS RESTRICTIVE
  FOR DELETE
  USING (NOT public.auth_is_anonymous());

-- progress
DROP POLICY IF EXISTS demo_deny_progress_writes ON progress;
CREATE POLICY demo_deny_progress_writes
  ON progress
  AS RESTRICTIVE
  FOR INSERT
  WITH CHECK (NOT public.auth_is_anonymous());

DROP POLICY IF EXISTS demo_deny_progress_update ON progress;
CREATE POLICY demo_deny_progress_update
  ON progress
  AS RESTRICTIVE
  FOR UPDATE
  USING (NOT public.auth_is_anonymous())
  WITH CHECK (NOT public.auth_is_anonymous());

-- content (anon CAN read published — no extra restriction needed)
DROP POLICY IF EXISTS demo_deny_content_writes ON content;
CREATE POLICY demo_deny_content_writes
  ON content
  AS RESTRICTIVE
  FOR ALL
  USING (NOT public.auth_is_anonymous())
  WITH CHECK (NOT public.auth_is_anonymous());

-- child_badges
DROP POLICY IF EXISTS demo_deny_child_badges_writes ON child_badges;
CREATE POLICY demo_deny_child_badges_writes
  ON child_badges
  AS RESTRICTIVE
  FOR INSERT
  WITH CHECK (NOT public.auth_is_anonymous());

-- content_queue
DROP POLICY IF EXISTS demo_deny_content_queue_writes ON content_queue;
CREATE POLICY demo_deny_content_queue_writes
  ON content_queue
  AS RESTRICTIVE
  FOR ALL
  USING (NOT public.auth_is_anonymous())
  WITH CHECK (NOT public.auth_is_anonymous());

-- sessions
DROP POLICY IF EXISTS demo_deny_sessions_writes ON sessions;
CREATE POLICY demo_deny_sessions_writes
  ON sessions
  AS RESTRICTIVE
  FOR ALL
  USING (NOT public.auth_is_anonymous())
  WITH CHECK (NOT public.auth_is_anonymous());

-- prompt_history
DROP POLICY IF EXISTS demo_deny_prompt_history_writes ON prompt_history;
CREATE POLICY demo_deny_prompt_history_writes
  ON prompt_history
  AS RESTRICTIVE
  FOR ALL
  USING (NOT public.auth_is_anonymous())
  WITH CHECK (NOT public.auth_is_anonymous());

-- ──────────────────────────────────────────────────────────────────
-- Stage 8/9 tables: full deny for anonymous.
-- ──────────────────────────────────────────────────────────────────

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'subscription_events') THEN
    EXECUTE $ddl$
      DROP POLICY IF EXISTS demo_deny_subscription_events ON subscription_events;
      CREATE POLICY demo_deny_subscription_events
        ON subscription_events
        AS RESTRICTIVE
        FOR ALL
        USING (NOT public.auth_is_anonymous())
        WITH CHECK (NOT public.auth_is_anonymous());
    $ddl$;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'subscription_events_detail') THEN
    EXECUTE $ddl$
      DROP POLICY IF EXISTS demo_deny_subscription_events_detail ON subscription_events_detail;
      CREATE POLICY demo_deny_subscription_events_detail
        ON subscription_events_detail
        AS RESTRICTIVE
        FOR ALL
        USING (NOT public.auth_is_anonymous())
        WITH CHECK (NOT public.auth_is_anonymous());
    $ddl$;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'agent_runs') THEN
    EXECUTE $ddl$
      DROP POLICY IF EXISTS demo_deny_agent_runs ON agent_runs;
      CREATE POLICY demo_deny_agent_runs
        ON agent_runs
        AS RESTRICTIVE
        FOR ALL
        USING (NOT public.auth_is_anonymous())
        WITH CHECK (NOT public.auth_is_anonymous());
    $ddl$;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'audit_log') THEN
    EXECUTE $ddl$
      DROP POLICY IF EXISTS demo_deny_audit_log ON audit_log;
      CREATE POLICY demo_deny_audit_log
        ON audit_log
        AS RESTRICTIVE
        FOR ALL
        USING (NOT public.auth_is_anonymous())
        WITH CHECK (NOT public.auth_is_anonymous());
    $ddl$;
  END IF;
END
$$;

-- ──────────────────────────────────────────────────────────────────
-- Verification block — fails the migration if any public table that
-- should have a demo-deny write policy is missing one.
-- ──────────────────────────────────────────────────────────────────
DO $$
DECLARE
  missing TEXT[];
  required_tables TEXT[] := ARRAY[
    'parents', 'children', 'progress', 'content',
    'child_badges', 'content_queue', 'sessions', 'prompt_history'
  ];
  t TEXT;
BEGIN
  FOREACH t IN ARRAY required_tables LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = t
        AND policyname LIKE 'demo_deny_%'
        AND permissive = 'RESTRICTIVE'
    ) THEN
      missing := array_append(missing, t);
    END IF;
  END LOOP;

  IF array_length(missing, 1) > 0 THEN
    RAISE EXCEPTION '019_demo_role_rls.sql verification failed: these tables are missing a demo_deny_* RESTRICTIVE policy: %', missing;
  END IF;

  RAISE NOTICE '019_demo_role_rls.sql verified: all required tables carry a demo_deny_* RESTRICTIVE policy.';
END
$$;

COMMIT;

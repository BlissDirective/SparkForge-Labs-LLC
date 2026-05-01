-- Stage 11D — Agent Atelier follow-up: demo-mode RLS harness
-- ================================================================
-- Adds the project-standard `demo_deny_*` RESTRICTIVE policy to
-- `public.agent_compositions`, mirroring the pattern used on every
-- other family-scoped public table (agent_runs, audit_log, children,
-- progress, etc.). See 20260424211512_restrict_policies_to_authenticated_role.sql
-- for the canonical multi-table pattern.
--
-- Why this is necessary, even though the parent_rw policy already
-- gates on `auth.uid()`:
--   • The `auth_allow_anonymous_sign_ins` lint (0012) cannot trace
--     through `EXISTS` subqueries, so it falsely reports anonymous
--     access on parent_id-joined tables. The project answer is to
--     add an explicit RESTRICTIVE deny that the linter CAN trace
--     through (`NOT auth_is_anonymous()`).
--   • Without this, `agent_compositions` is the only public family-
--     scoped table without the demo-deny harness — an inconsistency
--     surfaced by `get_advisors` after the table-creation migration.
--
-- The single FOR ALL RESTRICTIVE form (USING + CHECK both gated)
-- is the same shape used by `demo_deny_agent_runs`, the closest
-- structural twin (both have a single FOR ALL permissive policy).

DROP POLICY IF EXISTS demo_deny_agent_compositions ON public.agent_compositions;
CREATE POLICY demo_deny_agent_compositions ON public.agent_compositions
  AS RESTRICTIVE
  FOR ALL
  USING (NOT auth_is_anonymous())
  WITH CHECK (NOT auth_is_anonymous());

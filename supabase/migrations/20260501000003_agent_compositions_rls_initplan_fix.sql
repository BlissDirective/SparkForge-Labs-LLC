-- Stage 11D — Agent Atelier follow-up: RLS initplan optimization
-- ================================================================
-- Performance advisor lint 0003 (auth_rls_initplan) flagged the
-- `agent_compositions_parent_rw` policy because it calls auth.uid()
-- directly inside the EXISTS subquery, which Postgres re-evaluates
-- once per row instead of folding to an InitPlan once per query.
--
-- Project canonical fix: wrap as `( SELECT auth.uid() )`. The same
-- transformation was applied project-wide in
-- `20260425022540_perf_rls_initplan_and_fk_indexes.sql` (e.g.,
-- agent_runs_admin_only's `parents.id = ( SELECT auth.uid() )`).
--
-- Policies cannot be ALTERed structurally, so we DROP + CREATE.

DROP POLICY IF EXISTS agent_compositions_parent_rw ON public.agent_compositions;
CREATE POLICY agent_compositions_parent_rw ON public.agent_compositions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.children c
      WHERE c.id = agent_compositions.child_id
        AND c.parent_id = ( SELECT auth.uid() )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.children c
      WHERE c.id = agent_compositions.child_id
        AND c.parent_id = ( SELECT auth.uid() )
    )
  );

-- Stage 11D — Agent Atelier (C1, Lab 11 opener)
-- Concept Source: docs/research/02-Flagship-Game-Concepts.md §D
-- Build Doc:      docs/stage11-new-flagships/STAGE11D_v3FINAL.md §10
-- Authored:       April 30, 2026
--
-- Adds the `agent_compositions` table for persisting a child's atelier
-- saves (specialist team + wire graph) so they can be loaded later in
-- Agent Atelier itself, and audit-replayed in Glass Box Lab (Stage 11F)
-- and Harness Forge (Stage 11G).
--
-- RLS pattern matches the existing SparkForge convention:
--   • Single TO authenticated policy
--   • parent_id ownership joined through public.children
--   • No `current_setting('app.child_id', ...)` — project uses auth.uid()
-- See 20260424211512_restrict_policies_to_authenticated_role.sql for the
-- canonical TO authenticated policy template.

-- 1. Table
CREATE TABLE IF NOT EXISTS public.agent_compositions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id    uuid NOT NULL REFERENCES public.children(id) ON DELETE CASCADE,
  name        text NOT NULL CHECK (length(name) BETWEEN 1 AND 80),
  team        jsonb NOT NULL,    -- PlacedAgent[]
  wires       jsonb NOT NULL,    -- Wire[]
  created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.agent_compositions IS 'Stage 11D — saved atelier compositions (team + wires). Cross-game-readable by Stages 11F and 11G.';
COMMENT ON COLUMN public.agent_compositions.team IS 'JSONB: PlacedAgent[] — see src/stores/agentAtelierStore.ts';
COMMENT ON COLUMN public.agent_compositions.wires IS 'JSONB: Wire[] — see src/stores/agentAtelierStore.ts';

-- 2. Index for the common access pattern (list a child's saves)
CREATE INDEX IF NOT EXISTS agent_compositions_child_idx
  ON public.agent_compositions(child_id);

-- 3. Enable RLS
ALTER TABLE public.agent_compositions ENABLE ROW LEVEL SECURITY;

-- 4. Single permissive policy — parent owns child, child user authenticates
--    as the parent's family scope per existing SparkForge auth model.
DROP POLICY IF EXISTS agent_compositions_parent_rw ON public.agent_compositions;
CREATE POLICY agent_compositions_parent_rw ON public.agent_compositions
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.children c
      WHERE c.id = agent_compositions.child_id
        AND c.parent_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.children c
      WHERE c.id = agent_compositions.child_id
        AND c.parent_id = auth.uid()
    )
  );

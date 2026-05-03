-- Stage 11G — Harness Forge
-- ================================================================
-- Additive migration: adds `harness_config` JSONB column to
-- public.agent_compositions so a saved team can carry an associated
-- safety-harness configuration. Per Doc 2 §K.4 (additive only) and
-- following the same shape pattern as the Stage 11E tool_bindings
-- column (20260501000004), this is a non-breaking column-add with
-- a default null sentinel — existing Stage 11D and 11E saves read
-- identically.
--
-- Schema shape (TypeScript: HarnessConfig):
--   {
--     filter:    { stripPii: bool, blockProfanity: bool, lengthCap: number },
--     validator: { requireKeyword?: string, maxLength?: number, requireCitations: bool },
--     monitor:   { loopLimit: number, dedupeOutputs: bool }
--   }
--
-- A NULL value means "no harness configured" (the default — equivalent
-- to a Stage 11D or pre-11G save). Stages 11G writes populate the
-- column; the dashboard / Glass Box can detect harness presence by
-- checking IS NOT NULL.

ALTER TABLE public.agent_compositions
  ADD COLUMN IF NOT EXISTS harness_config jsonb;

COMMENT ON COLUMN public.agent_compositions.harness_config IS
  'JSONB: HarnessConfig — Stage 11G safety-harness layers. NULL = no harness. See src/types/harness.ts.';

-- Stage 11E — MCP Plug-and-Play Lab
-- ================================================================
-- Additive migration: adds `tool_bindings` JSONB column to
-- public.agent_compositions so a saved Atelier team can carry an
-- accompanying set of tool attachments (one per agent input port,
-- optionally) into Stage 11E and beyond.
--
-- Per Doc 2 §K.4 ("future additions must be additive"), this is a
-- column-add with a default empty-array sentinel — every existing
-- row continues to read identically from Stage 11D code. The 11E
-- store + UI write into this column when the player saves an
-- equipped composition.
--
-- Schema shape (TypeScript: ToolBinding[]):
--   [
--     { agentId: string,
--       inputName: string,        // which input port the tool feeds
--       toolId: string,           // foreign key into the static
--                                  // toolCatalog.ts; not a DB FK
--       configJson: jsonb         // optional tool configuration
--     },
--     ...
--   ]
--
-- The `tool_bindings` array semantics: empty array means "no tools
-- attached" (the default — equivalent to a Stage 11D save).

ALTER TABLE public.agent_compositions
  ADD COLUMN IF NOT EXISTS tool_bindings jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.agent_compositions.tool_bindings IS
  'JSONB: ToolBinding[] — Stage 11E MCP Plug-and-Play tool attachments. See src/types/mcplab.ts.';

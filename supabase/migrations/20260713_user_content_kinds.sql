-- ════════════════════════════════════════════════════
-- MIGRATION: user_content kinds (G4b — publish agents & prompts)
-- Date: 2026-07-13
-- Extends the COPPA-safe "Create a Quiz" table so kids can also
-- publish two new creation kinds to the arcade THROUGH THE SAME
-- moderation pipeline:
--   • 'agent'  — a saved Agent Architect / Agent Atelier composition
--   • 'prompt' — a free-text prompt from Prompt Lab
--
-- Free-text prompts are the only kind that carries child-authored
-- text, so they are double-gated in code: automated moderation
-- (blocklist + Haiku screen) at submit time, THEN parent approval
-- before they ever become world-readable. RLS already restricts
-- public reads to status = 'approved' (see 20260608_user_content.sql),
-- so this migration adds no new read exposure.
--
-- APPLY ORDER: this runs AFTER 20260608_user_content.sql. It is
-- idempotent (IF NOT EXISTS) and safe to re-run.
-- ════════════════════════════════════════════════════

-- Kind discriminator. Existing rows are all quizzes → default 'quiz'.
ALTER TABLE user_content
  ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'quiz'
    CHECK (kind IN ('quiz', 'agent', 'prompt'));

-- Structured payload for non-quiz kinds:
--   agent  → { compositionId, name, summary }
--   prompt → { text, band }
-- Quizzes keep using the existing question_ids column; payload stays '{}'.
ALTER TABLE user_content
  ADD COLUMN IF NOT EXISTS payload JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Optional human-readable note captured when a moderator rejects
-- (surfaced back to the child as "why this wasn't shared").
ALTER TABLE user_content
  ADD COLUMN IF NOT EXISTS moderation_note TEXT;

-- Browse the community library by kind (e.g. "show shared prompts").
CREATE INDEX IF NOT EXISTS idx_user_content_kind
  ON user_content(kind, status, published_at DESC);

-- Backfill is implicit: the DEFAULT 'quiz' + NOT NULL applies to every
-- existing row at ADD COLUMN time, so no UPDATE is required.

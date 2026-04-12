-- ════════════════════════════════════════════════════
-- STAGE 8 PATCH — Children Soft-Archive
-- ════════════════════════════════════════════════════
-- Adds deactivated_at column to children so a tier downgrade
-- that drops below the parent's current child count can archive
-- the overflow without losing their XP, progress, or badges.
--
-- Soft-archive semantics:
--   deactivated_at IS NULL     → active child (counted, visible)
--   deactivated_at IS NOT NULL → archived (hidden from parent UI,
--     excluded from tier limit checks, progress preserved)
--
-- Queries in src/app/api/children/* and src/middleware/tierCheck.ts
-- filter on this column. RLS remains unchanged (parent still owns
-- the row) so admin tooling can restore archived children later.
--
-- Safe to re-run: uses IF NOT EXISTS.
-- Run order: AFTER sql/001_schema.sql
-- Related migration: schema-stage8-patch-admin-trials.sql (Gap 1+2)
-- ════════════════════════════════════════════════════

ALTER TABLE children
  ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMPTZ;

-- Partial index: speeds up the common "list my active children" query
-- by indexing only non-archived rows.
CREATE INDEX IF NOT EXISTS idx_children_active_by_parent
  ON children(parent_id, created_at)
  WHERE deactivated_at IS NULL;

-- Schema documentation
COMMENT ON COLUMN children.deactivated_at IS
  'Soft-archive timestamp. NULL = active. Populated by /api/stripe/subscription/change when a tier downgrade requires reducing the active child count. See Gap 3 in claude/audit-subscription-payment-xrg1p.';

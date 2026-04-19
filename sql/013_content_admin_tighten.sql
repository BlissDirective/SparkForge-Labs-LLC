-- ════════════════════════════════════════════════════
-- DB-HIGH-001 (Option B): Tighten content admin RLS + audit columns
--
-- Previous policy:
--   CREATE POLICY content_admin_all ON content FOR ALL USING (is_admin)
-- granted admins INSERT/UPDATE/DELETE/SELECT. DELETE is a foot-gun — a
-- rogue or compromised admin could permanently destroy published
-- lessons (or drop a row accidentally). The right semantics are
-- soft-delete by flipping status to 'rejected' or 'draft'.
--
-- This migration:
--   1. DROPs the blanket FOR ALL policy.
--   2. Recreates SELECT / INSERT / UPDATE policies individually
--      (no DELETE). Hard deletion is now only possible via the
--      service role (admin client), never via a signed-in admin
--      session token.
--   3. Adds `updated_by UUID REFERENCES parents(id)` and
--      `update_reason TEXT` audit columns so every future edit has
--      an operator and a rationale stamped onto the row. The app
--      code that promotes queue items to published content is
--      responsible for populating these fields.
-- ════════════════════════════════════════════════════

-- ─── 1. Drop the over-broad policy ─────────────────
DROP POLICY IF EXISTS content_admin_all ON content;

-- ─── 2. Re-create split policies (no DELETE) ───────

-- Admin can see every content row regardless of status (drafts,
-- rejected, archived). Non-admin read path (published-only) remains
-- unchanged in sql/002_rls.sql → `content_read_published`.
CREATE POLICY content_admin_select
  ON content
  FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM parents WHERE id = auth.uid() AND is_admin = true)
  );

-- Admin-only INSERT (e.g., promoting a content_queue item to a real
-- content row during review approval).
CREATE POLICY content_admin_insert
  ON content
  FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM parents WHERE id = auth.uid() AND is_admin = true)
  );

-- Admin-only UPDATE (including status changes — this is how
-- soft-delete works: set status = 'rejected' rather than DELETE).
CREATE POLICY content_admin_update
  ON content
  FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM parents WHERE id = auth.uid() AND is_admin = true)
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM parents WHERE id = auth.uid() AND is_admin = true)
  );

-- NOTE: no DELETE policy intentionally. Admins cannot hard-delete
-- content rows via RLS; the service-role key bypasses RLS for
-- operational cleanup if ever required.

-- ─── 3. Audit columns ──────────────────────────────
ALTER TABLE content
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES parents(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS update_reason TEXT;

COMMENT ON COLUMN content.updated_by IS
  'DB-HIGH-001: parents.id of the admin who last UPDATE or INSERTed '
  'this row. NULL only for base-seed content imported before the '
  'audit. App code writing to this table MUST populate this.';

COMMENT ON COLUMN content.update_reason IS
  'DB-HIGH-001: human-readable justification for the last UPDATE or '
  'INSERT. Appears in compliance/audit exports. Short free text.';

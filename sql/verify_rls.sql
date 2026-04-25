-- ════════════════════════════════════════════════════
-- RLS Verification Script
-- Final-Audit 04-15-2026 finding DB-CRIT-002 (Option C)
--
-- Verifies that every user-relevant table in the public schema has Row
-- Level Security enabled AND has at least one policy attached.
-- A bare `ENABLE ROW LEVEL SECURITY` without policies blocks all reads
-- (default-deny), which is technically secure but typically a bug.
--
-- Run via:
--   psql "$SUPABASE_DB_URL" -f sql/verify_rls.sql
--   OR
--   supabase db execute -f sql/verify_rls.sql
--
-- Exit behavior:
--   - All tables protected → RAISE NOTICE 'OK' and exit 0
--   - Any table missing RLS or policies → RAISE EXCEPTION (exit 1)
--
-- This script is invoked by .github/workflows/ci.yml on every PR to
-- prevent regressions where new migrations add tables without RLS.
-- ════════════════════════════════════════════════════

DO $$
DECLARE
  -- Allowlist of tables that intentionally do NOT need RLS.
  -- Empty for now; system-managed Supabase tables live in `auth`,
  -- `storage`, `realtime`, etc. — not in `public`.
  rls_optional_tables TEXT[] := ARRAY[]::TEXT[];

  unprotected_tables TEXT[];
  policyless_tables TEXT[];
  msg TEXT;
BEGIN
  -- ── Check 1: every public table has RLS enabled ─────────────────────
  SELECT COALESCE(array_agg(c.relname ORDER BY c.relname), ARRAY[]::TEXT[])
    INTO unprotected_tables
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE c.relkind = 'r'                              -- ordinary tables
     AND n.nspname = 'public'                         -- our schema only
     AND c.relrowsecurity = false                     -- RLS off
     AND NOT (c.relname = ANY(rls_optional_tables));  -- not allowlisted

  IF array_length(unprotected_tables, 1) > 0 THEN
    msg := 'RLS DISABLED on tables: ' || array_to_string(unprotected_tables, ', ');
    RAISE EXCEPTION '%', msg;
  END IF;

  -- ── Check 2: every RLS-enabled table has at least one policy ────────
  -- A table with RLS on but zero policies is default-deny (no rows
  -- returned to anyone). That's secure but almost always a bug.
  SELECT COALESCE(array_agg(c.relname ORDER BY c.relname), ARRAY[]::TEXT[])
    INTO policyless_tables
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
   WHERE c.relkind = 'r'
     AND n.nspname = 'public'
     AND c.relrowsecurity = true
     AND NOT EXISTS (
       SELECT 1 FROM pg_policies p
        WHERE p.schemaname = 'public'
          AND p.tablename = c.relname
     );

  IF array_length(policyless_tables, 1) > 0 THEN
    msg := 'RLS enabled but NO POLICIES on tables: ' || array_to_string(policyless_tables, ', ');
    RAISE EXCEPTION '%', msg;
  END IF;

  -- ── Success ─────────────────────────────────────────────────────────
  RAISE NOTICE 'RLS verification PASSED: every public table has RLS + at least one policy';
END $$;

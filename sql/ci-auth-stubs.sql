-- ════════════════════════════════════════════════════
-- CI Auth Stubs
-- Final-Audit 04-15-2026 finding DB-CRIT-002 (Option C)
--
-- Minimal stand-in for Supabase's `auth` schema so our RLS policies
-- parse and install in a vanilla Postgres CI instance. Not used in
-- production — Supabase provides the real auth schema + functions.
--
-- Policies reference auth.uid(); in CI it always returns NULL (no user
-- is "logged in" to the CI database), so policies don't match any rows.
-- That's fine: we're verifying that RLS is correctly ENABLED + has
-- policies, not testing policy semantics.
-- ════════════════════════════════════════════════════

CREATE SCHEMA IF NOT EXISTS auth;

-- Minimal auth.users table (sql/001_schema.sql's parents.id FK's here).
-- Only the columns referenced in the foreign key matter; structure is
-- a subset of Supabase's real auth.users.
CREATE TABLE IF NOT EXISTS auth.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text,
  created_at timestamptz DEFAULT now()
);

-- Supabase auth.uid() is STABLE and returns the caller's auth user id.
-- Null in CI because no one is "logged in" to the test db.
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid
  LANGUAGE sql STABLE AS $$ SELECT NULL::uuid $$;

-- auth.role() returns 'anon' | 'authenticated' | 'service_role' in Supabase.
CREATE OR REPLACE FUNCTION auth.role() RETURNS text
  LANGUAGE sql STABLE AS $$ SELECT 'anon'::text $$;

-- auth.email() is used by a small number of policies.
CREATE OR REPLACE FUNCTION auth.email() RETURNS text
  LANGUAGE sql STABLE AS $$ SELECT NULL::text $$;

-- ─── Supabase roles (CI stubs) ─────────────────────
-- Supabase projects have `anon`, `authenticated`, and `service_role`
-- preinstalled. Vanilla Postgres doesn't, so any migration that uses
-- GRANT ... TO <role> (e.g. sql/023_mfa_backup_codes.sql,
-- sql/schema-stage8-dashboard-fn.sql) fails until we create them.
-- All three are NOLOGIN — they exist purely as grant targets.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    CREATE ROLE anon NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role NOLOGIN BYPASSRLS;
  END IF;
END $$;

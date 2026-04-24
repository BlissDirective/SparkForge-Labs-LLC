-- Auto-fix per advisor lint 0014_extension_in_public.
-- Match existing convention: pgcrypto, uuid-ossp, pg_stat_statements all in `extensions`.
ALTER EXTENSION pgaudit SET SCHEMA extensions;

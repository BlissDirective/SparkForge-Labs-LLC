-- Install pgaudit extension only.
-- The ALTER DATABASE postgres SET pgaudit.* GUCs require supabase_admin
-- and must be applied via Supabase Dashboard → Database → Configuration.
-- See sql/021_enable_pgaudit.sql for the GUC values.
CREATE EXTENSION IF NOT EXISTS pgaudit;

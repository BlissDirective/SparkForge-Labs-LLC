-- ════════════════════════════════════════════════════════════════
-- 018_content_slug_enforce.sql — DB-MED-003 (Opt B)
-- ════════════════════════════════════════════════════════════════
-- Makes content.slug NOT NULL + auto-generates slugs from the title
-- on INSERT. Existing NULL or empty slugs are backfilled before the
-- NOT NULL constraint is applied.
--
-- Shape (post-apply):
--
--   slug TEXT NOT NULL DEFAULT ''
--   BEFORE INSERT trigger → if slug IS NULL or '' then
--     slug := slugify(title) || '-' || <8 hex chars from gen_random_uuid()>
--   UNIQUE + existing idx_content_slug carry over (partial WHERE
--   IS NOT NULL becomes a no-op predicate but stays valid).
--
-- The 8-hex suffix gives ~4 billion collision resistance per title
-- slug — adequate for a content catalog of any realistic size
-- (SparkForge will max out around ~5k items across 10 labs).
--
-- Ref: Final-Audit_04-15-2026.md §DB-MED-003

-- ─── 1. slugify() helper ───
--
-- Lowercases, replaces any run of non-alphanumeric chars with '-',
-- and trims leading/trailing dashes. IMMUTABLE so it can be used in
-- indexes and generated columns if future migrations want to.
CREATE OR REPLACE FUNCTION slugify(input TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
STRICT
AS $$
  SELECT trim(both '-' from regexp_replace(lower(input), '[^a-z0-9]+', '-', 'g'))
$$;

-- ─── 2. Backfill any NULL / empty slugs ───
UPDATE content
   SET slug = slugify(title) || '-' || substr(gen_random_uuid()::text, 1, 8)
 WHERE slug IS NULL
    OR slug = '';

-- ─── 3. Apply NOT NULL DEFAULT '' ───
--
-- DEFAULT '' so an INSERT that omits slug doesn't hit the NOT NULL
-- constraint — the BEFORE INSERT trigger in step 4 fills the value
-- before the row is committed.
ALTER TABLE content
  ALTER COLUMN slug SET DEFAULT '',
  ALTER COLUMN slug SET NOT NULL;

-- ─── 4. BEFORE INSERT trigger for auto-generation ───
CREATE OR REPLACE FUNCTION content_auto_slug()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $fn$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := slugify(NEW.title) || '-' || substr(gen_random_uuid()::text, 1, 8);
  END IF;
  RETURN NEW;
END
$fn$;

DROP TRIGGER IF EXISTS trg_content_auto_slug ON content;
CREATE TRIGGER trg_content_auto_slug
  BEFORE INSERT ON content
  FOR EACH ROW
  EXECUTE FUNCTION content_auto_slug();

-- ─── 5. Verification ───
DO $$
DECLARE
  null_count INTEGER;
  empty_count INTEGER;
  not_nullable BOOLEAN;
  trigger_exists BOOLEAN;
BEGIN
  SELECT COUNT(*) INTO null_count FROM content WHERE slug IS NULL;
  SELECT COUNT(*) INTO empty_count FROM content WHERE slug = '';

  SELECT (is_nullable = 'NO') INTO not_nullable
    FROM information_schema.columns
   WHERE table_name = 'content' AND column_name = 'slug';

  SELECT EXISTS (
    SELECT 1 FROM pg_trigger
     WHERE tgname = 'trg_content_auto_slug' AND NOT tgisinternal
  ) INTO trigger_exists;

  IF null_count > 0 OR empty_count > 0 THEN
    RAISE EXCEPTION '018: % null + % empty slugs remain after backfill',
      null_count, empty_count;
  END IF;
  IF NOT not_nullable THEN
    RAISE EXCEPTION '018: content.slug is still nullable';
  END IF;
  IF NOT trigger_exists THEN
    RAISE EXCEPTION '018: trg_content_auto_slug trigger not installed';
  END IF;
  RAISE NOTICE '018: verification PASSED — slug is NOT NULL, trigger active, 0 empty/null rows';
END $$;

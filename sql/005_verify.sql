-- ════════════════════════════════════════════════════
-- SPARKFORGE DATABASE VERIFICATION QUERIES
-- Run these after all other SQL files to confirm setup
-- ════════════════════════════════════════════════════

-- Should return 9 tables
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' ORDER BY table_name;

-- Should return 78 badges (7+7+10+10+10+5+5+8+6)
SELECT category, COUNT(*) FROM badges GROUP BY category ORDER BY category;

-- Should return 6 starter content items
SELECT world, type, target_age_band, title FROM content
WHERE status = 'published' ORDER BY world, sort_order;

-- Should show RLS enabled on all tables
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public' ORDER BY tablename;

-- v2: Verify onboarding_complete column exists
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'parents' AND column_name = 'onboarding_complete';

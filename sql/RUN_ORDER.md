# SparkForge SQL — Run Order

Run these SQL files **in order** in the Supabase SQL Editor (Dashboard > SQL Editor > New Query).

Each file should be copy-pasted into a new query and executed individually. Wait for each to complete before running the next.

## Execution Order

| Order | File | Description |
|-------|------|-------------|
| 1 | `001_schema.sql` | Creates all 9 database tables (parents, children, content, progress, badges, child_badges, content_queue, sessions, prompt_history) |
| 2 | `001a_indexes.sql` | Creates 14 performance indexes |
| 3 | `002_rls.sql` | Enables Row Level Security on all tables and creates access policies |
| 4 | `003_functions.sql` | Creates database functions (updated_at triggers, daily/weekly resets, COPPA cleanup, lab progress calculator) |
| 5 | `004_badges_seed.sql` | Seeds 68 badge definitions across 9 categories (progress, streak, world, game_master, knowledge, explorer, creator, secret, prestige) |
| 6 | `005_content_seed.sql` | Seeds 6 starter content items for Labs 1-3 (lessons, quiz, spark fact) |
| 7 | `006_cron.sql` | Sets up daily COPPA cleanup cron job (**Supabase Pro plan only** — skip on free plan) |

## Verification

After running all files, execute these queries to confirm everything is set up correctly:

```sql
-- Should return 9 tables
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public' ORDER BY table_name;

-- Should return 68 badges (7+7+10+10+10+5+5+8+6)
SELECT category, COUNT(*) FROM badges GROUP BY category ORDER BY category;

-- Should return 6 starter content items
SELECT world, type, target_age_band, title FROM content
WHERE status = 'published' ORDER BY world, sort_order;

-- Should show RLS enabled on all tables
SELECT tablename, rowsecurity FROM pg_tables
WHERE schemaname = 'public' ORDER BY tablename;

-- Verify onboarding_complete column exists
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'parents' AND column_name = 'onboarding_complete';
```

## Expected Results

- **9 tables:** badges, child_badges, children, content, content_queue, parents, progress, prompt_history, sessions
- **68 badges** across 9 categories
- **6 starter content** items (Labs 1-3)
- All tables with `rowsecurity = true`
- `onboarding_complete` column exists with default `false`

## Notes

- The database uses `world` as the column name (not `lab`). The UI displays "Lab" but the DB stores "world".
- `parents.subscription_status` defaults to `'active'` — this is intentional for all users including free tier.
- `006_cron.sql` requires Supabase Pro plan (`pg_cron` extension). On free plan, manually run `SELECT cleanup_old_prompts();` periodically.

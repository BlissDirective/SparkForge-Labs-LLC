# Applied Migration History

**Project:** SparkForge | **Branch:** `claude/setup-sparkforge-supabase-g5OEx`
**Total tracked migrations:** 31 | **Date applied:** April 24, 2026

This manifest tracks the migrations applied to the live Supabase database via
`mcp__supabase__apply_migration`. Each entry maps to the canonical source SQL
in `sql/` (or to a novel migration file in this `supabase/migrations/` folder
for migrations that don't have a canonical source).

## Tracked migration order (chronological)

| # | Version | Migration name | Source / Notes |
|---|---|---|---|
| 1 | `20260424203930` | `enable_pg_cron_extension` | Novel — `supabase/migrations/20260424203930_*.sql` |
| 2 | `20260424203958` | `enable_pgaudit_extension_only` | Novel (split of `sql/021_enable_pgaudit.sql` — DB-side only; ALTER DATABASE GUCs deferred to Dashboard) |
| 3 | `20260424204020` | `harden_function_search_paths` | Novel — pins `search_path` on 5 functions (advisor lint 0011) |
| 4 | `20260424204046` | `move_pgaudit_to_extensions_schema` | Novel — auto-fix per advisor lint 0014 |
| 5 | `20260424204134` | `add_perf_indexes_001a` | `sql/001a_indexes.sql` |
| 6 | `20260424204244` | `seed_badges_004_canonical` | `sql/004_badges_seed.sql` |
| 7 | `20260424204351` | `seed_starter_content_005` | `sql/005_content_seed.sql` |
| 8 | `20260424204437` | `stage8_dashboard_fn` | `sql/schema-stage8-dashboard-fn.sql` |
| 9 | `20260424204514` | `fll_content_types_extension` | `sql/schema-fll-content-types.sql` |
| 10 | `20260424204527` | `stage8_patch_admin_trials` | `sql/schema-stage8-patch-admin-trials.sql` |
| 11 | `20260424204543` | `stage8_patch_children_archive` | `sql/schema-stage8-patch-children-archive.sql` |
| 12 | `20260424204624` | `subscription_events_processed_008` | `sql/008_subscription_events_processed.sql` |
| 13 | `20260424204634` | `subscription_events_split_009` | `sql/009_subscription_events_split.sql` |
| 14 | `20260424204647` | `rls_belt_and_suspenders_010` | `sql/010_rls_belt_and_suspenders.sql` |
| 15 | `20260424204724` | `parents_email_verified_at_011` | `sql/011_parents_email_verified_at.sql` |
| 16 | `20260424204732` | `xp_daily_cap_012` | `sql/012_xp_daily_cap.sql` (+ `SET search_path` hardening on `reset_daily_xp()`) |
| 17 | `20260424204743` | `content_admin_tighten_013` | `sql/013_content_admin_tighten.sql` |
| 18 | `20260424204802` | `audit_log_014` | `sql/014_audit_log.sql` (+ `, pg_temp` hardening on `audit_trigger()` search_path) |
| 19 | `20260424204812` | `pg_cron_daily_resets_015` | `sql/015_pg_cron_daily_resets.sql` |
| 20 | `20260424204820` | `cron_006_coppa_streak` | `sql/006_cron.sql` (idempotent re-schedule wrapper added) |
| 21 | `20260424204858` | `perf_indexes_016` | `sql/016_perf_indexes.sql` |
| 22 | `20260424204911` | `subscription_events_fk_cleanup_017` | `sql/017_subscription_events_fk_cleanup.sql` (+ `, pg_temp` hardening on `cleanup_orphaned_subscription_events()`) |
| 23 | `20260424204925` | `content_slug_enforce_018` | `sql/018_content_slug_enforce.sql` (+ `SET search_path` hardening on `slugify()` and `content_auto_slug()`) |
| 24 | `20260424205030` | `demo_role_rls_019` | `sql/019_demo_role_rls.sql` (+ `SET search_path` hardening on `auth_is_anonymous()`) |
| 25 | `20260424205048` | `passkey_credentials_020` | `sql/020_passkey_credentials.sql` (+ `, pg_temp` hardening on `cleanup_expired_passkey_challenges()`) |
| 26 | `20260424205125` | `auth_events_022` | `sql/022_auth_events.sql` |
| 27 | `20260424205136` | `mfa_backup_codes_023` | `sql/023_mfa_backup_codes.sql` (+ `, pg_temp` hardening on `mfa_backup_codes_remaining()`) |
| 28 | `20260424205142` | `realtime_progress_024` | `sql/024_realtime_progress.sql` |
| 29 | `20260424205152` | `dunning_025` | `sql/025_dunning.sql` |
| 30 | `20260424211353` | `standard_game_ids_20260410` | `supabase/migrations/20260410_add_standard_game_ids.sql` (+ added `content_queue.game_id` and `content_queue.content_type` prereq columns; CHECK constraints relaxed to allow NULL; partial indexes) |
| 31 | `20260424211512` | `restrict_policies_to_authenticated_role` | Novel — `supabase/migrations/20260424211512_*.sql` (Option A advisor mitigation) |
| 32 | `20260506000001` | `promote_cdsteinmeyer_admin` | Novel — `supabase/migrations/20260506000001_*.sql` (idempotent admin seed; flips `is_admin=true` on the existing parents row, or installs a one-shot BEFORE INSERT trigger if the account hasn't signed up yet) |

## Skipped from canonical sources

- `sql/021_enable_pgaudit.sql` — `ALTER DATABASE postgres SET pgaudit.*` GUCs require `supabase_admin` role and cannot be set via MCP. Apply via Supabase Dashboard → Database → Configuration. The `CREATE EXTENSION pgaudit` portion was applied separately as migration #2.

## Auto-fixed during application (per CLAUDE.md §3.1 ESLint/linter category)

The following `SECURITY DEFINER` functions had their `SET search_path` clause
augmented with `, pg_temp` (or added entirely) to prevent triggering the
`function_search_path_mutable` advisor lint after their migrations applied:

- `reset_daily_xp()` — sql/012 had no search_path; added `public, pg_temp`
- `audit_trigger()` — sql/014 had `public`; appended `, pg_temp`
- `cleanup_orphaned_subscription_events()` — sql/017 had `public`; appended `, pg_temp`
- `slugify(text)` — sql/018 had no search_path; added `public, pg_temp`
- `content_auto_slug()` — sql/018 had no search_path; added `public, pg_temp`
- `auth_is_anonymous()` — sql/019 had no search_path; added `public, pg_temp`
- `cleanup_expired_passkey_challenges()` — sql/020 had no search_path; added `public, pg_temp`
- `mfa_backup_codes_remaining(uuid)` — sql/023 had `public`; appended `, pg_temp`

## Live state delta (post-migration)

- **0** function_search_path_mutable advisor warnings (was 5)
- **0** extension_in_public advisor warnings (was 1)
- **22** anonymous-access policy warnings remain — documented false positive (RESTRICTIVE `demo_deny_*` blocks via `auth_is_anonymous()` but advisor cannot trace through). See `PROGRESS.md` "Advisor false-positive note".
- **1** `auth_leaked_password_protection` warning — Dashboard toggle, deferred user action.
- **6** pg_cron jobs scheduled (coppa-cleanup, streak-reset, daily-reset-prompts, daily-reset-xp, weekly-reset-games, audit-log-retention, passkey-challenge-cleanup, purge_auth_events_180d, subscription-events-orphan-cleanup)
- **2** Realtime publication tables (`progress`, `children`)

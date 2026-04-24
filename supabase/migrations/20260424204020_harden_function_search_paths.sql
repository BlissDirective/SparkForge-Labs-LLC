-- DB-SEC: pin search_path on all 5 public functions to mitigate
-- search_path hijack vectors (advisor lint 0011_function_search_path_mutable).
--
-- Mythos-style verification:
--   Symptom -> Likely cause -> Check
--   "function_search_path_mutable WARN x5" -> live functions created
--   before sql/003_functions.sql line 81 was added -> ALTER each one.

ALTER FUNCTION public.update_updated_at()       SET search_path = public, pg_temp;
ALTER FUNCTION public.reset_daily_prompts()     SET search_path = public, pg_temp;
ALTER FUNCTION public.reset_weekly_games()      SET search_path = public, pg_temp;
ALTER FUNCTION public.cleanup_old_prompts()     SET search_path = public, pg_temp;
ALTER FUNCTION public.get_lab_progress(uuid, integer, text) SET search_path = public, pg_temp;

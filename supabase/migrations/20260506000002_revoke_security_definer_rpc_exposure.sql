-- AUDIT-FIX 2026-05-06: tighten access on auth-related SECURITY DEFINER functions.
--
-- Two findings from the post-promotion auth audit:
--
-- 1) `mfa_backup_codes_remaining(p_parent_id uuid)` is SECURITY DEFINER and
--    accepts an arbitrary parent_id. The previous GRANT to `authenticated`
--    meant any logged-in user could call /rest/v1/rpc/mfa_backup_codes_remaining
--    with someone else's parent_id and learn their remaining backup-code
--    count (information disclosure). The only legitimate caller is the
--    server (src/lib/auth/mfa.ts → admin.rpc(...)), which uses the
--    service_role and is unaffected by these GRANTs.
--
-- 2) `audit_trigger()` is SECURITY DEFINER. It is only meaningful when fired
--    by the trigger context (TG_OP / TG_TABLE_NAME / NEW / OLD); calling it
--    directly via /rest/v1/rpc/audit_trigger would error at the first
--    reference. Still, exposing it on the public RPC surface produces noise
--    (Supabase advisor lints 0028 + 0029 currently flag it) and is purely
--    defensive to revoke.

REVOKE EXECUTE ON FUNCTION public.mfa_backup_codes_remaining(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.mfa_backup_codes_remaining(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.mfa_backup_codes_remaining(uuid) FROM authenticated;

REVOKE EXECUTE ON FUNCTION public.audit_trigger() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.audit_trigger() FROM anon;
REVOKE EXECUTE ON FUNCTION public.audit_trigger() FROM authenticated;

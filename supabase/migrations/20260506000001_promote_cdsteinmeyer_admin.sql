-- Promote cdsteinmeyer1@gmail.com to admin.
-- Idempotent and forward-compatible:
--   1) If the parents row already exists, flip is_admin to true.
--   2) If it doesn't exist yet (account not created), install a one-shot
--      BEFORE INSERT trigger that promotes the row the moment it is
--      created (i.e. the moment the user signs up), then drops itself
--      on first fire so it does not linger past its purpose.

DO $$
DECLARE
  v_email   TEXT := 'cdsteinmeyer1@gmail.com';
  v_updated INT;
BEGIN
  UPDATE public.parents
     SET is_admin   = true,
         updated_at = now()
   WHERE lower(email) = lower(v_email);

  GET DIAGNOSTICS v_updated = ROW_COUNT;

  IF v_updated = 0 THEN
    CREATE OR REPLACE FUNCTION public._promote_seed_admin_cdsteinmeyer()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public, pg_temp
    AS $fn$
    BEGIN
      IF lower(NEW.email) = 'cdsteinmeyer1@gmail.com' THEN
        NEW.is_admin := true;
        EXECUTE 'DROP TRIGGER IF EXISTS _promote_seed_admin_cdsteinmeyer ON public.parents';
        EXECUTE 'DROP FUNCTION IF EXISTS public._promote_seed_admin_cdsteinmeyer()';
      END IF;
      RETURN NEW;
    END;
    $fn$;

    DROP TRIGGER IF EXISTS _promote_seed_admin_cdsteinmeyer ON public.parents;
    CREATE TRIGGER _promote_seed_admin_cdsteinmeyer
      BEFORE INSERT ON public.parents
      FOR EACH ROW
      EXECUTE FUNCTION public._promote_seed_admin_cdsteinmeyer();
  END IF;
END;
$$;

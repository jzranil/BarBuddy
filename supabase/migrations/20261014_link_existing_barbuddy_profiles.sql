-- Fix: creating a Supabase Auth user for an email that already has a
-- bb_users_tbl profile failed with
--   duplicate key value violates unique constraint "bb_users_tbl_user_email_key"
-- because handle_new_barbuddy_user() always INSERTed a new profile.
--
-- New behaviour of the on_auth_user_created_barbuddy trigger:
--   * Email already has a BarBuddy profile:
--       - auth user created with a confirmed email (admin / migration script):
--         link the existing profile (set auth_user_id). No new row.
--       - normal signup (email not confirmed yet): leave the profile alone.
--         backend/src/routes/login.ts links it on the first confirmed login,
--         so nobody can claim an existing profile without owning the inbox.
--   * No profile for the email: insert a Reviewee profile (same as before),
--     using '' instead of NULL for missing names (user_fname/user_lname are NOT NULL).
--
-- Only the function body changes. The trigger, tables and data are untouched.

CREATE OR REPLACE FUNCTION public.handle_new_barbuddy_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.bb_users_tbl
    WHERE lower(user_email) = lower(NEW.email)
  ) THEN
    IF NEW.email_confirmed_at IS NOT NULL THEN
      UPDATE public.bb_users_tbl
         SET auth_user_id = NEW.id,
             updated_at = now()
       WHERE lower(user_email) = lower(NEW.email)
         AND auth_user_id IS NULL;
    END IF;

    RETURN NEW;
  END IF;

  INSERT INTO public.bb_users_tbl (
    auth_user_id,
    permission_id,
    user_fname,
    user_lname,
    user_email,
    user_contact,
    user_status,
    user_progress,
    user_attempts,
    is_archived
  ) VALUES (
    NEW.id,
    'a11498ab-0a57-4ed2-9315-29167e6a2f63'::uuid,
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'first_name'), ''), ''),
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'last_name'), ''), ''),
    NEW.email,
    NULLIF(TRIM(NEW.raw_user_meta_data->>'contact_number'), ''),
    'ACTIVE',
    0,
    0,
    FALSE
  );

  RETURN NEW;
END;
$function$;

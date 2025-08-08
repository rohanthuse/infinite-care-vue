
-- Ensure the function can see pgcrypto functions (crypt, gen_salt) in the extensions schema
ALTER FUNCTION public.create_system_user_and_role_with_session(
  p_session_token text,
  p_email text,
  p_password text,
  p_first_name text,
  p_last_name text,
  p_role public.system_role
) SET search_path TO 'public, extensions';

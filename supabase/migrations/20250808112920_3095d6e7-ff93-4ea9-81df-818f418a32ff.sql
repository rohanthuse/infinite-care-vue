
-- 1) Recreate the main RPC used by the "Add System User" form to use schema-qualified pgcrypto calls
--    and keep search_path robust.
CREATE OR REPLACE FUNCTION public.create_system_user_and_role_with_session(
  p_session_token text,
  p_email text,
  p_password text,
  p_first_name text,
  p_last_name text,
  p_role public.system_role
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public, extensions
AS $function$
DECLARE
  v_caller_id uuid;
  v_user_id uuid;
BEGIN
  -- Validate session
  v_caller_id := public._validate_system_session(p_session_token);
  IF v_caller_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated as a system user');
  END IF;

  -- Require super_admin
  IF NOT public._is_system_super_admin(v_caller_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient permissions');
  END IF;

  -- Email must be unique
  IF EXISTS (SELECT 1 FROM public.system_users WHERE email = p_email) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Email already exists');
  END IF;

  -- Create user with hashed password (schema-qualified pgcrypto usage)
  INSERT INTO public.system_users (
    email,
    encrypted_password,
    first_name,
    last_name,
    is_active,
    created_by
  )
  VALUES (
    p_email,
    extensions.crypt(p_password, extensions.gen_salt('bf')),
    p_first_name,
    p_last_name,
    TRUE,
    v_caller_id
  )
  RETURNING id INTO v_user_id;

  -- Assign initial role
  INSERT INTO public.system_user_roles (system_user_id, role, granted_by)
  VALUES (v_user_id, p_role, v_caller_id);

  RETURN jsonb_build_object(
    'success', true,
    'user', (
      SELECT jsonb_build_object(
        'id', su.id,
        'email', su.email,
        'first_name', su.first_name,
        'last_name', su.last_name,
        'is_active', su.is_active,
        'created_at', su.created_at
      )
      FROM public.system_users su
      WHERE su.id = v_user_id
    ),
    'roles', (
      SELECT COALESCE(jsonb_agg(r.role), '[]'::jsonb)
      FROM public.system_user_roles r
      WHERE r.system_user_id = v_user_id
    )
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$function$;

-- 2) Ensure helper functions do not reset search_path to only 'public'
--    (which can interfere when nested). We align them with the same path.
ALTER FUNCTION public._validate_system_session(p_session_token text)
  SET search_path TO 'public, extensions';

ALTER FUNCTION public._is_system_super_admin(p_system_user_id uuid)
  SET search_path TO 'public, extensions';

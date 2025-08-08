-- Create or replace function to update a system user with session validation
CREATE OR REPLACE FUNCTION public.update_system_user_with_session(
  p_session_token text,
  p_user_id uuid,
  p_email text,
  p_first_name text,
  p_last_name text,
  p_role public.system_role
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_caller_id uuid;
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

  -- Ensure email uniqueness (allow keeping same email)
  IF EXISTS (
    SELECT 1 FROM public.system_users su
    WHERE su.email = p_email AND su.id <> p_user_id
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Email already in use by another user');
  END IF;

  -- Update core user fields
  UPDATE public.system_users
  SET 
    email = p_email,
    first_name = p_first_name,
    last_name = p_last_name,
    updated_at = now()
  WHERE id = p_user_id;

  -- Replace role with the new single role for simplicity
  DELETE FROM public.system_user_roles WHERE system_user_id = p_user_id;
  INSERT INTO public.system_user_roles (system_user_id, role, granted_by)
  VALUES (p_user_id, p_role, v_caller_id);

  RETURN jsonb_build_object(
    'success', true,
    'user', (
      SELECT jsonb_build_object(
        'id', su.id,
        'email', su.email,
        'first_name', su.first_name,
        'last_name', su.last_name,
        'is_active', su.is_active,
        'last_login_at', su.last_login_at,
        'created_at', su.created_at
      )
      FROM public.system_users su
      WHERE su.id = p_user_id
    ),
    'role', p_role
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.update_system_user_with_session(text, uuid, text, text, text, public.system_role)
  TO anon, authenticated;
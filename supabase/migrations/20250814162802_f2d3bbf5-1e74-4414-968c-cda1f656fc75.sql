-- Create function to reset system user password
CREATE OR REPLACE FUNCTION public.reset_system_user_password_with_session(
  p_user_id uuid,
  p_new_password text,
  p_admin_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
  auth_user_id uuid;
  result json;
BEGIN
  -- Check if the admin has permission (must be super_admin)
  IF NOT EXISTS (
    SELECT 1 FROM public.system_users 
    WHERE id = p_admin_id AND role = 'super_admin' AND is_active = true
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient permissions');
  END IF;
  
  -- Get system user record
  SELECT * INTO user_record FROM public.system_users WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'System user not found');
  END IF;
  
  -- Find the auth user by email
  SELECT id INTO auth_user_id FROM auth.users WHERE email = user_record.email;
  
  IF auth_user_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Auth user not found for this system user');
  END IF;
  
  -- Update the auth user's password
  UPDATE auth.users 
  SET encrypted_password = crypt(p_new_password, gen_salt('bf')),
      updated_at = now()
  WHERE id = auth_user_id;
  
  -- Update system user record with password reset info
  UPDATE public.system_users 
  SET password_reset_at = now(),
      password_reset_by = p_admin_id,
      updated_at = now()
  WHERE id = p_user_id;
  
  RETURN json_build_object(
    'success', true, 
    'message', 'Password reset successfully',
    'auth_user_id', auth_user_id
  );
END;
$$;
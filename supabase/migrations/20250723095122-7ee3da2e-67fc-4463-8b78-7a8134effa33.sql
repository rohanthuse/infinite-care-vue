
-- Fix the admin_set_staff_password function to resolve column reference ambiguity
CREATE OR REPLACE FUNCTION public.admin_set_staff_password(
  p_staff_id uuid,
  p_new_password text,
  p_admin_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  staff_record RECORD;
  new_auth_user_id uuid;  -- Renamed variable to avoid ambiguity
  result json;
BEGIN
  -- Check if the admin has permission (must be super_admin or branch_admin)
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = p_admin_id AND role IN ('super_admin', 'branch_admin')
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient permissions');
  END IF;
  
  -- Get staff record
  SELECT * INTO staff_record FROM public.staff WHERE id = p_staff_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Staff member not found');
  END IF;
  
  -- For branch admins, check if they have access to this staff member's branch
  IF EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = p_admin_id AND role = 'branch_admin'
  ) THEN
    -- Get admin's branch access
    IF NOT EXISTS (
      SELECT 1 FROM public.admin_branches 
      WHERE admin_id = p_admin_id AND branch_id = staff_record.branch_id
    ) THEN
      RETURN json_build_object('success', false, 'error', 'Access denied: You can only manage staff in your assigned branches');
    END IF;
  END IF;
  
  -- Check if staff member already has an auth account
  SELECT id INTO new_auth_user_id FROM auth.users WHERE email = staff_record.email;
  
  IF new_auth_user_id IS NULL THEN
    -- Create new auth user if doesn't exist
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      staff_record.email,
      crypt(p_new_password, gen_salt('bf')),
      now(),
      now(),
      now(),
      '',
      ''
    ) RETURNING id INTO new_auth_user_id;
    
    -- CRITICAL FIX: Update auth_user_id with explicit table qualification
    UPDATE public.staff 
    SET auth_user_id = new_auth_user_id,
        temporary_password = p_new_password,
        invitation_sent_at = now(),
        updated_at = now()
    WHERE id = p_staff_id;
    
    -- Assign carer role
    INSERT INTO public.user_roles (user_id, role) 
    VALUES (new_auth_user_id, 'carer')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    -- Update existing user's password
    UPDATE auth.users 
    SET encrypted_password = crypt(p_new_password, gen_salt('bf')),
        updated_at = now()
    WHERE id = new_auth_user_id;
    
    -- Update staff record to link to auth user
    UPDATE public.staff 
    SET auth_user_id = new_auth_user_id,
        temporary_password = p_new_password,
        invitation_sent_at = now(),
        updated_at = now()
    WHERE id = p_staff_id;
  END IF;
  
  RETURN json_build_object(
    'success', true, 
    'message', 'Password set successfully',
    'auth_user_id', new_auth_user_id
  );
END;
$$;

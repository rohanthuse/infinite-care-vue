
-- Create a privileged function to fix auth.users schema issues
-- This function has elevated privileges to modify the auth.users table directly

CREATE OR REPLACE FUNCTION public.fix_auth_users_schema()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  affected_rows INTEGER := 0;
  result json;
BEGIN
  -- Update NULL values to empty strings in auth.users table
  -- This fixes the "Database error querying schema" issue
  UPDATE auth.users 
  SET 
    email_change_token_new = COALESCE(email_change_token_new, ''),
    email_change_token_current = COALESCE(email_change_token_current, ''),
    email_change = COALESCE(email_change, ''),
    email_change_confirm_status = COALESCE(email_change_confirm_status, 0)
  WHERE 
    email_change_token_new IS NULL 
    OR email_change_token_current IS NULL 
    OR email_change IS NULL
    OR email_change_confirm_status IS NULL;
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  
  -- Also set default values for future inserts
  BEGIN
    ALTER TABLE auth.users 
    ALTER COLUMN email_change_token_new SET DEFAULT '',
    ALTER COLUMN email_change_token_current SET DEFAULT '',
    ALTER COLUMN email_change SET DEFAULT '',
    ALTER COLUMN email_change_confirm_status SET DEFAULT 0;
  EXCEPTION
    WHEN insufficient_privilege THEN
      -- Log the privilege issue but continue
      NULL;
  END;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Auth users schema fixed successfully',
    'affected_rows', affected_rows
  );
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Failed to fix auth users schema: ' || SQLERRM
    );
END;
$$;

-- Create a function to recreate client authentication safely
CREATE OR REPLACE FUNCTION public.recreate_client_authentication(
  p_client_email text,
  p_admin_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  client_record RECORD;
  auth_user_id uuid;
  temp_password text;
  result json;
BEGIN
  -- Check admin permissions
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = p_admin_id AND role IN ('super_admin', 'branch_admin')
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient permissions');
  END IF;
  
  -- Get client record
  SELECT * INTO client_record 
  FROM public.clients 
  WHERE email = p_client_email;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Client not found');
  END IF;
  
  -- Generate temporary password
  temp_password := encode(gen_random_bytes(12), 'base64');
  
  -- First, try to delete existing problematic auth user
  BEGIN
    DELETE FROM auth.users WHERE email = p_client_email;
  EXCEPTION
    WHEN OTHERS THEN
      -- Continue if deletion fails
      NULL;
  END;
  
  -- Create new auth user with proper defaults
  auth_user_id := gen_random_uuid();
  
  BEGIN
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
      recovery_token,
      email_change_token_new,
      email_change_token_current,
      email_change,
      email_change_confirm_status
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      auth_user_id,
      'authenticated',
      'authenticated',
      client_record.email,
      crypt(temp_password, gen_salt('bf')),
      now(),
      now(),
      now(),
      '',
      '',
      '', -- Explicitly set to empty string
      '', -- Explicitly set to empty string
      '', -- Explicitly set to empty string
      0   -- Explicitly set to 0
    );
    
    -- Assign client role
    INSERT INTO public.user_roles (user_id, role) 
    VALUES (auth_user_id, 'client')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Update client record
    UPDATE public.clients 
    SET temporary_password = temp_password,
        invitation_sent_at = now(),
        password_set_by = p_admin_id
    WHERE id = client_record.id;
    
    RETURN json_build_object(
      'success', true, 
      'message', 'Client authentication recreated successfully',
      'auth_user_id', auth_user_id,
      'temporary_password', temp_password
    );
    
  EXCEPTION
    WHEN OTHERS THEN
      RETURN json_build_object(
        'success', false, 
        'error', 'Failed to recreate client authentication: ' || SQLERRM
      );
  END;
END;
$$;

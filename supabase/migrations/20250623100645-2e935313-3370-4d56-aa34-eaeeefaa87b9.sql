
-- Create a function to safely handle client authentication setup without using Auth Admin API
CREATE OR REPLACE FUNCTION public.safe_setup_client_auth(
  p_client_id uuid,
  p_password text,
  p_admin_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  client_record RECORD;
  auth_user_id uuid;
  result json;
BEGIN
  -- Check if the admin has permission (must be super_admin or branch_admin)
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = p_admin_id AND role IN ('super_admin', 'branch_admin')
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient permissions');
  END IF;
  
  -- Get client record
  SELECT * INTO client_record FROM public.clients WHERE id = p_client_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Client not found');
  END IF;
  
  -- Try to find existing auth user by email using a safer approach
  -- We'll check if a user exists by trying to match email in auth.users
  -- but avoid the problematic listUsers functionality
  BEGIN
    -- Generate a new UUID for potential new user
    auth_user_id := gen_random_uuid();
    
    -- Try to insert a new auth user directly
    -- This approach avoids the problematic Auth Admin API calls
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
      email_change_token_current
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      auth_user_id,
      'authenticated',
      'authenticated',
      client_record.email,
      crypt(p_password, gen_salt('bf')),
      now(),
      now(),
      now(),
      '',
      '',
      '',
      ''
    );
    
    -- If we get here, the user was created successfully
    -- Assign client role
    INSERT INTO public.user_roles (user_id, role) 
    VALUES (auth_user_id, 'client')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Update client record with password info
    UPDATE public.clients 
    SET temporary_password = p_password,
        invitation_sent_at = now(),
        password_set_by = p_admin_id
    WHERE id = p_client_id;
    
    RETURN json_build_object(
      'success', true, 
      'message', 'Client authentication created successfully',
      'auth_user_id', auth_user_id,
      'user_created', true
    );
    
  EXCEPTION
    WHEN unique_violation THEN
      -- User already exists, try to update their password
      BEGIN
        -- Find the existing user ID by email
        SELECT id INTO auth_user_id 
        FROM auth.users 
        WHERE email = client_record.email
        LIMIT 1;
        
        IF auth_user_id IS NOT NULL THEN
          -- Update existing user's password
          UPDATE auth.users 
          SET encrypted_password = crypt(p_password, gen_salt('bf')),
              updated_at = now()
          WHERE id = auth_user_id;
          
          -- Ensure client role exists
          INSERT INTO public.user_roles (user_id, role) 
          VALUES (auth_user_id, 'client')
          ON CONFLICT (user_id, role) DO NOTHING;
          
          -- Update client record with password info
          UPDATE public.clients 
          SET temporary_password = p_password,
              invitation_sent_at = now(),
              password_set_by = p_admin_id
          WHERE id = p_client_id;
          
          RETURN json_build_object(
            'success', true, 
            'message', 'Client authentication updated successfully',
            'auth_user_id', auth_user_id,
            'user_created', false
          );
        ELSE
          RETURN json_build_object('success', false, 'error', 'User exists but could not be found for update');
        END IF;
        
      EXCEPTION
        WHEN OTHERS THEN
          RETURN json_build_object('success', false, 'error', 'Failed to update existing user: ' || SQLERRM);
      END;
      
    WHEN OTHERS THEN
      RETURN json_build_object('success', false, 'error', 'Failed to create auth user: ' || SQLERRM);
  END;
END;
$$;

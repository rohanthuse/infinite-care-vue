-- Fix existing system users to ensure they can login through unified login
-- This migration will sync existing system users with the auth system

-- Create a function to fix existing system users without proper auth integration
CREATE OR REPLACE FUNCTION fix_existing_system_users()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_fixed_count INTEGER := 0;
  v_error_count INTEGER := 0;
  v_details JSONB := '[]'::JSONB;
  v_system_user RECORD;
  v_auth_user_id UUID;
  v_password TEXT;
BEGIN
  -- Loop through system users that don't have auth_user_id
  FOR v_system_user IN 
    SELECT * FROM public.system_users 
    WHERE auth_user_id IS NULL 
    AND is_active = true
  LOOP
    BEGIN
      -- Check if auth user already exists for this email
      SELECT id INTO v_auth_user_id 
      FROM auth.users 
      WHERE email = v_system_user.email;
      
      IF v_auth_user_id IS NOT NULL THEN
        -- Link existing auth user to system user
        UPDATE public.system_users 
        SET auth_user_id = v_auth_user_id, updated_at = now()
        WHERE id = v_system_user.id;
        
        -- Ensure super_admin role exists
        INSERT INTO public.user_roles (user_id, role)
        VALUES (v_auth_user_id, 'super_admin'::app_role)
        ON CONFLICT (user_id, role) DO NOTHING;
        
        v_fixed_count := v_fixed_count + 1;
        v_details := v_details || jsonb_build_object(
          'system_user_id', v_system_user.id,
          'email', v_system_user.email,
          'action', 'linked_existing_auth_user',
          'auth_user_id', v_auth_user_id
        );
      ELSE
        -- Create new auth user using existing system user password
        INSERT INTO auth.users (
          instance_id, id, aud, role, email, encrypted_password,
          email_confirmed_at, created_at, updated_at,
          confirmation_token, recovery_token,
          email_change_token_new, email_change_token_current,
          email_change, email_change_confirm_status
        ) VALUES (
          '00000000-0000-0000-0000-000000000000',
          gen_random_uuid(),
          'authenticated', 'authenticated',
          v_system_user.email,
          v_system_user.encrypted_password, -- Use same password hash
          now(), now(), now(), '', '', '', '', '', 0
        ) RETURNING id INTO v_auth_user_id;
        
        -- Link system user to new auth user
        UPDATE public.system_users 
        SET auth_user_id = v_auth_user_id, updated_at = now()
        WHERE id = v_system_user.id;
        
        -- Add super_admin role
        INSERT INTO public.user_roles (user_id, role)
        VALUES (v_auth_user_id, 'super_admin'::app_role);
        
        v_fixed_count := v_fixed_count + 1;
        v_details := v_details || jsonb_build_object(
          'system_user_id', v_system_user.id,
          'email', v_system_user.email,
          'action', 'created_new_auth_user',
          'auth_user_id', v_auth_user_id
        );
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      v_error_count := v_error_count + 1;
      v_details := v_details || jsonb_build_object(
        'system_user_id', v_system_user.id,
        'email', v_system_user.email,
        'action', 'error',
        'error_message', SQLERRM
      );
    END;
  END LOOP;
  
  RETURN json_build_object(
    'success', true,
    'fixed_count', v_fixed_count,
    'error_count', v_error_count,
    'details', v_details,
    'message', 'System users synchronized with auth system'
  );
END;
$$;

-- Run the fix for existing system users
SELECT fix_existing_system_users();

-- Now ensure existing system users have proper organization memberships
-- This will link any system_user_organizations to organization_members for unified login
INSERT INTO public.organization_members (
  organization_id, user_id, role, status, joined_at
)
SELECT DISTINCT
  suo.organization_id,
  su.auth_user_id,
  suo.role,
  'active',
  suo.created_at
FROM public.system_user_organizations suo
JOIN public.system_users su ON suo.system_user_id = su.id
WHERE su.auth_user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = suo.organization_id 
    AND om.user_id = su.auth_user_id
  );
-- Fix the ambiguous column reference in sync_system_user_to_organization function
CREATE OR REPLACE FUNCTION public.sync_system_user_to_organization(
  p_system_user_id UUID,
  p_organization_id UUID, 
  p_role TEXT DEFAULT 'member'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_auth_user_id UUID;
  v_result JSON;
  v_system_user RECORD;
BEGIN
  -- Get the system user record
  SELECT * INTO v_system_user 
  FROM public.system_users 
  WHERE id = p_system_user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'System user not found');
  END IF;
  
  -- Check if user already has an auth_user_id
  IF v_system_user.auth_user_id IS NOT NULL THEN
    v_auth_user_id := v_system_user.auth_user_id;
  ELSE
    -- Create or find auth user
    SELECT id INTO v_auth_user_id 
    FROM auth.users 
    WHERE email = v_system_user.email;
    
    IF v_auth_user_id IS NULL THEN
      -- Create new auth user
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
        crypt('temp_' || substr(md5(random()::text), 0, 8), gen_salt('bf')),
        now(), now(), now(), '', '', '', '', '', 0
      ) RETURNING id INTO v_auth_user_id;
    END IF;
    
    -- Update system user with auth_user_id (fix: explicitly qualify the column)
    UPDATE public.system_users 
    SET auth_user_id = v_auth_user_id, updated_at = now()
    WHERE public.system_users.id = p_system_user_id;
  END IF;
  
  -- Insert/update organization membership  
  INSERT INTO public.organization_members (
    organization_id, user_id, role, status, joined_at
  ) VALUES (
    p_organization_id, v_auth_user_id, p_role, 'active', now()
  ) ON CONFLICT (organization_id, user_id) 
  DO UPDATE SET 
    role = EXCLUDED.role,
    status = 'active',
    updated_at = now();
    
  -- Add user role if not exists
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_auth_user_id, 'system_user'::app_role)
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN json_build_object(
    'success', true,
    'auth_user_id', v_auth_user_id,
    'organization_id', p_organization_id,
    'role', p_role
  );
END;
$$;

-- Fix the existing Rohan user linkage issue
-- Link the existing auth user to the system user
UPDATE public.system_users 
SET auth_user_id = '001fe79e-04ec-4839-951e-523aecdf3765', updated_at = now()
WHERE email = 'rohan.thuse@gmail.com';

-- Ensure Rohan is properly linked to Shashank Care Services organization
INSERT INTO public.organization_members (
  organization_id, user_id, role, status, joined_at
) VALUES (
  '9ad7f8d6-32ba-4beb-b62c-5f3c35c8a2ed', 
  '001fe79e-04ec-4839-951e-523aecdf3765', 
  'owner', 
  'active', 
  now()
) ON CONFLICT (organization_id, user_id) 
DO UPDATE SET 
  role = 'owner',
  status = 'active',
  updated_at = now();

-- Create main branch for Shashank Care Services if it doesn't exist
INSERT INTO public.branches (
  name, organization_id, address, email, phone, 
  country, currency, regulatory, branch_type, status, created_by
) VALUES (
  'Main Branch - Shashank Care Services',
  '9ad7f8d6-32ba-4beb-b62c-5f3c35c8a2ed',
  'Mumbai, Maharashtra, India',
  'info@shashankcare.com',
  '+91-9876543210',
  'India',
  'INR',
  'CQC',
  'main',
  'active',
  'system'
) ON CONFLICT DO NOTHING;

-- Add missing columns to admin_branches table if they don't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'admin_branches' AND column_name = 'created_at') THEN
        ALTER TABLE public.admin_branches ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT now();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'admin_branches' AND column_name = 'updated_at') THEN
        ALTER TABLE public.admin_branches ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();
    END IF;
END $$;

-- Link Rohan as admin to the Shashank Care Services branch
INSERT INTO public.admin_branches (admin_id, branch_id, created_at, updated_at)
SELECT 
  '001fe79e-04ec-4839-951e-523aecdf3765',
  b.id,
  now(),
  now()
FROM public.branches b
WHERE b.organization_id = '9ad7f8d6-32ba-4beb-b62c-5f3c35c8a2ed'
ON CONFLICT (admin_id, branch_id) DO NOTHING;

-- Add proper user role for Rohan
INSERT INTO public.user_roles (user_id, role)
VALUES ('001fe79e-04ec-4839-951e-523aecdf3765', 'system_user'::app_role)
ON CONFLICT (user_id, role) DO NOTHING;

-- Update the create_auth_user_for_system_user function to fix the ambiguous reference
CREATE OR REPLACE FUNCTION public.create_auth_user_for_system_user(
  p_system_user_id UUID,
  p_password TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_auth_user_id UUID;
  v_system_user RECORD;
  v_password TEXT;
BEGIN
  -- Get system user details
  SELECT * INTO v_system_user FROM public.system_users WHERE id = p_system_user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'System user not found');
  END IF;
  
  -- Check if auth user already exists
  SELECT id INTO v_auth_user_id FROM auth.users WHERE email = v_system_user.email;
  
  IF v_auth_user_id IS NOT NULL THEN
    -- Update system user with existing auth_user_id (fix: explicitly qualify)
    UPDATE public.system_users 
    SET auth_user_id = v_auth_user_id, updated_at = now()
    WHERE public.system_users.id = p_system_user_id;
    
    RETURN json_build_object(
      'success', true,
      'auth_user_id', v_auth_user_id,
      'message', 'Linked to existing auth user'
    );
  END IF;
  
  -- Generate password if not provided
  v_password := COALESCE(p_password, 'temp_' || substr(md5(random()::text), 0, 8));
  
  -- Create new auth user
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
    crypt(v_password, gen_salt('bf')),
    now(), now(), now(), '', '', '', '', '', 0
  ) RETURNING id INTO v_auth_user_id;
  
  -- Update system user with auth_user_id (fix: explicitly qualify)
  UPDATE public.system_users 
  SET auth_user_id = v_auth_user_id, updated_at = now()
  WHERE public.system_users.id = p_system_user_id;
  
  RETURN json_build_object(
    'success', true,
    'auth_user_id', v_auth_user_id,
    'temporary_password', v_password
  );
END;
$$;
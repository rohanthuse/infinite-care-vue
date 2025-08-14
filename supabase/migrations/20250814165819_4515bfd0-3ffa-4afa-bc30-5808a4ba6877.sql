-- Fix immediate issue: Link rajj@gmail.com to Audi organization
INSERT INTO organization_members (
  user_id, 
  organization_id, 
  role, 
  status, 
  invited_at, 
  joined_at
) VALUES (
  '2ba3442d-b327-44f5-a6bd-062f9371b812',  -- rajj@gmail.com user ID
  '69da7623-6366-4ca2-b0fc-30e80858b469',  -- Audi organization ID  
  'admin',                                   -- Role
  'active',                                  -- Status
  now(),                                     -- Invited at
  now()                                      -- Joined at
) ON CONFLICT (user_id, organization_id) DO NOTHING;

-- Add auth_user_id column to system_users table
ALTER TABLE system_users ADD COLUMN IF NOT EXISTS auth_user_id uuid;

-- Create function to create auth user for system user
CREATE OR REPLACE FUNCTION create_auth_user_for_system_user(
  p_system_user_id uuid,
  p_email text,
  p_password text DEFAULT NULL
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  auth_user_id uuid;
  temp_password text;
  result json;
BEGIN
  -- Generate temporary password if none provided
  IF p_password IS NULL THEN
    temp_password := 'temp_' || substr(md5(random()::text), 1, 12);
  ELSE
    temp_password := p_password;
  END IF;

  -- Check if auth user already exists
  SELECT id INTO auth_user_id FROM auth.users WHERE email = p_email;
  
  IF auth_user_id IS NULL THEN
    -- Create new auth user
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
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      p_email,
      crypt(temp_password, gen_salt('bf')),
      now(),
      now(),
      now(),
      '',
      '',
      '',
      '',
      '',
      0
    ) RETURNING id INTO auth_user_id;
  END IF;

  -- Update system user with auth_user_id
  UPDATE system_users 
  SET auth_user_id = auth_user_id, updated_at = now()
  WHERE id = p_system_user_id;

  RETURN json_build_object(
    'success', true,
    'auth_user_id', auth_user_id,
    'temporary_password', temp_password,
    'system_user_id', p_system_user_id
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- Create function to sync system user with organization membership
CREATE OR REPLACE FUNCTION sync_system_user_to_organization(
  p_system_user_id uuid,
  p_organization_id uuid,
  p_role text DEFAULT 'member'
) RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  system_user_record RECORD;
  auth_user_id uuid;
  result json;
BEGIN
  -- Get system user info
  SELECT * INTO system_user_record 
  FROM system_users 
  WHERE id = p_system_user_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'System user not found');
  END IF;

  -- Get or create auth user
  IF system_user_record.auth_user_id IS NULL THEN
    -- Create auth user first
    SELECT (create_auth_user_for_system_user(p_system_user_id, system_user_record.email))::json INTO result;
    
    IF NOT (result->>'success')::boolean THEN
      RETURN result;
    END IF;
    
    auth_user_id := (result->>'auth_user_id')::uuid;
  ELSE
    auth_user_id := system_user_record.auth_user_id;
  END IF;

  -- Create organization membership
  INSERT INTO organization_members (
    user_id,
    organization_id,
    role,
    status,
    invited_at,
    joined_at
  ) VALUES (
    auth_user_id,
    p_organization_id,
    p_role,
    'active',
    now(),
    now()
  ) ON CONFLICT (user_id, organization_id) DO UPDATE SET
    role = EXCLUDED.role,
    status = 'active',
    updated_at = now();

  -- Also create/update system_user_organizations record
  INSERT INTO system_user_organizations (
    system_user_id,
    organization_id,
    role
  ) VALUES (
    p_system_user_id,
    p_organization_id,
    p_role
  ) ON CONFLICT (system_user_id, organization_id) DO UPDATE SET
    role = EXCLUDED.role;

  RETURN json_build_object(
    'success', true,
    'auth_user_id', auth_user_id,
    'organization_id', p_organization_id,
    'role', p_role
  );
  
EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;
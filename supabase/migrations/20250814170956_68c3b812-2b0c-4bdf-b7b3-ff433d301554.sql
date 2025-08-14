-- Create a test admin user for the Audi organization (final fix)
DO $$
DECLARE
  audi_org_id uuid;
  test_auth_user_id uuid;
BEGIN
  -- Get Audi organization ID
  SELECT id INTO audi_org_id FROM organizations WHERE slug = 'audi' LIMIT 1;
  
  IF audi_org_id IS NULL THEN
    RAISE EXCEPTION 'Audi organization not found';
  END IF;
  
  -- Create auth user directly for Audi admin
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
    'admin@audi.com',
    crypt('password123', gen_salt('bf')),
    now(),
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    0
  ) RETURNING id INTO test_auth_user_id;
  
  -- Add organization membership with admin role
  INSERT INTO organization_members (
    user_id,
    organization_id,
    role,
    status,
    invited_at,
    joined_at
  ) VALUES (
    test_auth_user_id,
    audi_org_id,
    'admin',
    'active',
    now(),
    now()
  ) ON CONFLICT DO NOTHING;
  
  -- Add user role
  INSERT INTO user_roles (user_id, role) 
  VALUES (test_auth_user_id, 'branch_admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  -- Create system user record for reference (with all required fields)
  INSERT INTO system_users (
    id,
    auth_user_id,
    email,
    encrypted_password,
    first_name,
    last_name,
    is_active
  ) VALUES (
    gen_random_uuid(),
    test_auth_user_id,
    'admin@audi.com',
    crypt('password123', gen_salt('bf')),
    'Audi',
    'Admin',
    true
  ) ON CONFLICT DO NOTHING;
  
  RAISE NOTICE 'Created test admin user for Audi: admin@audi.com / password123';
  
END $$;
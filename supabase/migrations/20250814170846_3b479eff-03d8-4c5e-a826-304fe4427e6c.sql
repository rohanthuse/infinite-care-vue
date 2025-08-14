-- Create a test admin user for the Audi organization
DO $$
DECLARE
  audi_org_id uuid;
  test_user_id uuid;
  test_auth_user_id uuid;
BEGIN
  -- Get Audi organization ID
  SELECT id INTO audi_org_id FROM organizations WHERE slug = 'audi' LIMIT 1;
  
  IF audi_org_id IS NULL THEN
    RAISE EXCEPTION 'Audi organization not found';
  END IF;
  
  -- Create system user for Audi admin
  INSERT INTO system_users (
    id,
    email,
    first_name,
    last_name,
    role,
    status
  ) VALUES (
    gen_random_uuid(),
    'admin@audi.com',
    'Audi',
    'Admin',
    'owner',
    'active'
  ) RETURNING id INTO test_user_id;
  
  -- Create auth user for login
  SELECT (create_auth_user_for_system_user(test_user_id, 'admin@audi.com', 'password123'))::json->>'auth_user_id' INTO test_auth_user_id;
  
  -- Add organization membership with admin role
  INSERT INTO organization_members (
    user_id,
    organization_id,
    role,
    status,
    invited_at,
    joined_at
  ) VALUES (
    test_auth_user_id::uuid,
    audi_org_id,
    'admin',
    'active',
    now(),
    now()
  );
  
  -- Add user role
  INSERT INTO user_roles (user_id, role) 
  VALUES (test_auth_user_id::uuid, 'branch_admin')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RAISE NOTICE 'Created test admin user for Audi: admin@audi.com / password123';
  
END $$;
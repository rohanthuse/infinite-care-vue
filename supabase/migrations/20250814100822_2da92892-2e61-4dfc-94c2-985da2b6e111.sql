-- Fix Purecare tenant setup by linking branches and creating test users

-- 1. Link existing branches to Purecare organization
UPDATE branches 
SET tenant_id = 'ef011224-994a-44d9-abad-2b258fa00d09'
WHERE name IN ('Test Branch 001', 'Med-Infinite - Milton Keynes')
AND tenant_id IS NULL;

-- 2. Create organization membership for existing admin user
INSERT INTO organization_members (
  organization_id,
  user_id,
  role,
  status,
  joined_at
) VALUES (
  'ef011224-994a-44d9-abad-2b258fa00d09',
  '5fc15f23-307e-46b4-b8d0-fd92666a6c29',
  'admin',
  'active',
  now()
) ON CONFLICT (organization_id, user_id) DO NOTHING;

-- 3. Create admin_branches relationship for branch access
INSERT INTO admin_branches (
  admin_id,
  branch_id
) 
SELECT 
  '5fc15f23-307e-46b4-b8d0-fd92666a6c29' as admin_id,
  b.id as branch_id
FROM branches b 
WHERE b.tenant_id = 'ef011224-994a-44d9-abad-2b258fa00d09'
AND NOT EXISTS (
  SELECT 1 FROM admin_branches ab 
  WHERE ab.admin_id = '5fc15f23-307e-46b4-b8d0-fd92666a6c29' 
  AND ab.branch_id = b.id
);

-- 4. Ensure proper user roles exist
INSERT INTO user_roles (user_id, role) 
VALUES ('5fc15f23-307e-46b4-b8d0-fd92666a6c29', 'branch_admin')
ON CONFLICT (user_id, role) DO NOTHING;
-- Convert maheshp@gmail.com from super_admin to regular admin role
-- This makes maheshp's role identical to vishalg@gmail.com's role structure

-- Step 1: Update system_user_organizations table
-- Change maheshp's role from super_admin to admin
UPDATE system_user_organizations
SET role = 'admin'
WHERE system_user_id = '615b081b-e7aa-423b-8fb5-f78842acf986'
  AND organization_id = 'a0e92c72-ab4c-476e-8c1a-c89b4038f2a4';

-- Step 2: Insert/Update organization_members table
-- Add maheshp with admin role and active status
INSERT INTO organization_members (
  user_id,
  organization_id,
  role,
  status,
  joined_at
) VALUES (
  '615efac0-38b4-4f58-98b9-765cd065d47c',  -- maheshp's auth user id
  'a0e92c72-ab4c-476e-8c1a-c89b4038f2a4',  -- baner org id
  'admin',
  'active',
  now()
)
ON CONFLICT (user_id, organization_id) 
DO UPDATE SET 
  role = 'admin',
  status = 'active';
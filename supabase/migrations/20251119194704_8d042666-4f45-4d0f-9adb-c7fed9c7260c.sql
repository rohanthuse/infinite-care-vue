-- Fix VTP Organisation Members: Remove duplicate and correct role

-- Step 1: Delete the duplicate/incorrect organization_members record
DELETE FROM organization_members 
WHERE id = '656e3388-9729-4bc7-84af-e40d55efaca8';

-- Step 2: Update System Portal user role from 'member' to 'super_admin'
UPDATE system_user_organizations 
SET role = 'super_admin' 
WHERE id = '38f7ec60-b30c-4f07-86ca-c398effd8273';

-- Step 3: Add comment for documentation
COMMENT ON TABLE system_user_organizations IS 'System Portal users should always have super_admin role when assigned to organizations';
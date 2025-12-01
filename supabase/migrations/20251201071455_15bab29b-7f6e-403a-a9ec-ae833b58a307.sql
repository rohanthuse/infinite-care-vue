-- Fix user_roles entry for maheshp@gmail.com
-- Change from super_admin to branch_admin to match their organization role
UPDATE user_roles 
SET role = 'branch_admin'
WHERE user_id = '615efac0-38b4-4f58-98b9-765cd065d47c'
AND role = 'super_admin';

-- Verify the change
COMMENT ON TABLE user_roles IS 'Updated maheshp@gmail.com role from super_admin to branch_admin to fix dashboard routing';
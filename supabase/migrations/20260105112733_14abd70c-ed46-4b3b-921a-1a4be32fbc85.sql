-- Fix existing branch admins in organization_members to use 'branch_admin' role instead of 'admin'
-- This ensures they only see their assigned branches, not all branches

UPDATE organization_members 
SET role = 'branch_admin' 
WHERE user_id IN (
  SELECT DISTINCT admin_id FROM admin_branches
) AND role = 'admin';
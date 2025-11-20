-- Clean up incorrect 'carer' and 'branch_admin' roles from organization members
-- These were incorrectly auto-created by the buggy database function

-- First, let's see what will be deleted (for logging purposes)
DO $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Remove 'carer' roles from user_roles for organization members
  DELETE FROM user_roles
  WHERE (user_id, role) IN (
    SELECT ur.user_id, ur.role
    FROM user_roles ur
    JOIN organization_members om ON ur.user_id = om.user_id
    WHERE om.status = 'active'
    AND ur.role = 'carer'
    -- Only delete if they're NOT actually a staff member (real carer)
    AND NOT EXISTS (
      SELECT 1 FROM staff s 
      WHERE s.auth_user_id = ur.user_id 
      AND s.status = 'Active'
    )
  );
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % incorrect carer roles from organization members', deleted_count;

  -- Also remove 'branch_admin' roles for org members if any exist
  DELETE FROM user_roles
  WHERE (user_id, role) IN (
    SELECT ur.user_id, ur.role
    FROM user_roles ur
    JOIN organization_members om ON ur.user_id = om.user_id
    WHERE om.status = 'active'
    AND ur.role = 'branch_admin'
    -- Only delete if they're NOT actually a branch admin
    AND NOT EXISTS (
      SELECT 1 FROM admin_branches ab 
      WHERE ab.admin_id = ur.user_id
    )
  );
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Deleted % incorrect branch_admin roles from organization members', deleted_count;
END $$;

-- Add a comment to document this cleanup
COMMENT ON TABLE user_roles IS 
  'System roles table. Organization members should NOT have system roles (carer, branch_admin, client) unless they also have corresponding records in staff/admin_branches/clients tables. Cleaned up incorrect auto-created roles.';

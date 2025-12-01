-- Fix role inconsistency for sanketc@gmail.com
-- User is an organization admin for Karve, not a system super_admin
-- This ensures correct redirect to /karve/dashboard after login
UPDATE user_roles 
SET role = 'branch_admin'
WHERE user_id = 'b9bfe39d-9c1f-4ea2-8524-119d3524acac';
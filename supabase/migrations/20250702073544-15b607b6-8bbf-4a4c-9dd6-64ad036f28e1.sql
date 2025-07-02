
-- Diagnostic and Fix Migration for Client-Admin Messaging

-- First, let's check the current state of data relationships
SELECT 'Current admin_branches data:' as info;
SELECT 
    ab.admin_id,
    ab.branch_id,
    p.email,
    p.first_name,
    p.last_name,
    b.name as branch_name
FROM admin_branches ab
LEFT JOIN profiles p ON ab.admin_id = p.id
LEFT JOIN branches b ON ab.branch_id = b.id
ORDER BY b.name, p.email;

-- Check for orphaned admin_branches records (admin_id not in profiles)
SELECT 'Orphaned admin_branches records:' as info;
SELECT ab.*, 'Missing profile' as issue
FROM admin_branches ab
LEFT JOIN profiles p ON ab.admin_id = p.id
WHERE p.id IS NULL;

-- Check for branch admins that might be missing from admin_branches
SELECT 'Users with admin roles not in admin_branches:' as info;
SELECT 
    p.id,
    p.email,
    p.first_name,
    p.last_name,
    ur.role,
    'Missing admin_branches entry' as issue
FROM profiles p
JOIN user_roles ur ON p.id = ur.user_id
WHERE ur.role IN ('super_admin', 'branch_admin')
  AND p.id NOT IN (SELECT admin_id FROM admin_branches);

-- Fix missing admin_branches entries for branch_admin users
-- This will create entries for branch admins who don't have admin_branches records
INSERT INTO admin_branches (admin_id, branch_id)
SELECT DISTINCT
    p.id as admin_id,
    b.id as branch_id
FROM profiles p
JOIN user_roles ur ON p.id = ur.user_id
CROSS JOIN branches b  -- Assign to all branches for now, can be refined later
WHERE ur.role = 'branch_admin'
  AND p.id NOT IN (SELECT admin_id FROM admin_branches)
  AND EXISTS (SELECT 1 FROM branches WHERE id = b.id);

-- For super_admin users, ensure they have access to all branches
INSERT INTO admin_branches (admin_id, branch_id)
SELECT DISTINCT
    p.id as admin_id,
    b.id as branch_id
FROM profiles p
JOIN user_roles ur ON p.id = ur.user_id
CROSS JOIN branches b
WHERE ur.role = 'super_admin'
  AND NOT EXISTS (
    SELECT 1 FROM admin_branches ab 
    WHERE ab.admin_id = p.id AND ab.branch_id = b.id
  );

-- Verify the fix by showing updated admin_branches data
SELECT 'Updated admin_branches data:' as info;
SELECT 
    ab.admin_id,
    ab.branch_id,
    p.email,
    p.first_name,
    p.last_name,
    ur.role,
    b.name as branch_name
FROM admin_branches ab
LEFT JOIN profiles p ON ab.admin_id = p.id
LEFT JOIN user_roles ur ON p.id = ur.user_id
LEFT JOIN branches b ON ab.branch_id = b.id
ORDER BY b.name, p.email;

-- Update RLS policies to ensure clients can see their branch admins
DROP POLICY IF EXISTS "Clients can view branch admins for messaging" ON admin_branches;
CREATE POLICY "Clients can view branch admins for messaging" 
  ON admin_branches 
  FOR SELECT 
  TO authenticated
  USING (
    -- Allow if user is an admin (existing policy)
    has_role(auth.uid(), 'super_admin') OR has_role(auth.uid(), 'branch_admin')
    OR
    -- Allow clients to see admins from their branch
    EXISTS (
      SELECT 1 FROM clients c 
      WHERE c.email = (auth.jwt() ->> 'email') 
      AND c.branch_id = admin_branches.branch_id
    )
  );

-- Ensure profiles can be read by clients for messaging
DROP POLICY IF EXISTS "Clients can view admin profiles for messaging" ON profiles;
CREATE POLICY "Clients can view admin profiles for messaging"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (
    -- Existing policies for users viewing their own profile and admins viewing all
    auth.uid() = id OR 
    has_role(auth.uid(), 'super_admin') OR 
    has_role(auth.uid(), 'branch_admin') OR
    -- Allow clients to view profiles of admins from their branch
    EXISTS (
      SELECT 1 FROM admin_branches ab
      JOIN clients c ON c.branch_id = ab.branch_id
      WHERE ab.admin_id = profiles.id 
      AND c.email = (auth.jwt() ->> 'email')
    )
  );

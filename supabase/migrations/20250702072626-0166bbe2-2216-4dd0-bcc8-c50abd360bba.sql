
-- First, let's check the current data state to understand what we're working with

-- 1. Check all clients and their branch assignments
SELECT 
    c.id,
    c.first_name,
    c.last_name,
    c.email,
    c.branch_id,
    b.name as branch_name
FROM clients c
LEFT JOIN branches b ON c.branch_id = b.id
ORDER BY c.branch_id, c.first_name;

-- 2. Check all branch admins and their roles
SELECT 
    p.id,
    p.first_name,
    p.last_name,
    p.email,
    ur.role
FROM profiles p
JOIN user_roles ur ON p.id = ur.user_id
WHERE ur.role IN ('super_admin', 'branch_admin')
ORDER BY ur.role, p.first_name;

-- 3. Check current admin-branch associations
SELECT 
    ab.admin_id,
    ab.branch_id,
    p.first_name,
    p.last_name,
    p.email,
    b.name as branch_name
FROM admin_branches ab
LEFT JOIN profiles p ON ab.admin_id = p.id
LEFT JOIN branches b ON ab.branch_id = b.id
ORDER BY b.name, p.first_name;

-- 4. Find branches that have clients but no assigned admins
SELECT 
    b.id as branch_id,
    b.name as branch_name,
    COUNT(c.id) as client_count,
    COUNT(ab.admin_id) as admin_count
FROM branches b
LEFT JOIN clients c ON b.id = c.branch_id
LEFT JOIN admin_branches ab ON b.id = ab.branch_id
GROUP BY b.id, b.name
HAVING COUNT(c.id) > 0 AND COUNT(ab.admin_id) = 0
ORDER BY b.name;

-- 5. Create admin-branch associations for branches that have clients but no admins
-- We'll assign the first available branch_admin to each branch that needs one
INSERT INTO admin_branches (admin_id, branch_id)
SELECT DISTINCT
    (SELECT p.id 
     FROM profiles p 
     JOIN user_roles ur ON p.id = ur.user_id 
     WHERE ur.role = 'branch_admin' 
     LIMIT 1) as admin_id,
    b.id as branch_id
FROM branches b
WHERE EXISTS (SELECT 1 FROM clients c WHERE c.branch_id = b.id)
  AND NOT EXISTS (SELECT 1 FROM admin_branches ab WHERE ab.branch_id = b.id)
  AND EXISTS (SELECT 1 FROM profiles p JOIN user_roles ur ON p.id = ur.user_id WHERE ur.role = 'branch_admin');

-- 6. If no branch_admin exists, let's create one by promoting a super_admin or creating associations with super_admin
INSERT INTO admin_branches (admin_id, branch_id)
SELECT DISTINCT
    (SELECT p.id 
     FROM profiles p 
     JOIN user_roles ur ON p.id = ur.user_id 
     WHERE ur.role = 'super_admin' 
     LIMIT 1) as admin_id,
    b.id as branch_id
FROM branches b
WHERE EXISTS (SELECT 1 FROM clients c WHERE c.branch_id = b.id)
  AND NOT EXISTS (SELECT 1 FROM admin_branches ab WHERE ab.branch_id = b.id)
  AND NOT EXISTS (SELECT 1 FROM profiles p JOIN user_roles ur ON p.id = ur.user_id WHERE ur.role = 'branch_admin')
  AND EXISTS (SELECT 1 FROM profiles p JOIN user_roles ur ON p.id = ur.user_id WHERE ur.role = 'super_admin');

-- 7. Final verification - show the updated admin-branch associations
SELECT 
    ab.admin_id,
    ab.branch_id,
    p.first_name || ' ' || p.last_name as admin_name,
    p.email as admin_email,
    ur.role as admin_role,
    b.name as branch_name,
    COUNT(c.id) as clients_in_branch
FROM admin_branches ab
LEFT JOIN profiles p ON ab.admin_id = p.id
LEFT JOIN user_roles ur ON p.id = ur.user_id
LEFT JOIN branches b ON ab.branch_id = b.id
LEFT JOIN clients c ON b.id = c.branch_id
GROUP BY ab.admin_id, ab.branch_id, p.first_name, p.last_name, p.email, ur.role, b.name
ORDER BY b.name, p.first_name;

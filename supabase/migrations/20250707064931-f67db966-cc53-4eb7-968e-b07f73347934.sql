-- Phase 1: Fix missing user role for stuck user
INSERT INTO public.user_roles (user_id, role) 
VALUES ('6e925ae0-e72b-4fa7-a86a-acb97bae0605', 'branch_admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Find and fix any other users in auth.users who don't have roles assigned
-- First, let's see what we have
WITH missing_roles AS (
  SELECT 
    au.id as user_id,
    au.email,
    CASE 
      WHEN EXISTS (SELECT 1 FROM admin_branches ab WHERE ab.admin_id = au.id) THEN 'branch_admin'
      WHEN EXISTS (SELECT 1 FROM staff s WHERE s.id = au.id) THEN 'carer'
      WHEN EXISTS (SELECT 1 FROM clients c WHERE c.email = au.email) THEN 'client'
      ELSE NULL
    END as suggested_role
  FROM auth.users au
  LEFT JOIN user_roles ur ON au.id = ur.user_id
  WHERE ur.user_id IS NULL
    AND au.email IS NOT NULL
)
INSERT INTO public.user_roles (user_id, role)
SELECT 
  user_id, 
  suggested_role::app_role
FROM missing_roles 
WHERE suggested_role IS NOT NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Add a function to check user role assignment health
CREATE OR REPLACE FUNCTION public.check_user_role_health()
RETURNS TABLE(
  user_id UUID,
  email TEXT,
  has_auth BOOLEAN,
  has_role BOOLEAN,
  suggested_role TEXT,
  issue_type TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id as user_id,
    au.email,
    TRUE as has_auth,
    (ur.user_id IS NOT NULL) as has_role,
    CASE 
      WHEN EXISTS (SELECT 1 FROM admin_branches ab WHERE ab.admin_id = au.id) THEN 'branch_admin'
      WHEN EXISTS (SELECT 1 FROM staff s WHERE s.id = au.id) THEN 'carer'
      WHEN EXISTS (SELECT 1 FROM clients c WHERE c.email = au.email) THEN 'client'
      ELSE 'unknown'
    END as suggested_role,
    CASE 
      WHEN ur.user_id IS NULL THEN 'missing_role'
      ELSE 'healthy'
    END as issue_type
  FROM auth.users au
  LEFT JOIN user_roles ur ON au.id = ur.user_id
  WHERE au.email IS NOT NULL
  ORDER BY au.created_at DESC;
END;
$$;
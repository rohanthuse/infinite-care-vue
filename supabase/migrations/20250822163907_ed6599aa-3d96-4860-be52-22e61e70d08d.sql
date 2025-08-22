-- Fix data integrity for super admin user routing
-- Step 1: Update system_users to have correct auth_user_id
UPDATE public.system_users 
SET auth_user_id = (
  SELECT au.id 
  FROM auth.users au 
  WHERE au.email = system_users.email
), updated_at = now()
WHERE auth_user_id IS NULL OR auth_user_id != (
  SELECT au.id 
  FROM auth.users au 
  WHERE au.email = system_users.email
);

-- Step 2: Ensure organization_members records exist for system users with organization access
INSERT INTO public.organization_members (
  organization_id, user_id, role, status, joined_at
)
SELECT DISTINCT
  suo.organization_id,
  su.auth_user_id,
  CASE 
    WHEN suo.role = 'super_admin' THEN 'owner'
    WHEN suo.role = 'admin' THEN 'admin' 
    ELSE 'member'
  END,
  'active',
  COALESCE(su.created_at, now())
FROM public.system_user_organizations suo
JOIN public.system_users su ON suo.system_user_id = su.id
WHERE su.auth_user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = suo.organization_id 
    AND om.user_id = su.auth_user_id
  );

-- Step 3: Ensure user_roles are properly set for system users
INSERT INTO public.user_roles (user_id, role)
SELECT DISTINCT
  su.auth_user_id,
  CASE 
    WHEN suo.role = 'super_admin' THEN 'super_admin'
    WHEN suo.role = 'admin' THEN 'branch_admin'
    ELSE 'carer'
  END::app_role
FROM public.system_user_organizations suo
JOIN public.system_users su ON suo.system_user_id = su.id
WHERE su.auth_user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = su.auth_user_id 
    AND ur.role = CASE 
      WHEN suo.role = 'super_admin' THEN 'super_admin'
      WHEN suo.role = 'admin' THEN 'branch_admin'
      ELSE 'carer'
    END::app_role
  );
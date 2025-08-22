-- Fix remaining data integrity issues - handle existing user_roles
-- Update existing user_roles where system users have organization access
UPDATE public.user_roles ur
SET role = 'super_admin'::app_role
FROM public.system_user_organizations suo
JOIN public.system_users su ON suo.system_user_id = su.id
WHERE ur.user_id = su.auth_user_id 
  AND suo.role = 'super_admin'
  AND ur.role != 'super_admin'::app_role;

-- Insert missing user_roles for system users, handle conflicts
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
  )
ON CONFLICT (user_id, role) DO NOTHING;
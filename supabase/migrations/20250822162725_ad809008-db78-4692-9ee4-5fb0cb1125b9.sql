-- Fix the organization members creation for existing system users
-- Use system user created_at instead of the non-existent suo.created_at

INSERT INTO public.organization_members (
  organization_id, user_id, role, status, joined_at
)
SELECT DISTINCT
  suo.organization_id,
  su.auth_user_id,
  suo.role,
  'active',
  su.created_at  -- Use system user created_at instead
FROM public.system_user_organizations suo
JOIN public.system_users su ON suo.system_user_id = su.id
WHERE su.auth_user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = suo.organization_id 
    AND om.user_id = su.auth_user_id
  );
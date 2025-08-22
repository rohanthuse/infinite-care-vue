-- Fix the specific auth_user_id mismatch for aderinsola@gmail.com
-- The previous migration didn't catch this case
UPDATE public.system_users 
SET auth_user_id = 'a6ecd2ae-66ac-48de-804f-627b16268d06', 
    updated_at = now()
WHERE email = 'aderinsola@gmail.com' 
  AND auth_user_id != 'a6ecd2ae-66ac-48de-804f-627b16268d06';

-- Since this user has super_admin role but no organization membership,
-- we need to find the appropriate organization to link them to
-- Let's get the first available organization for this super admin
INSERT INTO public.organization_members (
  organization_id, user_id, role, status, joined_at
)
SELECT 
  o.id,
  'a6ecd2ae-66ac-48de-804f-627b16268d06'::uuid,
  'owner',
  'active',
  now()
FROM public.organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM public.organization_members om
  WHERE om.user_id = 'a6ecd2ae-66ac-48de-804f-627b16268d06'
)
LIMIT 1;
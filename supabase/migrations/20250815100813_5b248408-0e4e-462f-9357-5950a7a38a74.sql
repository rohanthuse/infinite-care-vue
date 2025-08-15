-- Fix database consistency issues for super admin users

-- 1. Fix rajj@gmail.com membership status from inactive to active
UPDATE organization_members 
SET status = 'active', updated_at = now()
WHERE user_id = '2ba3442d-b327-44f5-a6bd-062f9371b812' 
AND organization_id = (SELECT id FROM organizations WHERE slug = 'audi');

-- 2. Create missing system_users records for super admins who don't have them
INSERT INTO system_users (id, email, first_name, last_name, is_active, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  au.email,
  COALESCE(au.raw_user_meta_data->>'first_name', split_part(au.email, '@', 1)),
  COALESCE(au.raw_user_meta_data->>'last_name', ''),
  true,
  now(),
  now()
FROM auth.users au
JOIN user_roles ur ON au.id = ur.user_id
LEFT JOIN system_users su ON au.email = su.email
WHERE ur.role = 'super_admin' 
AND su.id IS NULL
ON CONFLICT (email) DO NOTHING;

-- 3. Create missing organization memberships for super admins without organizations
-- (saurabhghugeking@gmail.com needs an organization or should be system-only)

-- 4. Ensure all super admins have consistent user_roles
INSERT INTO user_roles (user_id, role)
SELECT au.id, 'super_admin'::app_role
FROM auth.users au
JOIN organization_members om ON au.id = om.user_id
LEFT JOIN user_roles ur ON au.id = ur.user_id AND ur.role = 'super_admin'
WHERE ur.user_id IS NULL
ON CONFLICT (user_id, role) DO NOTHING;
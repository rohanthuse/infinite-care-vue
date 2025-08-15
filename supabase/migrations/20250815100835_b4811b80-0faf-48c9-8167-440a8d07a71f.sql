-- Fix database consistency issues for super admin users (corrected version)

-- 1. Fix rajj@gmail.com membership status from inactive to active
UPDATE organization_members 
SET status = 'active', updated_at = now()
WHERE user_id = '2ba3442d-b327-44f5-a6bd-062f9371b812' 
AND organization_id = (SELECT id FROM organizations WHERE slug = 'audi');

-- 2. Create missing system_users records for super admins who don't have them
-- Note: Setting encrypted_password to empty string as it's required, but these users already have auth.users records
INSERT INTO system_users (id, email, first_name, last_name, is_active, encrypted_password, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  au.email,
  COALESCE(au.raw_user_meta_data->>'first_name', split_part(au.email, '@', 1)),
  COALESCE(au.raw_user_meta_data->>'last_name', ''),
  true,
  '', -- Empty string for encrypted_password since they use auth.users
  now(),
  now()
FROM auth.users au
JOIN user_roles ur ON au.id = ur.user_id
LEFT JOIN system_users su ON au.email = su.email
WHERE ur.role = 'super_admin' 
AND su.id IS NULL
ON CONFLICT (email) DO NOTHING;
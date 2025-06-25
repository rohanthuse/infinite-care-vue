
-- First, let's check the current state and fix any missing entries
-- Check if the existing admin has the proper role
SELECT u.email, ur.role 
FROM auth.users u 
LEFT JOIN public.user_roles ur ON u.id = ur.user_id 
WHERE u.email = 'shariwaaworks@gmail.com';

-- If the role is missing, add it
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'branch_admin'::app_role
FROM auth.users u
WHERE u.email = 'shariwaaworks@gmail.com'
AND NOT EXISTS (
  SELECT 1 FROM public.user_roles ur 
  WHERE ur.user_id = u.id AND ur.role = 'branch_admin'
);

-- Check if profiles exist for all admins
SELECT u.email, p.first_name, p.last_name
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE ur.role = 'branch_admin';

-- Create missing profiles for admins if needed
INSERT INTO public.profiles (id, email, first_name, last_name)
SELECT u.id, u.email, 
       u.raw_user_meta_data ->> 'first_name', 
       u.raw_user_meta_data ->> 'last_name'
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
LEFT JOIN public.user_roles ur ON u.id = ur.user_id
WHERE ur.role = 'branch_admin' AND p.id IS NULL;

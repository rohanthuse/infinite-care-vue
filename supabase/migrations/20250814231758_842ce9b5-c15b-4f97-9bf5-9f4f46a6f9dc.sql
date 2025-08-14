-- Update aryan@gmail.com's role from member to admin in Wipro organization
UPDATE public.organization_members 
SET role = 'admin', updated_at = now()
WHERE user_id = (
  SELECT id FROM auth.users WHERE email = 'aryan@gmail.com'
) 
AND organization_id = (
  SELECT id FROM public.organizations WHERE slug = 'wipro'
);
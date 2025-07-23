
-- Manually link the client to their auth user to fix the RLS policy issue
UPDATE public.clients 
SET auth_user_id = '42087c0d-30b7-4f54-bae6-a0b87ebf5983'::uuid
WHERE id = 'd844f7b5-087c-4594-ace8-9bfb0a03e66e'::uuid;

-- Verify the link was created successfully
SELECT 
  c.id as client_id,
  c.email,
  c.first_name,
  c.last_name,
  c.auth_user_id,
  au.email as auth_email
FROM public.clients c
LEFT JOIN auth.users au ON c.auth_user_id = au.id
WHERE c.id = 'd844f7b5-087c-4594-ace8-9bfb0a03e66e'::uuid;

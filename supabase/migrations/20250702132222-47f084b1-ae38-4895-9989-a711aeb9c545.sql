
-- Phase 1: Fix Missing Client Role for D. Wilson and other clients
-- Add missing 'client' role for D. Wilson's auth user ID
INSERT INTO public.user_roles (user_id, role) 
VALUES ('c850ef16-52fc-4dea-a180-267ffbf57910', 'client')
ON CONFLICT (user_id, role) DO NOTHING;

-- Data consistency check: Add client roles for all clients who have auth accounts but missing roles
INSERT INTO public.user_roles (user_id, role)
SELECT au.id, 'client'::app_role
FROM auth.users au
JOIN public.clients c ON au.email = c.email
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur 
  WHERE ur.user_id = au.id AND ur.role = 'client'
)
ON CONFLICT (user_id, role) DO NOTHING;

-- Verify the fix worked
SELECT COUNT(*) as clients_with_roles FROM public.user_roles WHERE role = 'client';

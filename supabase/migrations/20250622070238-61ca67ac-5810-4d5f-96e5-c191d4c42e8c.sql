
-- Phase 1: Safe Database Fixes
-- First, let's see the current state of staff records and their auth status
SELECT 
    s.id as staff_id,
    s.email as staff_email,
    s.first_name,
    s.last_name,
    au.id as auth_user_id,
    ur.role as assigned_role,
    CASE 
        WHEN au.id IS NOT NULL AND s.id = au.id THEN 'Correctly linked'
        WHEN au.id IS NOT NULL AND s.id != au.id THEN 'ID mismatch - needs update'
        ELSE 'No auth user found'
    END as status
FROM public.staff s
LEFT JOIN auth.users au ON s.email = au.email
LEFT JOIN public.user_roles ur ON s.id = ur.user_id AND ur.role = 'carer'
ORDER BY s.email;

-- Update staff records to use correct auth user IDs (only where auth user exists)
UPDATE public.staff 
SET id = au.id,
    updated_at = now()
FROM auth.users au
WHERE staff.email = au.email 
AND staff.id != au.id
AND au.id IS NOT NULL;

-- Assign carer roles to all staff who have valid auth user IDs
INSERT INTO public.user_roles (user_id, role)
SELECT DISTINCT s.id, 'carer'::app_role
FROM public.staff s
INNER JOIN auth.users au ON s.id = au.id  -- Only staff with valid auth users
LEFT JOIN public.user_roles ur ON s.id = ur.user_id AND ur.role = 'carer'
WHERE ur.user_id IS NULL
ON CONFLICT (user_id, role) DO NOTHING;

-- Final verification - show the corrected state
SELECT 
    s.id as staff_id,
    s.email,
    s.first_name,
    s.last_name,
    ur.role as assigned_role,
    CASE 
        WHEN au.id IS NOT NULL THEN 'Has auth account'
        ELSE 'No auth account'
    END as auth_status,
    CASE 
        WHEN au.id = s.id THEN 'IDs match'
        WHEN au.id IS NOT NULL THEN 'IDs mismatch'
        ELSE 'No auth user'
    END as id_status
FROM public.staff s
LEFT JOIN auth.users au ON s.email = au.email
LEFT JOIN public.user_roles ur ON s.id = ur.user_id AND ur.role = 'carer'
ORDER BY s.email;

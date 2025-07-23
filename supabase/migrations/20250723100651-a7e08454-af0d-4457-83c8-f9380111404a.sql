
-- Fix auth schema issues and update carer authentication to use auth_user_id
-- Step 1: Fix NULL values in auth.users table that cause authentication failures
UPDATE auth.users 
SET 
  email_change_token_new = COALESCE(email_change_token_new, ''),
  email_change_token_current = COALESCE(email_change_token_current, ''),
  email_change = COALESCE(email_change, ''),
  email_change_confirm_status = COALESCE(email_change_confirm_status, 0),
  updated_at = now()
WHERE 
  email_change_token_new IS NULL 
  OR email_change_token_current IS NULL 
  OR email_change IS NULL 
  OR email_change_confirm_status IS NULL;

-- Step 2: Ensure all existing staff records have proper auth_user_id links
-- This will link staff records to their corresponding auth users
UPDATE public.staff 
SET auth_user_id = au.id
FROM auth.users au
WHERE staff.email = au.email 
AND staff.auth_user_id IS NULL
AND au.id IS NOT NULL;

-- Step 3: Create a function to get staff profile by auth_user_id instead of staff.id
CREATE OR REPLACE FUNCTION public.get_staff_profile_by_auth_user_id(auth_user_id_param uuid)
RETURNS TABLE(
    id uuid, 
    auth_user_id uuid,
    first_name text, 
    last_name text, 
    email text, 
    phone text, 
    address text, 
    status text, 
    experience text, 
    specialization text, 
    availability text, 
    date_of_birth date, 
    hire_date date, 
    branch_id uuid,
    first_login_completed boolean,
    profile_completed boolean
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        s.id,
        s.auth_user_id,
        s.first_name,
        s.last_name,
        s.email,
        s.phone,
        s.address,
        s.status,
        s.experience,
        s.specialization,
        s.availability,
        s.date_of_birth,
        s.hire_date,
        s.branch_id,
        s.first_login_completed,
        s.profile_completed
    FROM public.staff s
    WHERE s.auth_user_id = auth_user_id_param;
END;
$$;

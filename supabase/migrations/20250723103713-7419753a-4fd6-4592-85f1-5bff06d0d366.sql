-- Create the missing check_carer_auth_health function
CREATE OR REPLACE FUNCTION public.check_carer_auth_health()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  null_auth_count INTEGER;
  unlinked_staff_count INTEGER;
  result json;
BEGIN
  -- Count auth users with NULL values
  SELECT COUNT(*) INTO null_auth_count
  FROM auth.users 
  WHERE email_change_token_new IS NULL 
     OR email_change_token_current IS NULL 
     OR email_change IS NULL 
     OR email_change_confirm_status IS NULL;
  
  -- Count staff without auth_user_id links
  SELECT COUNT(*) INTO unlinked_staff_count
  FROM staff s
  WHERE s.auth_user_id IS NULL 
  AND EXISTS (SELECT 1 FROM auth.users au WHERE au.email = s.email);
  
  RETURN json_build_object(
    'auth_null_values', null_auth_count,
    'unlinked_staff', unlinked_staff_count,
    'status', CASE 
      WHEN null_auth_count = 0 AND unlinked_staff_count = 0 THEN 'healthy' 
      ELSE 'needs_attention' 
    END,
    'checked_at', now()
  );
END;
$$;
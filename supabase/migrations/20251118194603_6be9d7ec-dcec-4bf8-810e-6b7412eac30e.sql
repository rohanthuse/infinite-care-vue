-- =====================================================
-- FIX AUTH SCHEMA: Repair NULL values in auth.users
-- =====================================================

-- Function to fix NULL values in auth.users table
CREATE OR REPLACE FUNCTION public.fix_auth_users_schema()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  affected_rows INTEGER := 0;
  v_result json;
BEGIN
  -- Log the operation
  RAISE NOTICE 'Starting auth.users schema fix...';
  
  -- Update NULL values to proper defaults in auth.users
  UPDATE auth.users 
  SET 
    email_change_token_new = COALESCE(email_change_token_new, ''),
    email_change_token_current = COALESCE(email_change_token_current, ''),
    email_change = COALESCE(email_change, ''),
    email_change_confirm_status = COALESCE(email_change_confirm_status, 0)
  WHERE 
    email_change_token_new IS NULL 
    OR email_change_token_current IS NULL 
    OR email_change IS NULL
    OR email_change_confirm_status IS NULL;
  
  GET DIAGNOSTICS affected_rows = ROW_COUNT;
  
  RAISE NOTICE 'Auth schema fix completed. Rows affected: %', affected_rows;
  
  v_result := json_build_object(
    'success', true,
    'message', 'Auth users schema fixed successfully',
    'affected_rows', affected_rows,
    'timestamp', now()
  );
  
  RETURN v_result;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error fixing auth schema: %', SQLERRM;
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'timestamp', now()
    );
END;
$$;

COMMENT ON FUNCTION public.fix_auth_users_schema() IS 
'Fixes NULL values in auth.users table that cause login failures. Safe to run multiple times.';

-- =====================================================
-- Execute the fix immediately
-- =====================================================
SELECT public.fix_auth_users_schema();

-- =====================================================
-- CREATE HEALTH CHECK FUNCTION
-- =====================================================

CREATE OR REPLACE FUNCTION public.check_auth_health()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  null_count INTEGER;
  total_users INTEGER;
  affected_emails text[];
BEGIN
  -- Count users with NULL values
  SELECT COUNT(*) INTO null_count
  FROM auth.users
  WHERE email_change_token_new IS NULL 
     OR email_change_token_current IS NULL 
     OR email_change IS NULL
     OR email_change_confirm_status IS NULL;
  
  -- Get total user count
  SELECT COUNT(*) INTO total_users
  FROM auth.users;
  
  -- Get affected user emails (limit to 10 for safety)
  SELECT array_agg(email) INTO affected_emails
  FROM (
    SELECT email 
    FROM auth.users
    WHERE email_change_token_new IS NULL 
       OR email_change_token_current IS NULL 
       OR email_change IS NULL
       OR email_change_confirm_status IS NULL
    LIMIT 10
  ) subquery;
  
  RETURN json_build_object(
    'healthy', null_count = 0,
    'total_users', total_users,
    'affected_users', null_count,
    'affected_emails', COALESCE(affected_emails, ARRAY[]::text[]),
    'timestamp', now()
  );
END;
$$;

COMMENT ON FUNCTION public.check_auth_health() IS 
'Checks for NULL values in auth.users that could cause login failures';

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.fix_auth_users_schema() TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_auth_health() TO authenticated;
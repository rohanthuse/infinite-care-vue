-- Auto-confirm branch admin accounts that were created through the admin panel
-- This function will be used to confirm existing unconfirmed branch admin accounts

CREATE OR REPLACE FUNCTION auto_confirm_branch_admins()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_record RECORD;
  confirmed_count INTEGER := 0;
  error_count INTEGER := 0;
  results JSONB := '[]'::JSONB;
BEGIN
  -- Find all unconfirmed users who have branch_admin role
  FOR admin_record IN 
    SELECT au.id, au.email
    FROM auth.users au
    JOIN user_roles ur ON au.id = ur.user_id
    WHERE ur.role = 'branch_admin'
    AND au.email_confirmed_at IS NULL
  LOOP
    BEGIN
      -- Auto-confirm the email
      UPDATE auth.users 
      SET 
        email_confirmed_at = now(),
        updated_at = now()
      WHERE id = admin_record.id;
      
      confirmed_count := confirmed_count + 1;
      
      results := results || jsonb_build_object(
        'user_id', admin_record.id,
        'email', admin_record.email,
        'status', 'confirmed'
      );
      
    EXCEPTION WHEN OTHERS THEN
      error_count := error_count + 1;
      results := results || jsonb_build_object(
        'user_id', admin_record.id,
        'email', admin_record.email,
        'status', 'error',
        'error_message', SQLERRM
      );
    END;
  END LOOP;
  
  RETURN json_build_object(
    'success', true,
    'confirmed_count', confirmed_count,
    'error_count', error_count,
    'details', results
  );
END;
$$;
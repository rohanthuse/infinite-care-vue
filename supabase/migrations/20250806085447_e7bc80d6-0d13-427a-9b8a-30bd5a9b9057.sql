-- Update the delete_admin_completely function to handle notifications properly
CREATE OR REPLACE FUNCTION public.delete_admin_completely(admin_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_email TEXT;
  result json;
BEGIN
  -- Get admin email for return message
  SELECT email INTO admin_email FROM auth.users WHERE id = admin_user_id;
  
  BEGIN
    -- Delete/update notifications that reference this user
    DELETE FROM public.notifications WHERE user_id = admin_user_id;
    
    -- Update any client records that reference this admin as password_set_by
    UPDATE public.clients 
    SET password_set_by = NULL, 
        updated_at = now()
    WHERE password_set_by = admin_user_id;
    
    -- Delete from admin_branches if exists
    DELETE FROM public.admin_branches WHERE admin_id = admin_user_id;
    
    -- Delete from user_roles
    DELETE FROM public.user_roles WHERE user_id = admin_user_id;
    
    -- Delete from profiles if exists
    DELETE FROM public.profiles WHERE id = admin_user_id;
    
    -- Finally delete the auth user
    DELETE FROM auth.users WHERE id = admin_user_id;
    
    RETURN json_build_object(
      'success', true,
      'admin_id', admin_user_id,
      'admin_email', admin_email,
      'message', 'Admin completely removed from system'
    );
    
  EXCEPTION
    WHEN OTHERS THEN
      RETURN json_build_object(
        'success', false,
        'admin_id', admin_user_id,
        'admin_email', admin_email,
        'error', SQLERRM
      );
  END;
END;
$$;

-- Now remove both email addresses
SELECT delete_admin_completely('aed976e4-5d96-4a32-937b-c03e3dd26da7');
SELECT delete_admin_completely('934f84dc-c5a2-46a0-b644-2c52adaa8c9c');
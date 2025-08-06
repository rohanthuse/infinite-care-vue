-- Create comprehensive admin deletion function that removes all admin data
-- This ensures complete cleanup and allows email reuse

CREATE OR REPLACE FUNCTION public.delete_admin_completely(admin_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
  admin_email TEXT;
  affected_tables JSON := '[]'::JSON;
BEGIN
  -- Start transaction
  BEGIN
    -- Get admin email for logging
    SELECT email INTO admin_email FROM auth.users WHERE id = admin_user_id;
    
    IF admin_email IS NULL THEN
      RETURN json_build_object(
        'success', false,
        'error', 'Admin user not found',
        'admin_id', admin_user_id
      );
    END IF;

    -- 1. Update foreign key references to NULL where this admin is referenced
    -- This prevents referential integrity violations
    
    -- Update clients table where admin set passwords
    UPDATE public.clients 
    SET password_set_by = NULL 
    WHERE password_set_by = admin_user_id;
    
    -- Update expenses where admin was creator or approver
    UPDATE public.expenses 
    SET created_by = NULL 
    WHERE created_by = admin_user_id;
    
    UPDATE public.expenses 
    SET approved_by = NULL 
    WHERE approved_by = admin_user_id;
    
    -- Update forms where admin was creator
    UPDATE public.forms 
    SET created_by = NULL 
    WHERE created_by = admin_user_id;
    
    -- Update form submissions where admin was reviewer
    UPDATE public.form_submissions 
    SET reviewed_by = NULL 
    WHERE reviewed_by = admin_user_id;
    
    -- Update form assignees where admin was assigner
    UPDATE public.form_assignees 
    SET assigned_by = NULL 
    WHERE assigned_by = admin_user_id;
    
    -- Update travel records where admin was approver
    UPDATE public.travel_records 
    SET approved_by = NULL 
    WHERE approved_by = admin_user_id;
    
    -- Update extra time records where admin was approver
    UPDATE public.extra_time_records 
    SET approved_by = NULL, created_by = NULL 
    WHERE approved_by = admin_user_id OR created_by = admin_user_id;
    
    -- Update notifications where admin was referenced
    UPDATE public.notifications 
    SET user_id = NULL 
    WHERE user_id = admin_user_id;

    -- 2. Delete admin-specific records (these should cascade properly)
    
    -- Delete admin permissions
    DELETE FROM public.admin_permissions WHERE admin_id = admin_user_id;
    
    -- Delete admin-branch associations
    DELETE FROM public.admin_branches WHERE admin_id = admin_user_id;
    
    -- Delete user roles
    DELETE FROM public.user_roles WHERE user_id = admin_user_id;
    
    -- 3. Delete profile record (if exists)
    DELETE FROM public.profiles WHERE id = admin_user_id;
    
    -- 4. CRITICAL: Delete auth.users record (enables email reuse)
    -- This must be done last as other operations might need the user to exist
    DELETE FROM auth.users WHERE id = admin_user_id;
    
    -- Build success response
    result := json_build_object(
      'success', true,
      'message', 'Admin completely deleted',
      'admin_id', admin_user_id,
      'admin_email', admin_email,
      'cleanup_completed', true
    );
    
    RETURN result;
    
  EXCEPTION WHEN OTHERS THEN
    -- Rollback happens automatically due to exception
    RETURN json_build_object(
      'success', false,
      'error', SQLERRM,
      'admin_id', admin_user_id,
      'admin_email', admin_email
    );
  END;
END;
$$;
-- Fix create_carer_preapproved function by removing non-existent created_by column
CREATE OR REPLACE FUNCTION public.create_carer_preapproved(
  p_first_name text,
  p_last_name text,
  p_email text,
  p_phone text,
  p_address text,
  p_specialization text,
  p_availability text,
  p_experience text,
  p_date_of_birth date,
  p_branch_id uuid,
  p_admin_id uuid
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  new_staff_id uuid;
  auth_user_id uuid;
  temp_password text;
  result json;
BEGIN
  -- Check if the admin has permission (must be super_admin or branch_admin for this branch)
  IF NOT (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = p_admin_id AND role = 'super_admin') OR
    EXISTS (SELECT 1 FROM public.admin_branches WHERE admin_id = p_admin_id AND branch_id = p_branch_id)
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient permissions');
  END IF;

  -- Generate temporary password
  temp_password := generate_temporary_password();
  
  -- Generate new UUID for staff
  new_staff_id := gen_random_uuid();
  auth_user_id := gen_random_uuid();

  BEGIN
    -- Create auth user first
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      confirmation_token,
      recovery_token,
      email_change_token_new,
      email_change_token_current,
      email_change,
      email_change_confirm_status
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      auth_user_id,
      'authenticated',
      'authenticated',
      p_email,
      crypt(temp_password, gen_salt('bf')),
      now(),
      now(),
      now(),
      '',
      '',
      '',
      '',
      '',
      0
    );

    -- Assign carer role
    INSERT INTO public.user_roles (user_id, role) 
    VALUES (auth_user_id, 'carer');

    -- Create staff record with Active status (removed created_by column that doesn't exist)
    INSERT INTO public.staff (
      id,
      auth_user_id,
      first_name,
      last_name,
      email,
      phone,
      address,
      specialization,
      availability,
      experience,
      date_of_birth,
      branch_id,
      status,
      hire_date
    ) VALUES (
      new_staff_id,
      auth_user_id,
      p_first_name,
      p_last_name,
      p_email,
      p_phone,
      p_address,
      p_specialization,
      p_availability,
      p_experience,
      p_date_of_birth,
      p_branch_id,
      'Active',
      CURRENT_DATE
    );

    RETURN json_build_object(
      'success', true,
      'staff_id', new_staff_id,
      'auth_user_id', auth_user_id,
      'temporary_password', temp_password,
      'message', 'Carer created successfully with immediate access'
    );

  EXCEPTION
    WHEN unique_violation THEN
      RETURN json_build_object('success', false, 'error', 'Email already exists');
    WHEN OTHERS THEN
      RETURN json_build_object('success', false, 'error', 'Failed to create carer: ' || SQLERRM);
  END;
END;
$function$;
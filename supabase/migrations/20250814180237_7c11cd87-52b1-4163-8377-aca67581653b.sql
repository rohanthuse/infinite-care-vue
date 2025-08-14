-- Create sample users for Shashank Care Services for testing login functionality

-- Get the branch ID we just created
DO $$
DECLARE
    branch_id UUID;
    admin_auth_id UUID;
    staff_auth_id UUID;
    client_auth_id UUID;
BEGIN
    -- Get the branch ID for Shashank Care Services
    SELECT id INTO branch_id 
    FROM public.branches 
    WHERE organization_id = '9ad7f8d6-32ba-4beb-b62c-5f3c35c8a2ed'
    LIMIT 1;
    
    -- Create auth users for testing
    -- Branch Admin
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, created_at, updated_at, 
        confirmation_token, recovery_token, 
        email_change_token_new, email_change_token_current, 
        email_change, email_change_confirm_status
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated', 'authenticated',
        'admin@shashankcare.com',
        crypt('admin123', gen_salt('bf')),
        now(), now(), now(), '', '', '', '', '', 0
    ) RETURNING id INTO admin_auth_id;
    
    -- Staff/Carer
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, created_at, updated_at,
        confirmation_token, recovery_token,
        email_change_token_new, email_change_token_current,
        email_change, email_change_confirm_status
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated', 'authenticated',
        'carer@shashankcare.com',
        crypt('carer123', gen_salt('bf')),
        now(), now(), now(), '', '', '', '', '', 0
    ) RETURNING id INTO staff_auth_id;
    
    -- Client
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, created_at, updated_at,
        confirmation_token, recovery_token,
        email_change_token_new, email_change_token_current,
        email_change, email_change_confirm_status
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        gen_random_uuid(),
        'authenticated', 'authenticated',
        'client@shashankcare.com',
        crypt('client123', gen_salt('bf')),
        now(), now(), now(), '', '', '', '', '', 0
    ) RETURNING id INTO client_auth_id;
    
    -- Create admin_branches entry
    INSERT INTO public.admin_branches (admin_id, branch_id, created_at, updated_at)
    VALUES (admin_auth_id, branch_id, now(), now());
    
    -- Create staff record
    INSERT INTO public.staff (
        id, auth_user_id, branch_id, first_name, last_name, email,
        phone, status, hire_date, created_at, updated_at, country
    ) VALUES (
        staff_auth_id, staff_auth_id, branch_id,
        'John', 'Carer', 'carer@shashankcare.com',
        '+91-9876543211', 'Active', CURRENT_DATE,
        now(), now(), 'India'
    );
    
    -- Create client record  
    INSERT INTO public.clients (
        id, auth_user_id, branch_id, first_name, last_name, email,
        phone, created_at, updated_at
    ) VALUES (
        gen_random_uuid(), client_auth_id, branch_id,
        'Jane', 'Client', 'client@shashankcare.com',
        '+91-9876543212', now(), now()
    );
    
    -- Create user roles
    INSERT INTO public.user_roles (user_id, role) VALUES
    (admin_auth_id, 'branch_admin'),
    (staff_auth_id, 'carer'),
    (client_auth_id, 'client');
    
END $$;

-- Update existing last login tracking trigger to work with auth schema
CREATE OR REPLACE FUNCTION public.update_user_last_login()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update system_users if they exist
  UPDATE public.system_users 
  SET last_login_at = NEW.last_sign_in_at
  WHERE id = NEW.id;
  
  -- Update staff if they exist
  UPDATE public.staff 
  SET last_login_at = NEW.last_sign_in_at
  WHERE auth_user_id = NEW.id;
  
  -- Update clients if they exist  
  UPDATE public.clients 
  SET last_login_at = NEW.last_sign_in_at
  WHERE auth_user_id = NEW.id;
  
  RETURN NEW;
END;
$$;
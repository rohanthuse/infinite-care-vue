
-- Add password-related fields to the clients table
ALTER TABLE public.clients
ADD COLUMN temporary_password TEXT,
ADD COLUMN invitation_sent_at TIMESTAMPTZ,
ADD COLUMN password_set_by UUID REFERENCES auth.users(id);

-- Create admin function to set client passwords
CREATE OR REPLACE FUNCTION public.admin_set_client_password(p_client_id uuid, p_new_password text, p_admin_id uuid)
 RETURNS json
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
DECLARE
  client_record RECORD;
  auth_user_id uuid;
  result json;
BEGIN
  -- Check if the admin has permission (must be super_admin or branch_admin)
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = p_admin_id AND role IN ('super_admin', 'branch_admin')
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient permissions');
  END IF;
  
  -- Get client record
  SELECT * INTO client_record FROM public.clients WHERE id = p_client_id;
  
  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Client not found');
  END IF;
  
  -- Check if client already has an auth account
  SELECT id INTO auth_user_id FROM auth.users WHERE email = client_record.email;
  
  IF auth_user_id IS NULL THEN
    -- Create new auth user if doesn't exist
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
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      client_record.email,
      crypt(p_new_password, gen_salt('bf')),
      now(),
      now(),
      now(),
      '',
      ''
    ) RETURNING id INTO auth_user_id;
    
    -- Assign client role
    INSERT INTO public.user_roles (user_id, role) 
    VALUES (auth_user_id, 'client')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    -- Update existing user's password
    UPDATE auth.users 
    SET encrypted_password = crypt(p_new_password, gen_salt('bf')),
        updated_at = now()
    WHERE id = auth_user_id;
  END IF;
  
  -- Update client record with temporary password info
  UPDATE public.clients 
  SET temporary_password = p_new_password,
      invitation_sent_at = now(),
      password_set_by = p_admin_id
  WHERE id = p_client_id;
  
  RETURN json_build_object(
    'success', true, 
    'message', 'Password set successfully',
    'auth_user_id', auth_user_id
  );
END;
$function$;

-- Add 'client' role to app_role enum if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
        CREATE TYPE public.app_role AS ENUM ('super_admin', 'branch_admin', 'carer', 'client');
    ELSE
        -- Add 'client' to existing enum if not present
        BEGIN
            ALTER TYPE public.app_role ADD VALUE 'client';
        EXCEPTION 
            WHEN duplicate_object THEN NULL;
        END;
    END IF;
END $$;

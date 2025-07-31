-- Fix client authentication links and ensure proper care plan visibility
-- This migration will:
-- 1. Create auth users for clients who don't have them
-- 2. Link existing clients to their auth users 
-- 3. Ensure proper role assignment
-- 4. Fix any missing auth_user_id links

-- First, let's create a comprehensive function to fix client auth issues
CREATE OR REPLACE FUNCTION public.fix_all_client_auth_issues()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  client_record RECORD;
  auth_user_id uuid;
  fixed_count INTEGER := 0;
  created_count INTEGER := 0;
  results JSONB := '[]'::JSONB;
BEGIN
  -- Loop through all clients that need auth setup
  FOR client_record IN 
    SELECT c.* FROM public.clients c
    WHERE c.email IS NOT NULL 
    AND c.status = 'active'
  LOOP
    BEGIN
      -- Check if auth user exists for this email
      SELECT id INTO auth_user_id 
      FROM auth.users 
      WHERE email = client_record.email
      LIMIT 1;
      
      IF auth_user_id IS NULL THEN
        -- Create new auth user if doesn't exist
        auth_user_id := gen_random_uuid();
        
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
          client_record.email,
          crypt('temp_password_' || substr(md5(random()::text), 0, 8), gen_salt('bf')),
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
        
        created_count := created_count + 1;
        
        results := results || jsonb_build_object(
          'client_id', client_record.id,
          'client_email', client_record.email,
          'auth_user_id', auth_user_id,
          'action', 'created_auth_user'
        );
      ELSE
        results := results || jsonb_build_object(
          'client_id', client_record.id,
          'client_email', client_record.email,
          'auth_user_id', auth_user_id,
          'action', 'found_existing_auth_user'
        );
      END IF;
      
      -- Update client record to link to auth user if not already linked
      IF client_record.auth_user_id IS NULL OR client_record.auth_user_id != auth_user_id THEN
        UPDATE public.clients 
        SET auth_user_id = auth_user_id,
            updated_at = now()
        WHERE id = client_record.id;
        
        fixed_count := fixed_count + 1;
      END IF;
      
      -- Ensure client role exists
      INSERT INTO public.user_roles (user_id, role) 
      VALUES (auth_user_id, 'client')
      ON CONFLICT (user_id, role) DO NOTHING;
      
    EXCEPTION WHEN OTHERS THEN
      results := results || jsonb_build_object(
        'client_id', client_record.id,
        'client_email', client_record.email,
        'action', 'error',
        'error_message', SQLERRM
      );
    END;
  END LOOP;
  
  RETURN json_build_object(
    'success', true,
    'fixed_links_count', fixed_count,
    'created_auth_users_count', created_count,
    'details', results
  );
END;
$$;

-- Run the function to fix all client auth issues
SELECT public.fix_all_client_auth_issues();

-- Ensure RLS policies allow clients to see their care plans
-- Update the client care plans policy to use the proper auth linkage
DROP POLICY IF EXISTS "Clients can view their own care plans" ON client_care_plans;

CREATE POLICY "Clients can view their own care plans" 
ON client_care_plans 
FOR SELECT 
USING (
  client_id IN (
    SELECT c.id 
    FROM clients c 
    WHERE c.auth_user_id = auth.uid()
  )
);

-- Also allow clients to update their care plans (for approval status)
DROP POLICY IF EXISTS "Clients can update their own care plans for approval" ON client_care_plans;

CREATE POLICY "Clients can update their own care plans for approval" 
ON client_care_plans 
FOR UPDATE 
USING (
  client_id IN (
    SELECT c.id 
    FROM clients c 
    WHERE c.auth_user_id = auth.uid()
  )
)
WITH CHECK (
  client_id IN (
    SELECT c.id 
    FROM clients c 
    WHERE c.auth_user_id = auth.uid()
  )
);

-- Ensure clients can insert status history records
DROP POLICY IF EXISTS "Clients can insert status history for their care plans" ON care_plan_status_history;

CREATE POLICY "Clients can insert status history for their care plans" 
ON care_plan_status_history 
FOR INSERT 
WITH CHECK (
  care_plan_id IN (
    SELECT ccp.id 
    FROM client_care_plans ccp
    JOIN clients c ON ccp.client_id = c.id
    WHERE c.auth_user_id = auth.uid()
  )
);
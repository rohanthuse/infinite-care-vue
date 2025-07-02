
-- Phase 1: Data Cleanup - Remove orphaned user_roles entries
-- First, let's see what we're working with and clean up the mismatch
DELETE FROM public.user_roles 
WHERE user_id NOT IN (
  SELECT id FROM public.clients 
  WHERE id IS NOT NULL
) AND role = 'client';

-- Phase 2: Client-Auth Alignment - Ensure clients have proper auth accounts
-- Create a function to safely set up client authentication without breaking existing flows
CREATE OR REPLACE FUNCTION public.safe_setup_client_messaging_auth()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  client_record RECORD;
  auth_user_id uuid;
  result json := '{"fixed": [], "errors": []}';
  fixed_clients json[] := '{}';
  error_messages text[] := '{}';
BEGIN
  -- Loop through clients that don't have proper auth setup
  FOR client_record IN 
    SELECT c.* FROM public.clients c
    WHERE c.email IS NOT NULL 
    AND NOT EXISTS (
      SELECT 1 FROM auth.users au 
      WHERE au.email = c.email
    )
  LOOP
    BEGIN
      -- Try to create auth user for this client
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
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        client_record.email,
        crypt('temporary_password_' || substr(md5(random()::text), 0, 8), gen_salt('bf')),
        now(),
        now(),
        now(),
        '',
        '',
        '',
        '',
        '',
        0
      ) RETURNING id INTO auth_user_id;
      
      -- Add client role
      INSERT INTO public.user_roles (user_id, role) 
      VALUES (auth_user_id, 'client')
      ON CONFLICT (user_id, role) DO NOTHING;
      
      fixed_clients := array_append(fixed_clients, json_build_object(
        'client_id', client_record.id,
        'email', client_record.email,
        'auth_user_id', auth_user_id
      ));
      
    EXCEPTION WHEN OTHERS THEN
      error_messages := array_append(error_messages, 
        'Failed to create auth for client ' || client_record.id || ': ' || SQLERRM
      );
    END;
  END LOOP;
  
  result := json_build_object(
    'fixed', array_to_json(fixed_clients),
    'errors', array_to_json(error_messages)
  );
  
  RETURN result;
END;
$function$;

-- Phase 3: Add minimal RLS policy for client thread creation
-- This allows clients to create threads when they have proper authentication
CREATE POLICY "Clients can create message threads" 
  ON public.message_threads FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() 
      AND ur.role = 'client'
    )
  );

-- Run the setup function to fix any existing issues
SELECT public.safe_setup_client_messaging_auth();

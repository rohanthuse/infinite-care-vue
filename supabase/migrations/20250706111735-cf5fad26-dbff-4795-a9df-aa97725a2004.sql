-- Fix infinite recursion in RLS policies by using security definer functions
-- and address client ID mapping issues

-- Drop the problematic policies that cause recursion
DROP POLICY IF EXISTS "Users can view threads they participate in" ON public.message_threads;
DROP POLICY IF EXISTS "Thread creators can manage participants" ON public.message_participants;
DROP POLICY IF EXISTS "Users can view their own participation" ON public.message_participants;

-- Create security definer functions to avoid RLS recursion
CREATE OR REPLACE FUNCTION public.user_can_access_thread(thread_id_param uuid, user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  -- Check if user is a participant in the thread
  RETURN EXISTS (
    SELECT 1 FROM public.message_participants 
    WHERE thread_id = thread_id_param 
    AND user_id = user_id_param
  );
END;
$$;

-- Create function to check if user is admin
CREATE OR REPLACE FUNCTION public.user_is_admin(user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = user_id_param 
    AND role IN ('super_admin', 'branch_admin')
  );
END;
$$;

-- Update message_threads policies to use security definer functions
CREATE POLICY "Users can view accessible threads" 
ON public.message_threads 
FOR SELECT 
USING (
  public.user_is_admin(auth.uid()) OR 
  created_by = auth.uid() OR 
  public.user_can_access_thread(id, auth.uid())
);

-- Update message_participants policies to use security definer functions
CREATE POLICY "Users can view thread participants" 
ON public.message_participants 
FOR SELECT 
USING (
  public.user_is_admin(auth.uid()) OR 
  public.user_can_access_thread(thread_id, auth.uid()) OR
  user_id = auth.uid()
);

-- Fix client authentication mapping in message participants
-- This function maps client database IDs to their corresponding auth user IDs
CREATE OR REPLACE FUNCTION public.fix_client_message_participants()
RETURNS TABLE(
  fixed_count INTEGER,
  error_count INTEGER,
  details JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  fixed_records INTEGER := 0;
  error_records INTEGER := 0;
  results JSONB := '[]'::JSONB;
  participant_record RECORD;
  auth_user_id UUID;
BEGIN
  -- Find client participants that use database IDs instead of auth IDs
  FOR participant_record IN 
    SELECT DISTINCT mp.*, c.email as client_email, c.first_name, c.last_name
    FROM message_participants mp
    JOIN clients c ON mp.user_id = c.id
    WHERE mp.user_type = 'client' 
    AND c.email IS NOT NULL
  LOOP
    BEGIN
      -- Find the corresponding auth user for this client email
      SELECT id INTO auth_user_id 
      FROM auth.users 
      WHERE email = participant_record.client_email;
      
      IF auth_user_id IS NOT NULL THEN
        -- Update all participant records for this client
        UPDATE message_participants 
        SET user_id = auth_user_id,
            user_name = COALESCE(
              NULLIF(TRIM(CONCAT(participant_record.first_name, ' ', participant_record.last_name)), ''),
              participant_record.client_email,
              'Client'
            )
        WHERE user_id = participant_record.user_id 
        AND user_type = 'client';
        
        fixed_records := fixed_records + 1;
        
        results := results || jsonb_build_object(
          'old_user_id', participant_record.user_id,
          'new_user_id', auth_user_id,
          'client_email', participant_record.client_email,
          'updated_name', COALESCE(
            NULLIF(TRIM(CONCAT(participant_record.first_name, ' ', participant_record.last_name)), ''),
            participant_record.client_email,
            'Client'
          ),
          'status', 'fixed'
        );
      ELSE
        error_records := error_records + 1;
        results := results || jsonb_build_object(
          'user_id', participant_record.user_id,
          'client_email', participant_record.client_email,
          'status', 'no_auth_user_found'
        );
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      error_records := error_records + 1;
      results := results || jsonb_build_object(
        'user_id', participant_record.user_id,
        'client_email', participant_record.client_email,
        'status', 'error',
        'error_message', SQLERRM
      );
    END;
  END LOOP;
  
  RETURN QUERY SELECT fixed_records, error_records, results;
END;
$$;

-- Run the fix function to update existing client participants
SELECT * FROM public.fix_client_message_participants();
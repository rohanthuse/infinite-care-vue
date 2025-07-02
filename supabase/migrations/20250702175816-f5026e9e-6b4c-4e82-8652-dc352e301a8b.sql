-- Fix message_participants to use auth user IDs instead of client database IDs
-- This migration addresses the ID mismatch issue in the messaging system

-- Create a function to fix existing message participants
CREATE OR REPLACE FUNCTION fix_message_participants_user_ids()
RETURNS TABLE(
  fixed_count INTEGER,
  error_count INTEGER,
  details JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  fixed_records INTEGER := 0;
  error_records INTEGER := 0;
  results JSONB := '[]'::JSONB;
  participant_record RECORD;
  auth_user_id UUID;
  client_email TEXT;
BEGIN
  -- Find all message participants that use client database IDs instead of auth user IDs
  FOR participant_record IN 
    SELECT mp.*, c.email as client_email
    FROM message_participants mp
    LEFT JOIN clients c ON mp.user_id = c.id
    WHERE mp.user_type = 'client' 
    AND c.email IS NOT NULL
  LOOP
    BEGIN
      -- Try to find the corresponding auth user for this client email
      SELECT id INTO auth_user_id 
      FROM auth.users 
      WHERE email = participant_record.client_email;
      
      IF auth_user_id IS NOT NULL THEN
        -- Update the participant record to use the auth user ID
        UPDATE message_participants 
        SET user_id = auth_user_id
        WHERE thread_id = participant_record.thread_id 
        AND user_id = participant_record.user_id 
        AND user_type = 'client';
        
        fixed_records := fixed_records + 1;
        
        -- Add to results for logging
        results := results || jsonb_build_object(
          'thread_id', participant_record.thread_id,
          'old_user_id', participant_record.user_id,
          'new_user_id', auth_user_id,
          'client_email', participant_record.client_email,
          'status', 'fixed'
        );
      ELSE
        error_records := error_records + 1;
        results := results || jsonb_build_object(
          'thread_id', participant_record.thread_id,
          'user_id', participant_record.user_id,
          'client_email', participant_record.client_email,
          'status', 'no_auth_user_found'
        );
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      error_records := error_records + 1;
      results := results || jsonb_build_object(
        'thread_id', participant_record.thread_id,
        'user_id', participant_record.user_id,
        'client_email', participant_record.client_email,
        'status', 'error',
        'error_message', SQLERRM
      );
    END;
  END LOOP;
  
  RETURN QUERY SELECT fixed_records, error_records, results;
END;
$function$;

-- Execute the fix function
SELECT * FROM fix_message_participants_user_ids();
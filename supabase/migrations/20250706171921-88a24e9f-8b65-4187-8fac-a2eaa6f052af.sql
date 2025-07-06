-- Create message attachments storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('message-attachments', 'message-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for message attachments bucket
CREATE POLICY "Public read access for message attachments" ON storage.objects
FOR SELECT USING (bucket_id = 'message-attachments');

CREATE POLICY "Authenticated users can upload message attachments" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'message-attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update message attachments" ON storage.objects
FOR UPDATE USING (bucket_id = 'message-attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete message attachments" ON storage.objects
FOR DELETE USING (bucket_id = 'message-attachments' AND auth.role() = 'authenticated');

-- Fix message_read_status RLS policies to prevent violations
DROP POLICY IF EXISTS "Users can mark messages as read" ON public.message_read_status;
DROP POLICY IF EXISTS "Users can update their read status" ON public.message_read_status;

CREATE POLICY "Users can manage their read status" ON public.message_read_status
FOR ALL USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- Create a function to fix client message participants user IDs
CREATE OR REPLACE FUNCTION public.sync_client_message_participants()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  participant_record RECORD;
  auth_user_id UUID;
BEGIN
  -- Find client participants using database IDs instead of auth IDs
  FOR participant_record IN 
    SELECT DISTINCT mp.*, c.email as client_email
    FROM message_participants mp
    JOIN clients c ON mp.user_id = c.id
    WHERE mp.user_type = 'client' 
    AND c.email IS NOT NULL
  LOOP
    -- Find corresponding auth user
    SELECT id INTO auth_user_id 
    FROM auth.users 
    WHERE email = participant_record.client_email;
    
    IF auth_user_id IS NOT NULL THEN
      -- Update participant to use auth user ID
      UPDATE message_participants 
      SET user_id = auth_user_id
      WHERE thread_id = participant_record.thread_id 
      AND user_id = participant_record.user_id 
      AND user_type = 'client';
    END IF;
  END LOOP;
END;
$$;

-- Run the sync function
SELECT public.sync_client_message_participants();
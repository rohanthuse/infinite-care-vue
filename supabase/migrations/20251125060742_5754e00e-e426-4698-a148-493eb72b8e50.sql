-- Add other_email_address column to messages table
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS other_email_address TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.messages.other_email_address IS 'Alternative email address to send notification when otherEmail is in notification_methods';

-- Add other_email_address column to scheduled_messages table
ALTER TABLE public.scheduled_messages 
ADD COLUMN IF NOT EXISTS other_email_address TEXT;

-- Add comment for documentation
COMMENT ON COLUMN public.scheduled_messages.other_email_address IS 'Alternative email address for scheduled message notifications';

-- Update the create_message_notification function to include other_email_address
CREATE OR REPLACE FUNCTION public.create_message_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  participant_record RECORD;
  thread_record RECORD;
  sender_name TEXT;
  notification_priority TEXT;
  auth_user_exists BOOLEAN;
BEGIN
  -- Get thread details
  SELECT * INTO thread_record
  FROM public.message_threads
  WHERE id = NEW.thread_id;

  -- Get sender name from message_participants
  SELECT user_name INTO sender_name
  FROM public.message_participants
  WHERE thread_id = NEW.thread_id AND user_id = NEW.sender_id
  LIMIT 1;

  -- Default sender name if not found
  IF sender_name IS NULL THEN
    sender_name := 'Unknown Sender';
  END IF;

  -- Determine notification priority based on message flags
  IF NEW.action_required = true OR NEW.priority = 'urgent' THEN
    notification_priority := 'urgent';
  ELSIF NEW.admin_eyes_only = true OR NEW.priority = 'high' THEN
    notification_priority := 'high';
  ELSIF NEW.priority = 'medium' THEN
    notification_priority := 'medium';
  ELSE
    notification_priority := 'low';
  END IF;

  -- Create notifications for all thread participants except the sender
  FOR participant_record IN 
    SELECT user_id, user_type
    FROM public.message_participants
    WHERE thread_id = NEW.thread_id AND user_id != NEW.sender_id
  LOOP
    -- Check if user has an auth account
    SELECT EXISTS (
      SELECT 1 FROM auth.users WHERE id = participant_record.user_id
    ) INTO auth_user_exists;

    -- Only create notification if user has an auth account
    IF auth_user_exists THEN
      INSERT INTO public.notifications (
        user_id,
        branch_id,
        type,
        category,
        priority,
        title,
        message,
        data
      ) VALUES (
        participant_record.user_id,
        thread_record.branch_id,
        'message',
        'info',
        notification_priority,
        CASE 
          WHEN NEW.action_required THEN 'ACTION REQUIRED: Message from ' || sender_name
          WHEN NEW.admin_eyes_only THEN 'ADMIN: Message from ' || sender_name
          ELSE 'New message from ' || sender_name
        END,
        CASE 
          WHEN length(NEW.content) > 100 THEN 
            substring(NEW.content from 1 for 97) || '...'
          ELSE 
            NEW.content
        END,
        jsonb_build_object(
          'thread_id', NEW.thread_id,
          'message_id', NEW.id,
          'sender_name', sender_name,
          'thread_subject', COALESCE(thread_record.subject, 'Conversation'),
          'message_type', NEW.message_type,
          'action_required', NEW.action_required,
          'admin_eyes_only', NEW.admin_eyes_only,
          'notification_methods', NEW.notification_methods,
          'other_email_address', NEW.other_email_address
        )
      );
    ELSE
      RAISE WARNING 'Skipping notification for user % - no auth account found', participant_record.user_id;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$function$;
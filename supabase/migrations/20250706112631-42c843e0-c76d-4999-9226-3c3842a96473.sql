-- Create function to generate message notifications
CREATE OR REPLACE FUNCTION public.create_message_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  participant_record RECORD;
  thread_record RECORD;
  sender_name TEXT;
BEGIN
  -- Get thread information
  SELECT subject INTO thread_record
  FROM public.message_threads
  WHERE id = NEW.thread_id;
  
  -- Get sender name from participants
  SELECT user_name INTO sender_name
  FROM public.message_participants
  WHERE thread_id = NEW.thread_id AND user_id = NEW.sender_id
  LIMIT 1;
  
  -- Default sender name if not found
  IF sender_name IS NULL THEN
    sender_name := 'Someone';
  END IF;
  
  -- Create notifications for all thread participants except the sender
  FOR participant_record IN 
    SELECT user_id, user_type
    FROM public.message_participants
    WHERE thread_id = NEW.thread_id AND user_id != NEW.sender_id
  LOOP
    -- Get branch_id from thread or default
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
      (SELECT branch_id FROM public.message_threads WHERE id = NEW.thread_id),
      'message',
      'info',
      'medium',
      'New message from ' || sender_name,
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
        'thread_subject', COALESCE(thread_record.subject, 'Conversation')
      )
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically create notifications for new messages
DROP TRIGGER IF EXISTS create_message_notification_trigger ON public.messages;
CREATE TRIGGER create_message_notification_trigger
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.create_message_notification();
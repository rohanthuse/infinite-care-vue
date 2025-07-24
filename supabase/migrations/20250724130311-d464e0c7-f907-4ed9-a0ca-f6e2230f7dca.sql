-- Update the create_message_notification function to be more robust
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
  -- Get thread information
  SELECT subject, admin_only INTO thread_record
  FROM public.message_threads
  WHERE id = NEW.thread_id;
  
  -- Skip notifications for admin-only threads if participants aren't admins
  IF thread_record.admin_only THEN
    RETURN NEW;
  END IF;
  
  -- Get sender name from participants
  SELECT user_name INTO sender_name
  FROM public.message_participants
  WHERE thread_id = NEW.thread_id AND user_id = NEW.sender_id
  LIMIT 1;
  
  -- Default sender name if not found
  IF sender_name IS NULL THEN
    sender_name := 'Someone';
  END IF;
  
  -- Set notification priority based on message metadata
  notification_priority := CASE 
    WHEN NEW.priority = 'urgent' THEN 'urgent'
    WHEN NEW.priority = 'high' THEN 'high'
    WHEN NEW.action_required THEN 'high'
    ELSE 'medium'
  END;
  
  -- Create notifications for all thread participants except the sender
  FOR participant_record IN 
    SELECT user_id, user_type
    FROM public.message_participants
    WHERE thread_id = NEW.thread_id AND user_id != NEW.sender_id
  LOOP
    -- Skip admin-only messages for non-admin users
    IF NEW.admin_eyes_only AND NOT EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = participant_record.user_id 
      AND role IN ('super_admin', 'branch_admin')
    ) THEN
      CONTINUE;
    END IF;
    
    -- Check if the user exists in auth.users before creating notification
    SELECT EXISTS (
      SELECT 1 FROM auth.users WHERE id = participant_record.user_id
    ) INTO auth_user_exists;
    
    -- Only create notification if the user exists in auth.users
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
        (SELECT branch_id FROM public.message_threads WHERE id = NEW.thread_id),
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
          'admin_eyes_only', NEW.admin_eyes_only
        )
      );
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$function$;
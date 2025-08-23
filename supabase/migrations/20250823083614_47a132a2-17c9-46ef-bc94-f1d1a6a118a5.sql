-- Fix ambiguous column reference in get_notification_stats function
DROP FUNCTION IF EXISTS public.get_notification_stats(uuid, uuid);

CREATE OR REPLACE FUNCTION public.get_notification_stats(p_user_id uuid, p_branch_id uuid DEFAULT NULL::uuid)
 RETURNS TABLE(total_count bigint, unread_count bigint, high_priority_count bigint, by_type jsonb)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  WITH base_notifications AS (
    SELECT 
      n.type,
      n.read_at,
      n.priority
    FROM public.notifications n
    WHERE n.user_id = p_user_id
      AND (p_branch_id IS NULL OR n.branch_id = p_branch_id)
      AND (n.expires_at IS NULL OR n.expires_at > now())
  ),
  stats AS (
    SELECT 
      count(*) as total,
      count(CASE WHEN read_at IS NULL THEN 1 END) as unread,
      count(CASE WHEN priority IN ('high', 'urgent') AND read_at IS NULL THEN 1 END) as high_priority
    FROM base_notifications
  ),
  type_stats AS (
    SELECT 
      type,
      count(*) as total_count,
      count(CASE WHEN read_at IS NULL THEN 1 END) as unread_count
    FROM base_notifications
    GROUP BY type
  )
  SELECT 
    s.total,
    s.unread,
    s.high_priority,
    COALESCE(
      (SELECT jsonb_object_agg(
        type, 
        jsonb_build_object(
          'total', total_count,
          'unread', unread_count
        )
      ) FROM type_stats),
      '{}'::jsonb
    ) as by_type_data
  FROM stats s;
END;
$function$;

-- Create trigger to generate notifications for client events logs
CREATE OR REPLACE FUNCTION public.create_event_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  event_record RECORD;
  staff_record RECORD;
  notification_title TEXT;
  notification_message TEXT;
  notification_priority TEXT;
BEGIN
  -- Use NEW for INSERT/UPDATE operations
  event_record := NEW;
  
  -- Get client info to create meaningful notification
  SELECT 
    CONCAT(c.first_name, ' ', c.last_name) as client_name,
    c.branch_id
  INTO notification_title, event_record.branch_id
  FROM clients c 
  WHERE c.id = event_record.client_id;
  
  -- Set notification details based on event
  notification_title := 'New Event: ' || COALESCE(event_record.title, 'Client Event');
  notification_message := COALESCE(event_record.description, 'A new event has been logged for ' || COALESCE(notification_title, 'a client'));
  
  -- Set priority based on severity
  notification_priority := CASE 
    WHEN event_record.severity IN ('high', 'critical') THEN 'high'
    WHEN event_record.severity = 'medium' THEN 'medium'
    ELSE 'low'
  END;
  
  -- Create notifications for all carers in the same branch
  FOR staff_record IN 
    SELECT s.auth_user_id
    FROM staff s
    WHERE s.branch_id = event_record.branch_id 
    AND s.auth_user_id IS NOT NULL
    AND s.status = 'active'
  LOOP
    -- Skip if auth_user_id is null
    IF staff_record.auth_user_id IS NULL THEN
      CONTINUE;
    END IF;
    
    -- Insert notification
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
      staff_record.auth_user_id,
      event_record.branch_id,
      'task',
      'info',
      notification_priority,
      notification_title,
      notification_message,
      jsonb_build_object(
        'event_id', event_record.id,
        'client_id', event_record.client_id,
        'event_title', event_record.title,
        'event_severity', event_record.severity,
        'event_category', event_record.category
      )
    );
  END LOOP;
  
  RETURN event_record;
END;
$function$;

-- Create trigger for new events
DROP TRIGGER IF EXISTS create_event_notification_trigger ON client_events_logs;
CREATE TRIGGER create_event_notification_trigger
  AFTER INSERT ON client_events_logs
  FOR EACH ROW
  EXECUTE FUNCTION create_event_notification();
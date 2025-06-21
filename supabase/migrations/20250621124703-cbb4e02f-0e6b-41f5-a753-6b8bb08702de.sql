
-- Fix the get_notification_stats function to avoid nested aggregate calls
DROP FUNCTION IF EXISTS public.get_notification_stats(uuid, uuid);

CREATE OR REPLACE FUNCTION public.get_notification_stats(p_user_id uuid, p_branch_id uuid DEFAULT NULL)
RETURNS TABLE(
  total_count bigint,
  unread_count bigint,
  high_priority_count bigint,
  by_type jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH base_notifications AS (
    SELECT 
      type,
      read_at,
      priority
    FROM public.notifications
    WHERE user_id = p_user_id
      AND (p_branch_id IS NULL OR branch_id = p_branch_id)
      AND (expires_at IS NULL OR expires_at > now())
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
$$;

-- Add proper RLS policies for notifications table to allow system operations
CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (true);

-- Allow users to create their own notifications (for testing/manual creation)
CREATE POLICY "Users can create notifications for themselves"
  ON public.notifications FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Ensure the notifications table has proper realtime setup
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- Add the table to realtime publication if not already added
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
  END IF;
END $$;

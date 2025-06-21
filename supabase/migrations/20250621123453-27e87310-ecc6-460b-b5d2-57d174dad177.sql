
-- Create notifications table with comprehensive fields
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('booking', 'task', 'appointment', 'document', 'system', 'staff', 'client', 'medication', 'rota')),
  category TEXT NOT NULL CHECK (category IN ('info', 'warning', 'error', 'success')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  read_at TIMESTAMP WITH TIME ZONE NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NULL
);

-- Create notification preferences table
CREATE TABLE public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, notification_type)
);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- RLS policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id = auth.uid());

-- RLS policies for notification preferences
CREATE POLICY "Users can manage their own notification preferences"
  ON public.notification_preferences FOR ALL
  USING (user_id = auth.uid());

-- Create indexes for performance
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_notifications_branch_id ON public.notifications(branch_id);
CREATE INDEX idx_notifications_type ON public.notifications(type);
CREATE INDEX idx_notifications_read_at ON public.notifications(read_at);
CREATE INDEX idx_notifications_created_at ON public.notifications(created_at);

-- Create trigger for updated_at
CREATE TRIGGER update_notifications_updated_at
  BEFORE UPDATE ON public.notifications
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to create notifications for overdue bookings
CREATE OR REPLACE FUNCTION public.create_overdue_booking_notifications()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Create notifications for bookings that are overdue (past end_time and not completed)
  INSERT INTO public.notifications (user_id, branch_id, type, category, priority, title, message, data)
  SELECT 
    b.staff_id as user_id,
    b.branch_id,
    'booking' as type,
    'warning' as category,
    'high' as priority,
    'Overdue Booking' as title,
    CONCAT('Booking with ', c.first_name, ' ', c.last_name, ' is overdue') as message,
    json_build_object('booking_id', b.id, 'client_name', CONCAT(c.first_name, ' ', c.last_name))::jsonb as data
  FROM public.bookings b
  LEFT JOIN public.clients c ON b.client_id = c.id
  WHERE b.end_time < now()
    AND b.status != 'completed'
    AND NOT EXISTS (
      SELECT 1 FROM public.notifications n 
      WHERE n.user_id = b.staff_id 
        AND n.type = 'booking'
        AND (n.data->>'booking_id')::uuid = b.id
        AND n.created_at > now() - interval '24 hours'
    );
END;
$$;

-- Function to get notification statistics for a user
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
  WITH stats AS (
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE read_at IS NULL) as unread,
      COUNT(*) FILTER (WHERE priority IN ('high', 'urgent') AND read_at IS NULL) as high_priority
    FROM public.notifications
    WHERE user_id = p_user_id
      AND (p_branch_id IS NULL OR branch_id = p_branch_id)
      AND (expires_at IS NULL OR expires_at > now())
  ),
  type_stats AS (
    SELECT 
      jsonb_object_agg(
        type, 
        jsonb_build_object(
          'total', count(*),
          'unread', count(*) FILTER (WHERE read_at IS NULL)
        )
      ) as by_type_data
    FROM public.notifications
    WHERE user_id = p_user_id
      AND (p_branch_id IS NULL OR branch_id = p_branch_id)
      AND (expires_at IS NULL OR expires_at > now())
    GROUP BY type
  )
  SELECT 
    s.total,
    s.unread,
    s.high_priority,
    COALESCE(ts.by_type_data, '{}'::jsonb)
  FROM stats s
  CROSS JOIN type_stats ts;
END;
$$;

-- Enable realtime for notifications
ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER publication supabase_realtime ADD TABLE public.notifications;

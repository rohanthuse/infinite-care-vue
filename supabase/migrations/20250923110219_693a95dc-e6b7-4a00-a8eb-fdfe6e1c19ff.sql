-- Fix the ambiguous column reference in get_notification_stats function
CREATE OR REPLACE FUNCTION public.get_notification_stats(
  p_user_id UUID,
  p_branch_id UUID DEFAULT NULL
)
RETURNS TABLE (
  total_count INTEGER,
  unread_count INTEGER,
  high_priority_count INTEGER,
  by_type JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
      n_type,
      count(*) as type_total,
      count(CASE WHEN read_at IS NULL THEN 1 END) as type_unread
    FROM (
      SELECT 
        type as n_type,
        read_at
      FROM base_notifications
    ) grouped_notifications
    GROUP BY n_type
  )
  SELECT 
    s.total::INTEGER,
    s.unread::INTEGER,
    s.high_priority::INTEGER,
    COALESCE(
      (SELECT jsonb_object_agg(
        n_type, 
        jsonb_build_object(
          'total', type_total,
          'unread', type_unread
        )
      ) FROM type_stats),
      '{}'::jsonb
    ) as by_type_data
  FROM stats s;
END;
$$;
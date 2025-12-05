-- Create RPC function to mark system notifications as read
-- Uses SECURITY DEFINER to bypass RLS for broadcast notifications
CREATE OR REPLACE FUNCTION public.mark_system_notifications_read(
  p_notification_ids uuid[],
  p_session_token text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_system_admin boolean := false;
  v_updated_count int := 0;
BEGIN
  -- Validate system admin via session token
  IF p_session_token IS NOT NULL THEN
    SELECT EXISTS(
      SELECT 1 FROM system_sessions ss
      JOIN system_users su ON ss.user_id = su.id
      WHERE ss.session_token = p_session_token
        AND ss.is_active = true
        AND ss.expires_at > NOW()
    ) INTO v_is_system_admin;
  END IF;

  -- Also check if auth.uid() has system admin role as fallback
  IF NOT v_is_system_admin THEN
    SELECT EXISTS(
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role IN ('super_admin', 'app_admin')
    ) INTO v_is_system_admin;
  END IF;

  IF NOT v_is_system_admin THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- Mark notifications as read
  UPDATE notifications
  SET read_at = NOW(), updated_at = NOW()
  WHERE id = ANY(p_notification_ids)
    AND read_at IS NULL;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;

  RETURN jsonb_build_object('success', true, 'updated_count', v_updated_count);
END;
$$;
-- Phase 1: Add new notification types
ALTER TABLE public.notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
ALTER TABLE public.notifications ADD CONSTRAINT notifications_type_check 
CHECK (type IN (
  'info', 'booking', 'medication', 'appointment', 
  'message', 'leave_request', 'incident', 'staff_check_in',
  'agreement_expiry', 'care_plan', 'care_plan_status', 'demo_request', 
  'task', 'unassigned_booking', 'service_report', 'service_report_status',
  'booking_unavailability', 'tenant_status_change', 'subscription_expiry', 'pending_agreement', 'system'
));

-- Phase 2: Create subscription expiry tracking table
CREATE TABLE IF NOT EXISTS public.subscription_expiry_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  days_before_expiry INTEGER NOT NULL,
  notification_sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT unique_subscription_expiry_notification UNIQUE (organization_id, days_before_expiry)
);

CREATE INDEX IF NOT EXISTS idx_subscription_expiry_notifications_org 
ON public.subscription_expiry_notifications(organization_id);

-- Phase 3: Create subscription expiry notification function
CREATE OR REPLACE FUNCTION public.process_subscription_expiry_notifications()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_org RECORD;
  v_days_before INTEGER;
  v_notification_intervals INTEGER[] := ARRAY[15, 7, 1, 0];
  v_sent_count INTEGER := 0;
BEGIN
  FOR v_org IN 
    SELECT 
      o.id,
      o.name,
      o.subscription_expires_at,
      EXTRACT(DAY FROM (o.subscription_expires_at - NOW()))::INTEGER as days_remaining
    FROM public.organizations o
    WHERE o.subscription_status = 'active'
      AND o.subscription_expires_at IS NOT NULL
      AND o.subscription_expires_at <= NOW() + INTERVAL '15 days'
  LOOP
    FOREACH v_days_before IN ARRAY v_notification_intervals
    LOOP
      IF v_org.days_remaining <= v_days_before AND v_org.days_remaining > (v_days_before - 1) THEN
        IF NOT EXISTS (
          SELECT 1 FROM public.subscription_expiry_notifications
          WHERE organization_id = v_org.id AND days_before_expiry = v_days_before
        ) THEN
          INSERT INTO public.notifications (user_id, type, category, priority, title, message, data)
          SELECT 
            su.auth_user_id,
            'subscription_expiry',
            CASE WHEN v_days_before <= 1 THEN 'system' ELSE 'info' END,
            CASE WHEN v_days_before <= 1 THEN 'urgent' WHEN v_days_before <= 7 THEN 'high' ELSE 'medium' END,
            CASE 
              WHEN v_days_before = 0 THEN 'Subscription Expires Today'
              ELSE 'Subscription Expiring Soon'
            END,
            CASE 
              WHEN v_days_before = 0 THEN 'Subscription for ' || v_org.name || ' expires today'
              ELSE 'Subscription for ' || v_org.name || ' will expire in ' || v_days_before || ' day(s)'
            END,
            jsonb_build_object(
              'organization_id', v_org.id,
              'organization_name', v_org.name,
              'expires_at', v_org.subscription_expires_at,
              'days_remaining', v_days_before
            )
          FROM public.system_users su
          WHERE su.is_active = true;
          
          INSERT INTO public.subscription_expiry_notifications (organization_id, days_before_expiry)
          VALUES (v_org.id, v_days_before);
          
          v_sent_count := v_sent_count + 1;
        END IF;
      END IF;
    END LOOP;
  END LOOP;
  
  RETURN json_build_object('notifications_sent', v_sent_count);
END;
$$;

-- Phase 4: Create pending agreements check function
CREATE OR REPLACE FUNCTION public.check_pending_agreements()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_org RECORD;
  v_sent_count INTEGER := 0;
  v_total_count INTEGER := 0;
BEGIN
  FOR v_org IN 
    SELECT o.id, o.name
    FROM public.organizations o
    WHERE NOT EXISTS (
      SELECT 1 FROM public.system_tenant_agreements sta 
      WHERE sta.tenant_id = o.id
    )
  LOOP
    v_total_count := v_total_count + 1;
    
    IF NOT EXISTS (
      SELECT 1 FROM public.notifications 
      WHERE type = 'pending_agreement'
      AND (data->>'organization_id')::uuid = v_org.id
      AND created_at > NOW() - INTERVAL '7 days'
    ) THEN
      INSERT INTO public.notifications (user_id, type, category, priority, title, message, data)
      SELECT 
        su.auth_user_id,
        'pending_agreement',
        'info',
        'medium',
        'Agreement Pending',
        'No agreement found for tenant "' || v_org.name || '"',
        jsonb_build_object(
          'organization_id', v_org.id,
          'organization_name', v_org.name
        )
      FROM public.system_users su
      WHERE su.is_active = true;
      
      v_sent_count := v_sent_count + 1;
    END IF;
  END LOOP;
  
  RETURN json_build_object(
    'tenants_without_agreements', v_total_count,
    'notifications_sent', v_sent_count,
    'timestamp', NOW()
  );
END;
$$;

-- Phase 5: Drop and recreate get_system_notifications to include new types
DROP FUNCTION IF EXISTS public.get_system_notifications(uuid);

CREATE OR REPLACE FUNCTION public.get_system_notifications(p_user_id uuid DEFAULT NULL::uuid)
RETURNS TABLE(
  id uuid,
  user_id uuid,
  type text,
  category text,
  priority text,
  title text,
  message text,
  data jsonb,
  read_at timestamp with time zone,
  created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    n.id,
    n.user_id,
    n.type,
    n.category,
    n.priority,
    n.title,
    n.message,
    n.data,
    n.read_at,
    n.created_at
  FROM public.notifications n
  WHERE n.user_id = COALESCE(p_user_id, auth.uid())
    AND n.type IN ('demo_request', 'system', 'tenant_status_change', 'subscription_expiry', 'pending_agreement')
  ORDER BY n.created_at DESC;
END;
$$;
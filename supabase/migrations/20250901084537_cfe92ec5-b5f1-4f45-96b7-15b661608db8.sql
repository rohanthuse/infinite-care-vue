
-- 1) Replace care plan status notification function (no use of NEW.assigned_staff_id)
CREATE OR REPLACE FUNCTION public.handle_care_plan_status_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  client_record RECORD;
  admin_rec RECORD;
  notification_title TEXT;
  notification_message TEXT;
BEGIN
  -- Only act when status actually changes
  IF TG_OP = 'UPDATE' AND (OLD.status IS DISTINCT FROM NEW.status) THEN
    -- Gather client info for this care plan
    SELECT c.id,
           c.auth_user_id,
           c.branch_id,
           c.first_name,
           c.last_name
    INTO client_record
    FROM public.clients c
    JOIN public.client_care_plans cp ON cp.client_id = c.id
    WHERE cp.id = NEW.id;

    notification_title := CASE NEW.status
      WHEN 'active' THEN 'Care Plan Activated'
      WHEN 'pending_client_approval' THEN 'Care Plan Awaiting Client Approval'
      WHEN 'rejected' THEN 'Care Plan Changes Requested'
      ELSE 'Care Plan Status Updated'
    END;

    notification_message := 'Care plan ' || COALESCE(NEW.display_id, NEW.id::text) || ' for ' ||
      COALESCE(client_record.first_name, '') || ' ' || COALESCE(client_record.last_name, '') ||
      ' updated to ' || NEW.status;

    -- Notify client (if linked to auth)
    IF client_record.auth_user_id IS NOT NULL THEN
      PERFORM public.safe_notify(
        client_record.auth_user_id,
        client_record.branch_id,
        'care_plan',
        'info',
        CASE WHEN NEW.status = 'pending_client_approval' THEN 'high' ELSE 'medium' END,
        notification_title,
        notification_message,
        jsonb_build_object(
          'care_plan_id', NEW.id,
          'status', NEW.status,
          'display_id', NEW.display_id
        )
      );
    END IF;

    -- Notify all admins for the client's branch
    FOR admin_rec IN
      SELECT ab.admin_id
      FROM public.admin_branches ab
      WHERE ab.branch_id = client_record.branch_id
    LOOP
      PERFORM public.safe_notify(
        admin_rec.admin_id,
        client_record.branch_id,
        'care_plan',
        'info',
        CASE WHEN NEW.status IN ('active','rejected') THEN 'high' ELSE 'medium' END,
        notification_title,
        notification_message,
        jsonb_build_object(
          'care_plan_id', NEW.id,
          'status', NEW.status,
          'display_id', NEW.display_id
        )
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-- Recreate the trigger to fire only on status updates
DROP TRIGGER IF EXISTS care_plan_status_notification_trigger ON public.client_care_plans;
CREATE TRIGGER care_plan_status_notification_trigger
  AFTER UPDATE OF status ON public.client_care_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_care_plan_status_notification();


-- 2) Replace the older approval notification function to remove any reference
--    to assigned_staff_id and to use safe_notify + auth_user_id for staff.
CREATE OR REPLACE FUNCTION public.notify_carers_on_care_plan_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  care_plan_record RECORD;
  staff_rec RECORD;
BEGIN
  -- Only when the plan moves from pending_client_approval -> active
  IF OLD.status = 'pending_client_approval' AND NEW.status = 'active' THEN
    -- Get details for composing the message
    SELECT 
      ccp.id,
      ccp.care_plan_type,
      ccp.display_id,
      c.first_name AS client_first_name,
      c.last_name  AS client_last_name,
      c.branch_id
    INTO care_plan_record
    FROM public.client_care_plans ccp
    JOIN public.clients c ON ccp.client_id = c.id
    WHERE ccp.id = NEW.id;

    -- Notify all active staff in that branch (where they have an auth_user_id)
    FOR staff_rec IN
      SELECT s.auth_user_id
      FROM public.staff s
      WHERE s.branch_id = care_plan_record.branch_id
        AND s.status = 'active'
        AND s.auth_user_id IS NOT NULL
    LOOP
      PERFORM public.safe_notify(
        staff_rec.auth_user_id,
        care_plan_record.branch_id,
        'care_plan',
        'info',
        'medium',
        'Care Plan Approved - ' || care_plan_record.client_first_name || ' ' || care_plan_record.client_last_name,
        'A care plan has been approved by the client and is now active.',
        jsonb_build_object(
          'care_plan_id', NEW.id,
          'client_name', care_plan_record.client_first_name || ' ' || care_plan_record.client_last_name,
          'care_plan_type', care_plan_record.care_plan_type,
          'display_id', care_plan_record.display_id,
          'approved_at', NEW.client_acknowledged_at
        )
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-- Ensure the approval trigger is present and pointing to the fixed function
DROP TRIGGER IF EXISTS notify_carers_on_care_plan_approval_trigger ON public.client_care_plans;
CREATE TRIGGER notify_carers_on_care_plan_approval_trigger
  AFTER UPDATE ON public.client_care_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_carers_on_care_plan_approval();

 block using DO $$ to create the trigger if it’s missing. Let's get that together!" duration="3.435667">
</lov-tool-use>
Thanks for the screenshot. The error “record ‘new’ has no field ‘assigned_staff_id’” is coming from the database trigger that runs when a care plan status changes. The trigger function handle_care_plan_status_notification() tries to read NEW.assigned_staff_id, but that column doesn’t exist on client_care_plans in your schema. This causes the approval to fail at the DB level.

We’ll fix this by updating the function to remove that reference and keep notifying:
- the client (if they have an auth_user_id)
- all admins for the client’s branch

lov-plan
1) Replace public.handle_care_plan_status_notification() to stop referencing NEW.assigned_staff_id. Keep client and branch admin notifications with type = 'care_plan'.
2) Ensure the trigger exists (create it if missing) so status changes still generate notifications.
3) Retest Sign & Approve Care Plan on /xyz/client-dashboard/care-plans.
</lov-plan>

<lov-sql>
-- Fix: remove use of NEW.assigned_staff_id from notification function
CREATE OR REPLACE FUNCTION public.handle_care_plan_status_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  client_record RECORD;
  admin_record RECORD;
  notification_title TEXT;
  notification_message TEXT;
BEGIN
  -- Only proceed if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Get client information (and branch)
    SELECT c.*, b.id as branch_id INTO client_record
    FROM public.clients c
    JOIN public.branches b ON c.branch_id = b.id
    WHERE c.id = NEW.client_id;

    -- Determine notification content based on status
    CASE NEW.status
      WHEN 'pending_approval' THEN
        notification_title := 'Care Plan Ready for Review';
        notification_message := 'Care plan for ' || client_record.first_name || ' ' || client_record.last_name || ' is ready for approval.';
      WHEN 'active' THEN
        notification_title := 'Care Plan Approved';
        notification_message := 'Care plan for ' || client_record.first_name || ' ' || client_record.last_name || ' has been approved and is now active.';
      WHEN 'rejected' THEN
        notification_title := 'Care Plan Rejected';
        notification_message := 'Care plan for ' || client_record.first_name || ' ' || client_record.last_name || ' has been rejected.';
      WHEN 'changes_requested' THEN
        notification_title := 'Care Plan Changes Requested';
        notification_message := 'Changes have been requested for ' || client_record.first_name || ' ' || client_record.last_name || '''s care plan.';
      ELSE
        -- No notification for other status changes
        RETURN NEW;
    END CASE;

    -- Notify client if they have auth_user_id
    IF client_record.auth_user_id IS NOT NULL THEN
      PERFORM public.safe_notify(
        client_record.auth_user_id,
        client_record.branch_id,
        'care_plan',          -- valid type
        'info',
        CASE NEW.status WHEN 'rejected' THEN 'high' ELSE 'medium' END,
        notification_title,
        notification_message,
        jsonb_build_object(
          'care_plan_id', NEW.id,
          'client_id', NEW.client_id,
          'status', NEW.status,
          'display_id', NEW.display_id
        )
      );
    END IF;

    -- Notify all admins in the same branch
    FOR admin_record IN
      SELECT ab.admin_id
      FROM public.admin_branches ab
      WHERE ab.branch_id = client_record.branch_id
    LOOP
      PERFORM public.safe_notify(
        admin_record.admin_id,
        client_record.branch_id,
        'care_plan',
        'info',
        'medium',
        notification_title,
        notification_message,
        jsonb_build_object(
          'care_plan_id', NEW.id,
          'client_id', NEW.client_id,
          'status', NEW.status,
          'display_id', NEW.display_id
        )
      );
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$;

-- Ensure the trigger exists to call this function on status change
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger
    WHERE tgname = 'trg_handle_care_plan_status_notification'
  ) THEN
    CREATE TRIGGER trg_handle_care_plan_status_notification
    AFTER UPDATE OF status ON public.client_care_plans
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_care_plan_status_notification();
  END IF;
END;
$$;

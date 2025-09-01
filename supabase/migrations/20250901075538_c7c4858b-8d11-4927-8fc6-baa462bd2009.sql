-- Create safe notification helper function
CREATE OR REPLACE FUNCTION public.safe_notify(
  p_user_id uuid,
  p_branch_id uuid,
  p_type text,
  p_category text,
  p_priority text,
  p_title text,
  p_message text,
  p_data jsonb DEFAULT '{}'::jsonb
) RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only create notification if user exists in auth.users
  IF EXISTS (SELECT 1 FROM auth.users WHERE id = p_user_id) THEN
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
      p_user_id,
      p_branch_id,
      p_type,
      p_category,
      p_priority,
      p_title,
      p_message,
      p_data
    );
    RETURN true;
  END IF;
  RETURN false;
END;
$$;

-- Create care plan notification trigger
CREATE OR REPLACE FUNCTION public.handle_care_plan_status_notification()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  client_record RECORD;
  staff_record RECORD;
  admin_record RECORD;
  notification_title TEXT;
  notification_message TEXT;
BEGIN
  -- Only proceed if status actually changed
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    -- Get client information
    SELECT c.*, b.id as branch_id INTO client_record
    FROM clients c
    JOIN branches b ON c.branch_id = b.id
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
        'care_plan_status',
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
    
    -- Notify admins and assigned staff
    FOR admin_record IN 
      SELECT ab.admin_id
      FROM admin_branches ab
      WHERE ab.branch_id = client_record.branch_id
    LOOP
      PERFORM public.safe_notify(
        admin_record.admin_id,
        client_record.branch_id,
        'care_plan_status',
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
    
    -- Notify assigned staff if care plan has assigned staff
    IF NEW.assigned_staff_id IS NOT NULL THEN
      SELECT s.auth_user_id INTO staff_record
      FROM staff s
      WHERE s.id = NEW.assigned_staff_id;
      
      IF staff_record.auth_user_id IS NOT NULL THEN
        PERFORM public.safe_notify(
          staff_record.auth_user_id,
          client_record.branch_id,
          'care_plan_status',
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
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for care plan status changes
DROP TRIGGER IF EXISTS care_plan_status_notification_trigger ON public.client_care_plans;
CREATE TRIGGER care_plan_status_notification_trigger
  AFTER UPDATE ON public.client_care_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_care_plan_status_notification();

-- Run maintenance functions to fix auth links
SELECT public.fix_staff_auth_links();
SELECT public.fix_client_auth_links();
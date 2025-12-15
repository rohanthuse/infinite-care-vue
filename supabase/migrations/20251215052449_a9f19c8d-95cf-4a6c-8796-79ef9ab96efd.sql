-- Function to handle care plan end date notifications
CREATE OR REPLACE FUNCTION public.handle_care_plan_end_date_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  client_record RECORD;
  admin_record RECORD;
  v_branch_id uuid;
BEGIN
  -- Only trigger if end_date was actually changed (not just any update)
  IF (OLD.end_date IS DISTINCT FROM NEW.end_date) AND NEW.end_date IS NOT NULL THEN
    -- Get client info and branch_id
    SELECT c.first_name, c.last_name, c.branch_id 
    INTO client_record
    FROM public.clients c
    WHERE c.id = NEW.client_id;
    
    v_branch_id := client_record.branch_id;
    
    -- Notify all branch admins
    FOR admin_record IN 
      SELECT ab.admin_id
      FROM public.admin_branches ab
      WHERE ab.branch_id = v_branch_id
    LOOP
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
        admin_record.admin_id,
        v_branch_id,
        'care_plan',
        'warning',
        'high',
        'Care Plan End Date Set - ' || client_record.first_name || ' ' || client_record.last_name,
        'Care plan ' || NEW.display_id || ' for ' || client_record.first_name || ' ' || client_record.last_name || ' is set to end on ' || to_char(NEW.end_date::date, 'DD Mon YYYY'),
        jsonb_build_object(
          'care_plan_id', NEW.id,
          'display_id', NEW.display_id,
          'client_id', NEW.client_id,
          'client_name', client_record.first_name || ' ' || client_record.last_name,
          'end_date', NEW.end_date,
          'action', 'end_date_set'
        )
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Function to handle care plan review date notifications
CREATE OR REPLACE FUNCTION public.handle_care_plan_review_date_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  client_record RECORD;
  admin_record RECORD;
  v_branch_id uuid;
BEGIN
  -- Only trigger if review_date was actually changed (not just any update)
  IF (OLD.review_date IS DISTINCT FROM NEW.review_date) AND NEW.review_date IS NOT NULL THEN
    -- Get client info and branch_id
    SELECT c.first_name, c.last_name, c.branch_id 
    INTO client_record
    FROM public.clients c
    WHERE c.id = NEW.client_id;
    
    v_branch_id := client_record.branch_id;
    
    -- Notify all branch admins
    FOR admin_record IN 
      SELECT ab.admin_id
      FROM public.admin_branches ab
      WHERE ab.branch_id = v_branch_id
    LOOP
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
        admin_record.admin_id,
        v_branch_id,
        'care_plan',
        'info',
        'medium',
        'Care Plan Review Scheduled - ' || client_record.first_name || ' ' || client_record.last_name,
        'Care plan ' || NEW.display_id || ' for ' || client_record.first_name || ' ' || client_record.last_name || ' is scheduled for review on ' || to_char(NEW.review_date::date, 'DD Mon YYYY'),
        jsonb_build_object(
          'care_plan_id', NEW.id,
          'display_id', NEW.display_id,
          'client_id', NEW.client_id,
          'client_name', client_record.first_name || ' ' || client_record.last_name,
          'review_date', NEW.review_date,
          'action', 'review_date_set'
        )
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS care_plan_end_date_notification_trigger ON public.client_care_plans;
DROP TRIGGER IF EXISTS care_plan_review_date_notification_trigger ON public.client_care_plans;

-- Create trigger for end_date changes
CREATE TRIGGER care_plan_end_date_notification_trigger
AFTER UPDATE ON public.client_care_plans
FOR EACH ROW
EXECUTE FUNCTION public.handle_care_plan_end_date_notification();

-- Create trigger for review_date changes
CREATE TRIGGER care_plan_review_date_notification_trigger
AFTER UPDATE ON public.client_care_plans
FOR EACH ROW
EXECUTE FUNCTION public.handle_care_plan_review_date_notification();
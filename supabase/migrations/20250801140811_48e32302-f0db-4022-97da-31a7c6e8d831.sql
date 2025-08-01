-- Create function to notify carers when care plan is approved by client
CREATE OR REPLACE FUNCTION public.notify_carers_on_care_plan_approval()
RETURNS TRIGGER AS $$
DECLARE
  care_plan_record RECORD;
  client_record RECORD;
  staff_record RECORD;
BEGIN
  -- Only proceed if status changed from pending_client_approval to active
  IF OLD.status = 'pending_client_approval' AND NEW.status = 'active' THEN
    
    -- Get care plan and client information
    SELECT ccp.*, c.first_name as client_first_name, c.last_name as client_last_name, c.branch_id
    INTO care_plan_record
    FROM client_care_plans ccp
    JOIN clients c ON ccp.client_id = c.id
    WHERE ccp.id = NEW.id;
    
    -- Create notification for assigned staff member if exists
    IF care_plan_record.assigned_staff_id IS NOT NULL THEN
      SELECT first_name, last_name 
      INTO staff_record
      FROM staff 
      WHERE id = care_plan_record.assigned_staff_id;
      
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
        care_plan_record.assigned_staff_id,
        care_plan_record.branch_id,
        'care_plan',
        'info',
        'high',
        'Care Plan Approved by Client',
        'Care plan for ' || care_plan_record.client_first_name || ' ' || care_plan_record.client_last_name || ' has been approved and is now active.',
        jsonb_build_object(
          'care_plan_id', NEW.id,
          'client_name', care_plan_record.client_first_name || ' ' || care_plan_record.client_last_name,
          'care_plan_type', care_plan_record.care_plan_type,
          'display_id', care_plan_record.display_id,
          'approved_at', NEW.client_acknowledged_at
        )
      );
    END IF;
    
    -- Create notifications for all staff in the same branch
    INSERT INTO public.notifications (
      user_id,
      branch_id,
      type,
      category,
      priority,
      title,
      message,
      data
    )
    SELECT 
      s.id,
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
    FROM staff s
    WHERE s.branch_id = care_plan_record.branch_id 
    AND s.status = 'active'
    AND s.id != COALESCE(care_plan_record.assigned_staff_id, '00000000-0000-0000-0000-000000000000'::uuid);
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for care plan approval notifications
DROP TRIGGER IF EXISTS notify_carers_on_care_plan_approval_trigger ON client_care_plans;
CREATE TRIGGER notify_carers_on_care_plan_approval_trigger
  AFTER UPDATE ON client_care_plans
  FOR EACH ROW
  EXECUTE FUNCTION notify_carers_on_care_plan_approval();
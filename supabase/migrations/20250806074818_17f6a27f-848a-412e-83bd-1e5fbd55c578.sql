-- Fix the notify_carers_on_care_plan_approval function to get branch_id from clients table
CREATE OR REPLACE FUNCTION public.notify_carers_on_care_plan_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  care_plan_record RECORD;
  staff_record RECORD;
  branch_staff_record RECORD;
  client_branch_id UUID;
BEGIN
  -- Only proceed if status changed to 'active'
  IF NEW.status = 'active' AND OLD.status != 'active' THEN
    -- Get care plan details with branch_id from clients table
    SELECT ccp.*, c.branch_id INTO care_plan_record
    FROM client_care_plans ccp
    JOIN clients c ON ccp.client_id = c.id
    WHERE ccp.id = NEW.id;
    
    -- Get the branch_id for easier reference
    client_branch_id := care_plan_record.branch_id;
    
    -- Notify the assigned staff member if one exists
    IF care_plan_record.staff_id IS NOT NULL THEN      
      INSERT INTO notifications (
        user_id,
        branch_id,
        type,
        category,
        priority,
        title,
        message,
        data
      ) VALUES (
        care_plan_record.staff_id,
        client_branch_id,
        'care_plan',
        'info',
        'high',
        'Care Plan Approved',
        'A care plan has been approved by the client and is now active.',
        jsonb_build_object(
          'care_plan_id', care_plan_record.id,
          'client_id', care_plan_record.client_id,
          'care_plan_title', care_plan_record.title
        )
      );
    END IF;
    
    -- Notify all other staff in the branch (excluding the assigned staff)
    FOR branch_staff_record IN 
      SELECT s.id, s.first_name, s.last_name
      FROM staff s
      WHERE s.branch_id = client_branch_id 
        AND s.status = 'active'
        AND s.id != COALESCE(care_plan_record.staff_id, '00000000-0000-0000-0000-000000000000'::uuid)
    LOOP
      INSERT INTO notifications (
        user_id,
        branch_id,
        type,
        category,
        priority,
        title,
        message,
        data
      ) VALUES (
        branch_staff_record.id,
        client_branch_id,
        'care_plan',
        'info',
        'medium',
        'Care Plan Approved',
        'A care plan has been approved by the client and is now active.',
        jsonb_build_object(
          'care_plan_id', care_plan_record.id,
          'client_id', care_plan_record.client_id,
          'care_plan_title', care_plan_record.title
        )
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$function$;
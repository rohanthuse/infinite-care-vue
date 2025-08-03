-- Update the care plan creation workflow to skip staff approval step
-- This migration modifies the default workflow to go directly from admin creation to client approval

-- Update existing care plans that are in pending_approval status to pending_client_approval
-- since we're removing the staff approval step
UPDATE client_care_plans 
SET status = 'pending_client_approval'
WHERE status = 'pending_approval';

-- Update any care plan approval records to reflect the new workflow
UPDATE client_care_plan_approvals 
SET action = 'submitted_for_client_approval',
    comments = CASE 
      WHEN comments = 'Care plan submitted for staff approval' THEN 'Care plan submitted for client approval'
      ELSE comments
    END,
    new_status = 'pending_client_approval'
WHERE action = 'submitted_for_approval' AND new_status = 'pending_approval';
-- Add pending_client_approval to the allowed status values
ALTER TABLE client_care_plans 
DROP CONSTRAINT check_care_plan_status;

ALTER TABLE client_care_plans 
ADD CONSTRAINT check_care_plan_status 
CHECK (status = ANY (ARRAY['draft'::text, 'pending_approval'::text, 'pending_client_approval'::text, 'approved'::text, 'rejected'::text, 'active'::text, 'completed'::text, 'on-hold'::text]));

-- Now update David Wilson's care plan to pending_client_approval
UPDATE client_care_plans 
SET status = 'pending_client_approval',
    updated_at = now()
WHERE id = '8c02b892-11fe-417e-a101-71a0d2d9534c';
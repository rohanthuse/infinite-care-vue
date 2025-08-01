-- Update David Wilson's most recent care plan to pending_client_approval status
UPDATE client_care_plans 
SET status = 'pending_client_approval',
    updated_at = now()
WHERE id = '8c02b892-11fe-417e-a101-71a0d2d9534c';
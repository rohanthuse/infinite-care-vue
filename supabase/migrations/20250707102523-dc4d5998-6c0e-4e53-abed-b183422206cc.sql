-- Update David Wilson's care plans to pending_client_approval status to enable signing workflow
UPDATE public.client_care_plans 
SET status = 'pending_client_approval' 
WHERE client_id = '25942363-5536-4f9c-a61e-1f4592ad2b46';
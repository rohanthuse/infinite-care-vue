-- Update all existing pending service reports to approved status
UPDATE client_service_reports 
SET status = 'approved', updated_at = now() 
WHERE status = 'pending';
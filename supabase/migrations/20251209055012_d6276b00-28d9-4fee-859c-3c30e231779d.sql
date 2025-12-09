-- Update default status for client_service_reports to 'approved' instead of 'pending'
ALTER TABLE client_service_reports 
ALTER COLUMN status SET DEFAULT 'approved';

-- Update default visible_to_client to true
ALTER TABLE client_service_reports 
ALTER COLUMN visible_to_client SET DEFAULT true;

-- Update existing pending/requires_revision reports to approved
UPDATE client_service_reports 
SET status = 'approved', 
    visible_to_client = true, 
    reviewed_at = NOW() 
WHERE status IN ('pending', 'requires_revision');
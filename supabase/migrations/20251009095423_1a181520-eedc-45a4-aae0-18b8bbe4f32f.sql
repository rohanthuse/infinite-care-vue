-- Add branch_id column to client_appointments table
ALTER TABLE client_appointments 
ADD COLUMN IF NOT EXISTS branch_id uuid REFERENCES branches(id);

-- Add index for better query performance
CREATE INDEX IF NOT EXISTS idx_client_appointments_branch_id 
ON client_appointments(branch_id);

-- Backfill existing appointments with branch_id from clients
UPDATE client_appointments ca
SET branch_id = c.branch_id
FROM clients c
WHERE ca.client_id = c.id
AND ca.branch_id IS NULL;
-- Drop the existing foreign key constraint to staff table
ALTER TABLE client_medications 
DROP CONSTRAINT IF EXISTS client_medications_created_by_fkey;

-- Add comment to clarify the column stores auth user ID
COMMENT ON COLUMN client_medications.created_by IS 'Auth user ID (from auth.users) of the person who created this medication';
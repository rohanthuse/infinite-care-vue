-- Set statement timeout for delete_organization_cascade function to 2 minutes
-- This allows the cascade delete to complete for tenants with large amounts of data

ALTER FUNCTION delete_organization_cascade(p_organization_id uuid, p_system_user_id uuid)
SET statement_timeout = '120000'; -- 2 minutes in milliseconds

-- Add helpful comment
COMMENT ON FUNCTION delete_organization_cascade(p_organization_id uuid, p_system_user_id uuid) 
IS 'Cascade deletes an organization and all related data. Has extended timeout (2 minutes) to handle large datasets.';
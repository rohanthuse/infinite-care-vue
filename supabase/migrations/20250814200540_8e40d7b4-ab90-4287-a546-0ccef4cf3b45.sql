-- Add is_primary field to system_user_organizations table
ALTER TABLE public.system_user_organizations 
ADD COLUMN is_primary boolean NOT NULL DEFAULT false;

-- Add unique constraint to ensure only one primary organization per user
CREATE UNIQUE INDEX idx_system_user_organizations_primary 
ON public.system_user_organizations (system_user_id) 
WHERE is_primary = true;

-- Set the first organization as primary for existing users who have organizations
WITH first_org_per_user AS (
  SELECT DISTINCT ON (system_user_id) 
    system_user_id, 
    id
  FROM public.system_user_organizations 
  ORDER BY system_user_id, created_at ASC
)
UPDATE public.system_user_organizations 
SET is_primary = true 
WHERE id IN (SELECT id FROM first_org_per_user);
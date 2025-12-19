-- Drop the existing global unique constraint on title (it's a constraint, not just an index)
ALTER TABLE public.services DROP CONSTRAINT IF EXISTS services_title_key;

-- Create a new composite unique constraint per organization
-- This allows each organization to have their own services with the same title
ALTER TABLE public.services ADD CONSTRAINT services_title_org_key UNIQUE (title, organization_id);
-- Remove subdomain column from organizations table since we're using slug for tenant identification
ALTER TABLE public.organizations DROP COLUMN IF EXISTS subdomain;
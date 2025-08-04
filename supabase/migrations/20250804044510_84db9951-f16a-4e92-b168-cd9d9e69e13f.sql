-- Add fields to track client change requests
ALTER TABLE public.client_care_plans 
ADD COLUMN IF NOT EXISTS changes_requested_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS changes_requested_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS change_request_comments TEXT;
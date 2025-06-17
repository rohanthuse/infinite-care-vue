
-- Add approval workflow fields to client_care_plans table (excluding status which already exists)
ALTER TABLE public.client_care_plans 
ADD COLUMN created_by_staff_id uuid REFERENCES public.staff(id),
ADD COLUMN approved_by uuid REFERENCES public.staff(id),
ADD COLUMN approved_at timestamp with time zone,
ADD COLUMN rejection_reason text;

-- Update the existing status column to ensure it has proper default and constraint
-- First, update any NULL status values to 'draft'
UPDATE public.client_care_plans SET status = 'draft' WHERE status IS NULL;

-- Add constraint to ensure status is one of the allowed values (drop first if it exists)
ALTER TABLE public.client_care_plans DROP CONSTRAINT IF EXISTS check_care_plan_status;
ALTER TABLE public.client_care_plans 
ADD CONSTRAINT check_care_plan_status 
CHECK (status IN ('draft', 'pending_approval', 'approved', 'rejected', 'active', 'completed', 'on-hold'));

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_client_care_plans_status ON public.client_care_plans(status);
CREATE INDEX IF NOT EXISTS idx_client_care_plans_created_by ON public.client_care_plans(created_by_staff_id);
CREATE INDEX IF NOT EXISTS idx_client_care_plans_approved_by ON public.client_care_plans(approved_by);

-- Add some additional fields we'll need for a comprehensive care plan
ALTER TABLE public.client_care_plans
ADD COLUMN care_plan_type text DEFAULT 'standard',
ADD COLUMN priority text DEFAULT 'medium',
ADD COLUMN notes text;

-- Create a table for care plan approvals history (audit trail)
CREATE TABLE IF NOT EXISTS public.client_care_plan_approvals (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    care_plan_id uuid NOT NULL REFERENCES public.client_care_plans(id) ON DELETE CASCADE,
    action text NOT NULL, -- 'approved', 'rejected', 'submitted_for_approval'
    performed_by uuid NOT NULL REFERENCES public.staff(id),
    performed_at timestamp with time zone NOT NULL DEFAULT now(),
    comments text,
    previous_status text,
    new_status text,
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add RLS policies for the new table
ALTER TABLE public.client_care_plan_approvals ENABLE ROW LEVEL SECURITY;

-- Create policies (drop first if they exist)
DROP POLICY IF EXISTS "Allow authenticated users to view approval records" ON public.client_care_plan_approvals;
DROP POLICY IF EXISTS "Allow staff to insert approval records" ON public.client_care_plan_approvals;

CREATE POLICY "Allow authenticated users to view approval records" 
ON public.client_care_plan_approvals 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow staff to insert approval records" 
ON public.client_care_plan_approvals 
FOR INSERT 
TO authenticated 
WITH CHECK (true);

-- Add indexes for the approvals table
CREATE INDEX IF NOT EXISTS idx_care_plan_approvals_care_plan_id ON public.client_care_plan_approvals(care_plan_id);
CREATE INDEX IF NOT EXISTS idx_care_plan_approvals_performed_by ON public.client_care_plan_approvals(performed_by);
CREATE INDEX IF NOT EXISTS idx_care_plan_approvals_action ON public.client_care_plan_approvals(action);

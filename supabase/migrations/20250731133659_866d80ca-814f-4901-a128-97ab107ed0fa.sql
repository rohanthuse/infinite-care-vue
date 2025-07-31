-- Add missing columns to client_care_plans table
ALTER TABLE public.client_care_plans 
ADD COLUMN IF NOT EXISTS finalized_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS finalized_by uuid;

-- Add comment to clarify the finalized_by column references auth.users
COMMENT ON COLUMN public.client_care_plans.finalized_by IS 'References auth.users.id - user who finalized the care plan';

-- Update RLS policy to allow viewing finalized_by information
DROP POLICY IF EXISTS "Users can view care plans for their branch clients" ON public.client_care_plans;
CREATE POLICY "Users can view care plans for their branch clients" 
ON public.client_care_plans 
FOR SELECT 
USING (
  -- Super admins can see all
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin') OR
  -- Branch admins can see care plans for clients in their branches
  EXISTS (
    SELECT 1 FROM public.admin_branches ab 
    JOIN public.clients c ON ab.branch_id = c.branch_id 
    WHERE ab.admin_id = auth.uid() AND c.id = client_care_plans.client_id
  ) OR
  -- Staff can see care plans for clients in their branch
  EXISTS (
    SELECT 1 FROM public.staff s 
    JOIN public.clients c ON s.branch_id = c.branch_id 
    WHERE s.id = auth.uid() AND c.id = client_care_plans.client_id
  ) OR
  -- Clients can see their own care plans
  EXISTS (
    SELECT 1 FROM public.clients c 
    WHERE c.auth_user_id = auth.uid() AND c.id = client_care_plans.client_id
  )
);
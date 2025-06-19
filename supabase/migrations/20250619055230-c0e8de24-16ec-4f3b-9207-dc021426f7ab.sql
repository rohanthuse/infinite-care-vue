
-- Add care_plan_id and performed_by_id columns to client_assessments table
ALTER TABLE public.client_assessments 
ADD COLUMN IF NOT EXISTS care_plan_id uuid REFERENCES public.client_care_plans(id),
ADD COLUMN IF NOT EXISTS performed_by_id uuid REFERENCES public.profiles(id);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_client_assessments_care_plan_id ON public.client_assessments(care_plan_id);
CREATE INDEX IF NOT EXISTS idx_client_assessments_performed_by_id ON public.client_assessments(performed_by_id);

-- Update RLS policies for role-based access
DROP POLICY IF EXISTS "Allow authenticated users to read client assessments" ON public.client_assessments;
DROP POLICY IF EXISTS "Users can view assessments" ON public.client_assessments;
DROP POLICY IF EXISTS "Users can create assessments" ON public.client_assessments;
DROP POLICY IF EXISTS "Users can update assessments" ON public.client_assessments;

-- Admins can view all assessments
CREATE POLICY "Admins can view all assessments" 
ON public.client_assessments 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Carers can view assessments they performed or are assigned to
CREATE POLICY "Carers can view their assessments" 
ON public.client_assessments 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'carer'
  ) AND (
    performed_by_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.client_id = client_assessments.client_id 
      AND b.staff_id = auth.uid()
    )
  )
);

-- Clients can view their own assessments
CREATE POLICY "Clients can view their assessments" 
ON public.client_assessments 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'client'
  ) AND EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.id = client_assessments.client_id 
    AND c.id = auth.uid()
  )
);

-- Admins and carers can create assessments
CREATE POLICY "Admins and carers can create assessments" 
ON public.client_assessments 
FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role IN ('admin', 'carer')
  )
);

-- Admins and the performing carer can update assessments
CREATE POLICY "Admins and performing carers can update assessments" 
ON public.client_assessments 
FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) OR (
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'carer'
    ) AND performed_by_id = auth.uid()
  )
);

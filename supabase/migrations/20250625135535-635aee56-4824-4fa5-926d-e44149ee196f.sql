
-- Add SELECT policies for news2_patients table
CREATE POLICY "Branch staff can select news2 patients" 
ON public.news2_patients 
FOR SELECT 
USING (
  branch_id IN (
    SELECT branch_id FROM public.staff WHERE id = auth.uid()
    UNION
    SELECT branch_id FROM public.admin_branches WHERE admin_id = auth.uid()
  )
  OR
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

-- Add SELECT policies for news2_alerts table
CREATE POLICY "Branch staff can select news2 alerts" 
ON public.news2_alerts 
FOR SELECT 
USING (
  news2_patient_id IN (
    SELECT id FROM public.news2_patients WHERE branch_id IN (
      SELECT branch_id FROM public.staff WHERE id = auth.uid()
      UNION
      SELECT branch_id FROM public.admin_branches WHERE admin_id = auth.uid()
    )
  )
  OR
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

-- Add SELECT policies for news2_observations table (for completeness)
CREATE POLICY "Branch staff can select news2 observations" 
ON public.news2_observations 
FOR SELECT 
USING (
  news2_patient_id IN (
    SELECT id FROM public.news2_patients WHERE branch_id IN (
      SELECT branch_id FROM public.staff WHERE id = auth.uid()
      UNION
      SELECT branch_id FROM public.admin_branches WHERE admin_id = auth.uid()
    )
  )
  OR
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'super_admin'
  )
);

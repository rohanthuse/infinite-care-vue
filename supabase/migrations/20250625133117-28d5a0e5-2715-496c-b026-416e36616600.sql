
-- Allow branch staff to insert alerts for patients in their branch
CREATE POLICY "Branch staff can insert news2 alerts" 
ON public.news2_alerts 
FOR INSERT 
WITH CHECK (
  news2_patient_id IN (
    SELECT id FROM public.news2_patients WHERE branch_id IN (
      SELECT branch_id FROM public.staff WHERE id = auth.uid()
      UNION
      SELECT branch_id FROM public.admin_branches WHERE admin_id = auth.uid()
    )
  )
);

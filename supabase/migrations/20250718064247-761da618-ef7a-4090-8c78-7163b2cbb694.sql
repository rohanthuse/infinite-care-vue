-- Add RLS policies to allow clients to view their own NEWS2 data

-- Policy for clients to view their own NEWS2 patient records
CREATE POLICY "Clients can view their own news2 patients" 
ON public.news2_patients 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.id = news2_patients.client_id 
    AND c.auth_user_id = auth.uid()
  )
);

-- Policy for clients to view their own NEWS2 observations
CREATE POLICY "Clients can view their own news2 observations" 
ON public.news2_observations 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.news2_patients np
    JOIN public.clients c ON c.id = np.client_id
    WHERE np.id = news2_observations.news2_patient_id 
    AND c.auth_user_id = auth.uid()
  )
);
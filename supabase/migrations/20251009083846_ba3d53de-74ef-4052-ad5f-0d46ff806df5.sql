-- Add RLS policies to allow admins to manage client appointments

-- Allow super admins and branch admins to create client appointments
CREATE POLICY "Admins can create client appointments"
ON public.client_appointments
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role) 
  OR EXISTS (
    SELECT 1 
    FROM public.clients c
    JOIN public.admin_branches ab ON c.branch_id = ab.branch_id
    WHERE c.id = client_appointments.client_id 
    AND ab.admin_id = auth.uid()
  )
);

-- Allow super admins and branch admins to update client appointments
CREATE POLICY "Admins can update client appointments"
ON public.client_appointments
FOR UPDATE
TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role) 
  OR EXISTS (
    SELECT 1 
    FROM public.clients c
    JOIN public.admin_branches ab ON c.branch_id = ab.branch_id
    WHERE c.id = client_appointments.client_id 
    AND ab.admin_id = auth.uid()
  )
)
WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role) 
  OR EXISTS (
    SELECT 1 
    FROM public.clients c
    JOIN public.admin_branches ab ON c.branch_id = ab.branch_id
    WHERE c.id = client_appointments.client_id 
    AND ab.admin_id = auth.uid()
  )
);

-- Allow super admins and branch admins to view client appointments
CREATE POLICY "Admins can view client appointments"
ON public.client_appointments
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role) 
  OR EXISTS (
    SELECT 1 
    FROM public.clients c
    JOIN public.admin_branches ab ON c.branch_id = ab.branch_id
    WHERE c.id = client_appointments.client_id 
    AND ab.admin_id = auth.uid()
  )
);

-- Allow super admins and branch admins to delete client appointments
CREATE POLICY "Admins can delete client appointments"
ON public.client_appointments
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'super_admin'::app_role) 
  OR EXISTS (
    SELECT 1 
    FROM public.clients c
    JOIN public.admin_branches ab ON c.branch_id = ab.branch_id
    WHERE c.id = client_appointments.client_id 
    AND ab.admin_id = auth.uid()
  )
);
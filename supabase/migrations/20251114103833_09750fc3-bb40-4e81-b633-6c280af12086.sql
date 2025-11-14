-- Fix RLS policies for fluid_intake_records to allow staff members to insert records
DROP POLICY IF EXISTS "Staff can insert fluid intake records for their branch clients" ON public.fluid_intake_records;

CREATE POLICY "Admins and staff can insert fluid intake records"
ON public.fluid_intake_records
FOR INSERT
WITH CHECK (
  -- Super admins can insert for any client
  public.has_role(auth.uid(), 'super_admin'::app_role)
  OR
  -- Branch admins can insert for their branch clients
  EXISTS (
    SELECT 1 
    FROM public.clients c 
    JOIN public.admin_branches ab ON (ab.branch_id = c.branch_id)
    WHERE c.id = fluid_intake_records.client_id 
    AND ab.admin_id = auth.uid()
  )
  OR
  -- Staff members can insert for clients in their branch
  EXISTS (
    SELECT 1
    FROM public.clients c
    JOIN public.staff s ON (s.branch_id = c.branch_id)
    WHERE c.id = fluid_intake_records.client_id
    AND s.auth_user_id = auth.uid()
  )
);

-- Fix RLS policies for fluid_output_records to allow staff members to insert records
DROP POLICY IF EXISTS "Staff can insert fluid output records for their branch clients" ON public.fluid_output_records;

CREATE POLICY "Admins and staff can insert fluid output records"
ON public.fluid_output_records
FOR INSERT
WITH CHECK (
  -- Super admins can insert for any client
  public.has_role(auth.uid(), 'super_admin'::app_role)
  OR
  -- Branch admins can insert for their branch clients
  EXISTS (
    SELECT 1 
    FROM public.clients c 
    JOIN public.admin_branches ab ON (ab.branch_id = c.branch_id)
    WHERE c.id = fluid_output_records.client_id 
    AND ab.admin_id = auth.uid()
  )
  OR
  -- Staff members can insert for clients in their branch
  EXISTS (
    SELECT 1
    FROM public.clients c
    JOIN public.staff s ON (s.branch_id = c.branch_id)
    WHERE c.id = fluid_output_records.client_id
    AND s.auth_user_id = auth.uid()
  )
);
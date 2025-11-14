-- Fix RLS policies for urinary_output_records table to allow staff access
-- Drop old restrictive policies
DROP POLICY IF EXISTS "Staff can view urinary output records for their branch clients" ON public.urinary_output_records;
DROP POLICY IF EXISTS "Staff can insert urinary output records for their branch client" ON public.urinary_output_records;
DROP POLICY IF EXISTS "Staff can update urinary output records for their branch client" ON public.urinary_output_records;
DROP POLICY IF EXISTS "Staff can delete urinary output records for their branch client" ON public.urinary_output_records;

-- Create new comprehensive policies using the security definer function
CREATE POLICY "Staff can view urinary output records"
ON public.urinary_output_records
FOR SELECT
USING (
  public.can_access_client_data(auth.uid(), client_id)
);

CREATE POLICY "Staff can insert urinary output records"
ON public.urinary_output_records
FOR INSERT
WITH CHECK (
  public.can_access_client_data(auth.uid(), client_id)
);

CREATE POLICY "Staff can update urinary output records"
ON public.urinary_output_records
FOR UPDATE
USING (
  public.can_access_client_data(auth.uid(), client_id)
);

CREATE POLICY "Staff can delete urinary output records"
ON public.urinary_output_records
FOR DELETE
USING (
  public.can_access_client_data(auth.uid(), client_id)
);
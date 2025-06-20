
-- Add comprehensive RLS policies for client_care_plans table to allow authenticated users to perform all operations

-- Allow authenticated users to insert client care plans
CREATE POLICY "Allow authenticated users to insert client care plans" ON public.client_care_plans
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update client care plans
CREATE POLICY "Allow authenticated users to update client care plans" ON public.client_care_plans
  FOR UPDATE TO authenticated
  USING (true);

-- Allow authenticated users to delete client care plans
CREATE POLICY "Allow authenticated users to delete client care plans" ON public.client_care_plans
  FOR DELETE TO authenticated
  USING (true);

-- Also ensure there's a SELECT policy for authenticated users
CREATE POLICY "Allow authenticated users to select client care plans" ON public.client_care_plans
  FOR SELECT TO authenticated
  USING (true);

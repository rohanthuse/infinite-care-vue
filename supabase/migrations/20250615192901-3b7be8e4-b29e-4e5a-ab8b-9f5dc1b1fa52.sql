
-- 1. Allow super admins to INSERT bookings for any branch;
--    regular admins must have access via admin_branches

DROP POLICY IF EXISTS "Users can insert bookings for their branches" ON public.bookings;
CREATE POLICY "Users and Super Admins can insert bookings" 
  ON public.bookings 
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin')
    OR EXISTS (
      SELECT 1 FROM public.admin_branches ab 
      WHERE ab.branch_id = bookings.branch_id 
      AND ab.admin_id = auth.uid()
    )
  );

-- 2. Allow super admins to UPDATE bookings for any branch
DROP POLICY IF EXISTS "Users can update bookings for their branches" ON public.bookings;
CREATE POLICY "Users and Super Admins can update bookings" 
  ON public.bookings 
  FOR UPDATE 
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR EXISTS (
      SELECT 1 FROM public.admin_branches ab 
      WHERE ab.branch_id = bookings.branch_id 
      AND ab.admin_id = auth.uid()
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin')
    OR EXISTS (
      SELECT 1 FROM public.admin_branches ab 
      WHERE ab.branch_id = bookings.branch_id 
      AND ab.admin_id = auth.uid()
    )
  );

-- 3. Allow super admins to DELETE bookings for any branch
DROP POLICY IF EXISTS "Users can delete bookings for their branches" ON public.bookings;
CREATE POLICY "Users and Super Admins can delete bookings" 
  ON public.bookings 
  FOR DELETE 
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR EXISTS (
      SELECT 1 FROM public.admin_branches ab 
      WHERE ab.branch_id = bookings.branch_id 
      AND ab.admin_id = auth.uid()
    )
  );

-- 4. (Optional/improvement) Allow super admins AND branch admins to SELECT bookings for their branches
DROP POLICY IF EXISTS "Enable read access for all users" ON public.bookings;
CREATE POLICY "Users and Super Admins can read bookings" 
  ON public.bookings 
  FOR SELECT 
  TO authenticated
  USING (
    public.has_role(auth.uid(), 'super_admin')
    OR EXISTS (
      SELECT 1 FROM public.admin_branches ab 
      WHERE ab.branch_id = bookings.branch_id 
      AND ab.admin_id = auth.uid()
    )
  );

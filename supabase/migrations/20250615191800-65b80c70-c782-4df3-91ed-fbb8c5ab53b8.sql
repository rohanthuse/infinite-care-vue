
-- Add RLS policies for INSERT, UPDATE, and DELETE operations on bookings table

-- Policy for INSERT: Allow authenticated users to create bookings for branches they have access to
CREATE POLICY "Users can insert bookings for their branches" 
ON public.bookings 
FOR INSERT 
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_branches ab 
    WHERE ab.branch_id = bookings.branch_id 
    AND ab.admin_id = auth.uid()
  )
);

-- Policy for UPDATE: Allow authenticated users to update bookings for branches they have access to
CREATE POLICY "Users can update bookings for their branches" 
ON public.bookings 
FOR UPDATE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_branches ab 
    WHERE ab.branch_id = bookings.branch_id 
    AND ab.admin_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_branches ab 
    WHERE ab.branch_id = bookings.branch_id 
    AND ab.admin_id = auth.uid()
  )
);

-- Policy for DELETE: Allow authenticated users to delete bookings for branches they have access to
CREATE POLICY "Users can delete bookings for their branches" 
ON public.bookings 
FOR DELETE 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.admin_branches ab 
    WHERE ab.branch_id = bookings.branch_id 
    AND ab.admin_id = auth.uid()
  )
);

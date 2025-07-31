-- Add RLS policy for staff to update their assigned bookings
CREATE POLICY "Staff can update their assigned bookings" 
ON public.bookings 
FOR UPDATE 
USING (staff_id = auth.uid())
WITH CHECK (staff_id = auth.uid());

-- Add RLS policy for staff to view their assigned bookings (if not exists)
CREATE POLICY "Staff can view their assigned bookings" 
ON public.bookings 
FOR SELECT 
USING (staff_id = auth.uid());

-- Ensure visit records can be updated by assigned staff
CREATE POLICY "Staff can update visit records for their bookings" 
ON public.visit_records 
FOR UPDATE 
USING (booking_id IN (
  SELECT id FROM public.bookings WHERE staff_id = auth.uid()
));

-- Ensure visit records can be viewed by assigned staff
CREATE POLICY "Staff can view visit records for their bookings" 
ON public.visit_records 
FOR SELECT 
USING (booking_id IN (
  SELECT id FROM public.bookings WHERE staff_id = auth.uid()
));
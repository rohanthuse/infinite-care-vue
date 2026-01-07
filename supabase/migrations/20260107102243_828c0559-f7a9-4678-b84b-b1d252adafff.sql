-- Fix the Staff SELECT policy on bookings
-- The current policy checks staff_id = auth.uid(), but bookings.staff_id stores staff.id (not auth.uid())
-- This causes carers to see 0 past appointments

-- Drop the incorrect policy
DROP POLICY IF EXISTS "Staff can view their assigned bookings" ON public.bookings;

-- Create corrected policy that checks both auth.uid() and staff.auth_user_id
CREATE POLICY "Staff can view their assigned bookings" 
ON public.bookings 
FOR SELECT 
USING (
  staff_id = auth.uid() 
  OR staff_id IN (SELECT id FROM public.staff WHERE auth_user_id = auth.uid())
);
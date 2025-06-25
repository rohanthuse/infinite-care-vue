
-- Add RLS policy to allow clients to update their own bookings
CREATE POLICY "Clients can update their own bookings" ON public.bookings
  FOR UPDATE 
  USING (
    client_id IN (
      SELECT id FROM public.clients 
      WHERE id = client_id 
      AND auth.uid() IS NOT NULL
    )
  )
  WITH CHECK (
    client_id IN (
      SELECT id FROM public.clients 
      WHERE id = client_id 
      AND auth.uid() IS NOT NULL
    )
  );

-- Also add a policy to allow clients to view their own bookings for the reschedule functionality
CREATE POLICY "Clients can view their own bookings" ON public.bookings
  FOR SELECT 
  USING (
    client_id IN (
      SELECT id FROM public.clients 
      WHERE id = client_id
    )
  );

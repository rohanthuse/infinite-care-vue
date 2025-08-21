
-- Fix client read access for bookings while keeping other admin/staff policies intact

-- 1) Ensure RLS is enabled (it already is in your project)
-- ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- 2) Remove the permissive/incorrect client read policy if present
DROP POLICY IF EXISTS "Clients can view their own bookings" ON public.bookings;

-- 3) Add a strict client read policy tied to auth.uid()
CREATE POLICY "Clients can view their own bookings"
  ON public.bookings
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.clients c
      WHERE c.id = bookings.client_id
        AND c.auth_user_id = auth.uid()
    )
  );

-- Drop the existing policy that's missing WITH CHECK
DROP POLICY IF EXISTS "Users can manage client addresses in their branch" ON public.client_addresses;

-- Recreate with proper WITH CHECK clause for INSERT operations
CREATE POLICY "Users can manage client addresses in their branch"
ON public.client_addresses FOR ALL
USING (
  (client_id IN (
    SELECT c.id FROM public.clients c
    WHERE c.branch_id IN (
      SELECT ab.branch_id FROM public.admin_branches ab WHERE ab.admin_id = auth.uid()
      UNION
      SELECT s.branch_id FROM public.staff s WHERE s.auth_user_id = auth.uid()
    )
  ))
  OR
  (client_id IN (
    SELECT c.id FROM public.clients c WHERE c.auth_user_id = auth.uid()
  ))
)
WITH CHECK (
  (client_id IN (
    SELECT c.id FROM public.clients c
    WHERE c.branch_id IN (
      SELECT ab.branch_id FROM public.admin_branches ab WHERE ab.admin_id = auth.uid()
      UNION
      SELECT s.branch_id FROM public.staff s WHERE s.auth_user_id = auth.uid()
    )
  ))
  OR
  (client_id IN (
    SELECT c.id FROM public.clients c WHERE c.auth_user_id = auth.uid()
  ))
);
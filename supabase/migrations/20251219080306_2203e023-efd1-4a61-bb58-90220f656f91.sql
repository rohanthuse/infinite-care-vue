-- Drop existing policy
DROP POLICY IF EXISTS "Users can manage client addresses in their branch" ON public.client_addresses;

-- Recreate with super_admin access included
CREATE POLICY "Users can manage client addresses in their branch"
ON public.client_addresses FOR ALL
USING (
  -- Super admins have full access
  public.has_role(auth.uid(), 'super_admin')
  OR
  -- Branch admins/staff can access their clients
  (client_id IN (
    SELECT c.id FROM public.clients c
    WHERE c.branch_id IN (
      SELECT ab.branch_id FROM public.admin_branches ab WHERE ab.admin_id = auth.uid()
      UNION
      SELECT s.branch_id FROM public.staff s WHERE s.auth_user_id = auth.uid()
    )
  ))
  OR
  -- Clients can manage their own addresses
  (client_id IN (
    SELECT c.id FROM public.clients c WHERE c.auth_user_id = auth.uid()
  ))
)
WITH CHECK (
  -- Super admins have full access
  public.has_role(auth.uid(), 'super_admin')
  OR
  -- Branch admins/staff can manage addresses for their clients
  (client_id IN (
    SELECT c.id FROM public.clients c
    WHERE c.branch_id IN (
      SELECT ab.branch_id FROM public.admin_branches ab WHERE ab.admin_id = auth.uid()
      UNION
      SELECT s.branch_id FROM public.staff s WHERE s.auth_user_id = auth.uid()
    )
  ))
  OR
  -- Clients can manage their own addresses
  (client_id IN (
    SELECT c.id FROM public.clients c WHERE c.auth_user_id = auth.uid()
  ))
);
-- Add RLS policies for document visibility based on access_level

-- Policy: Clients can view branch-level documents
CREATE POLICY "Clients can view branch documents" ON public.documents
FOR SELECT USING (
  access_level = 'branch' AND
  status = 'active' AND
  branch_id IN (
    SELECT c.branch_id FROM public.clients c WHERE c.auth_user_id = auth.uid()
  )
);

-- Policy: Clients can view public/organization-level documents  
CREATE POLICY "Clients can view public documents" ON public.documents
FOR SELECT USING (
  access_level = 'public' AND
  status = 'active'
);

-- Policy: Staff can view branch-level documents
CREATE POLICY "Staff can view branch documents" ON public.documents
FOR SELECT USING (
  access_level = 'branch' AND
  status = 'active' AND
  branch_id IN (
    SELECT s.branch_id FROM public.staff s WHERE s.auth_user_id = auth.uid()
  )
);

-- Policy: Staff can view public/organization-level documents
CREATE POLICY "Staff can view public documents" ON public.documents
FOR SELECT USING (
  access_level = 'public' AND
  status = 'active'
);
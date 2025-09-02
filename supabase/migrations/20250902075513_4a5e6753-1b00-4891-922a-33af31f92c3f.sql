
-- Allow clients and staff to view only their own agreements

-- Clients can view agreements that are specifically for them
CREATE POLICY "Clients can view their own agreements"
ON public.agreements
FOR SELECT
USING (
  signing_party = 'client'
  AND signed_by_client_id = auth.uid()
);

-- Staff can view agreements that are specifically for them
CREATE POLICY "Staff can view their own agreements"
ON public.agreements
FOR SELECT
USING (
  signing_party = 'staff'
  AND signed_by_staff_id = auth.uid()
);

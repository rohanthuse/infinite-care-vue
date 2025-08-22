-- Add RLS policies for clients and staff to read documents shared with them
CREATE POLICY "Clients can view documents shared with them" 
ON public.documents 
FOR SELECT 
USING (
  client_id IN (
    SELECT c.id FROM public.clients c 
    WHERE c.auth_user_id = auth.uid()
  )
);

CREATE POLICY "Staff can view documents shared with them" 
ON public.documents 
FOR SELECT 
USING (
  staff_id IN (
    SELECT s.id FROM public.staff s 
    WHERE s.auth_user_id = auth.uid()
  )
);
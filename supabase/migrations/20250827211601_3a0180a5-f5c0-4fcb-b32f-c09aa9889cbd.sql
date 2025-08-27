-- Add client visibility columns to tasks table
ALTER TABLE public.tasks 
ADD COLUMN client_visible boolean DEFAULT false,
ADD COLUMN client_can_complete boolean DEFAULT false;

-- Add RLS policy for clients to view their assigned tasks
CREATE POLICY "Clients can view their assigned tasks" 
ON public.tasks 
FOR SELECT 
TO authenticated
USING (
  client_visible = true 
  AND client_id IN (
    SELECT id FROM public.clients 
    WHERE auth_user_id = auth.uid()
  )
);

-- Add RLS policy for clients to update completion status of their tasks (if allowed)
CREATE POLICY "Clients can complete their assigned tasks" 
ON public.tasks 
FOR UPDATE 
TO authenticated
USING (
  client_visible = true 
  AND client_can_complete = true 
  AND client_id IN (
    SELECT id FROM public.clients 
    WHERE auth_user_id = auth.uid()
  )
)
WITH CHECK (
  client_visible = true 
  AND client_can_complete = true 
  AND client_id IN (
    SELECT id FROM public.clients 
    WHERE auth_user_id = auth.uid()
  )
);
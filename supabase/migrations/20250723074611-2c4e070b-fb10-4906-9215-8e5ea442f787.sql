
-- Add RLS policy to allow clients to insert message participants when creating threads
CREATE POLICY "Clients can add participants to threads they create" 
ON public.message_participants 
FOR INSERT 
TO authenticated 
WITH CHECK (
  -- Allow if the user is creating a thread (they are the creator)
  EXISTS (
    SELECT 1 FROM public.message_threads 
    WHERE id = message_participants.thread_id 
    AND created_by = auth.uid()
  ) OR
  -- Allow if the user is adding themselves as a participant
  user_id = auth.uid()
);

-- Also ensure clients can create message threads
-- (This policy may already exist but let's make sure it's comprehensive)
DROP POLICY IF EXISTS "Clients can create message threads" ON public.message_threads;

CREATE POLICY "Clients can create message threads" 
ON public.message_threads 
FOR INSERT 
TO authenticated 
WITH CHECK (
  created_by = auth.uid() AND
  -- Ensure the user has client role
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'client'
  )
);

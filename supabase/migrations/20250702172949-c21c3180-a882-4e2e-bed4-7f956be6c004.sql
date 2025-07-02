-- Remove the specific problematic policies causing infinite recursion

-- Drop the old policy that uses can_access_thread() function (causes recursion)
DROP POLICY IF EXISTS "Users can view participants in accessible threads" ON public.message_participants;

-- Drop any duplicate INSERT policies
DROP POLICY IF EXISTS "Users can add participants to threads they created" ON public.message_participants;
DROP POLICY IF EXISTS "Users can add participants to accessible threads" ON public.message_participants;

-- Ensure we have clean policies (recreate if needed)
DROP POLICY IF EXISTS "Users can view participants" ON public.message_participants;
DROP POLICY IF EXISTS "Thread creators can add participants" ON public.message_participants;

-- Create clean, non-recursive SELECT policy
CREATE POLICY "Users can view participants" 
ON public.message_participants 
FOR SELECT 
TO authenticated 
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.message_threads 
    WHERE id = message_participants.thread_id AND created_by = auth.uid()
  )
);

-- Create clean, non-recursive INSERT policy  
CREATE POLICY "Thread creators can add participants" 
ON public.message_participants 
FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.message_threads 
    WHERE id = message_participants.thread_id AND created_by = auth.uid()
  )
);
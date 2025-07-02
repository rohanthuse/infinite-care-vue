-- Fix infinite recursion by cleaning up all conflicting RLS policies on message_participants

-- Drop ALL existing policies on message_participants to remove conflicts
DROP POLICY IF EXISTS "Users can view participants of threads they're in" ON public.message_participants;
DROP POLICY IF EXISTS "Users can view participants of accessible threads" ON public.message_participants; 
DROP POLICY IF EXISTS "Thread creators can add participants" ON public.message_participants;
DROP POLICY IF EXISTS "Users can add participants to accessible threads" ON public.message_participants;
DROP POLICY IF EXISTS "Users can view participants of accessible threads" ON public.message_participants;

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
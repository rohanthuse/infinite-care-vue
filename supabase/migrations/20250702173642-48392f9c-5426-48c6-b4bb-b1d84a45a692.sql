-- Complete fix for message_participants infinite recursion

-- Drop ALL existing problematic policies on message_participants
DROP POLICY IF EXISTS "Users can view participants in their threads" ON public.message_participants;
DROP POLICY IF EXISTS "Users can add participants to threads they created" ON public.message_participants;
DROP POLICY IF EXISTS "Users can view participants of threads they're in" ON public.message_participants;
DROP POLICY IF EXISTS "Users can view participants of accessible threads" ON public.message_participants;
DROP POLICY IF EXISTS "Thread creators can add participants" ON public.message_participants;
DROP POLICY IF EXISTS "Users can add participants to accessible threads" ON public.message_participants;
DROP POLICY IF EXISTS "Users can view participants in accessible threads" ON public.message_participants;
DROP POLICY IF EXISTS "Users can view participants" ON public.message_participants;

-- Create clean, non-recursive policies for message_participants
-- Policy 1: Users can view participants of threads they created
CREATE POLICY "Thread creators can view participants" 
ON public.message_participants 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.message_threads 
    WHERE id = message_participants.thread_id 
    AND created_by = auth.uid()
  )
);

-- Policy 2: Users can view their own participation records
CREATE POLICY "Users can view their own participation" 
ON public.message_participants 
FOR SELECT 
TO authenticated 
USING (user_id = auth.uid());

-- Policy 3: Thread creators can add participants
CREATE POLICY "Thread creators can add participants" 
ON public.message_participants 
FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.message_threads 
    WHERE id = message_participants.thread_id 
    AND created_by = auth.uid()
  )
);

-- Policy 4: Thread creators can remove participants  
CREATE POLICY "Thread creators can remove participants" 
ON public.message_participants 
FOR DELETE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.message_threads 
    WHERE id = message_participants.thread_id 
    AND created_by = auth.uid()
  )
);
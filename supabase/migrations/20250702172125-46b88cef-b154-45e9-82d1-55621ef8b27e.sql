-- Fix infinite recursion in message_participants RLS policy

-- Drop the problematic policy that causes infinite recursion
DROP POLICY IF EXISTS "Users can view participants of threads they're in" ON public.message_participants;

-- Create a simplified policy without the recursive self-reference
CREATE POLICY "Users can view participants of threads they're in" 
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
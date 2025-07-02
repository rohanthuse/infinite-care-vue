-- Complete fix for infinite recursion by removing ALL circular policy dependencies

-- Create security definer function to safely check thread participation
CREATE OR REPLACE FUNCTION public.is_thread_participant_safe(thread_id_param uuid, user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $function$
BEGIN
  -- Direct query without RLS to avoid recursion
  RETURN EXISTS (
    SELECT 1 FROM public.message_participants 
    WHERE thread_id = thread_id_param 
    AND user_id = user_id_param
  );
END;
$function$;

-- Drop ALL existing policies that create circular dependencies
DROP POLICY IF EXISTS "Users can view their own threads or threads they participate in" ON public.message_threads;
DROP POLICY IF EXISTS "Thread participants can send messages" ON public.messages;
DROP POLICY IF EXISTS "Thread participants can view messages" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages to threads they participate in" ON public.messages;
DROP POLICY IF EXISTS "Users can view messages from threads they participate in" ON public.messages;

-- Create new non-recursive policies for message_threads
CREATE POLICY "Thread creators can view their threads" 
ON public.message_threads 
FOR SELECT 
TO authenticated 
USING (created_by = auth.uid());

CREATE POLICY "Thread participants can view threads" 
ON public.message_threads 
FOR SELECT 
TO authenticated 
USING (public.is_thread_participant_safe(id, auth.uid()));

-- Create new non-recursive policies for messages
CREATE POLICY "Thread creators can send messages" 
ON public.messages 
FOR INSERT 
TO authenticated 
WITH CHECK (
  sender_id = auth.uid() AND (
    EXISTS (
      SELECT 1 FROM public.message_threads 
      WHERE id = messages.thread_id AND created_by = auth.uid()
    )
  )
);

CREATE POLICY "Thread participants can send messages" 
ON public.messages 
FOR INSERT 
TO authenticated 
WITH CHECK (
  sender_id = auth.uid() AND public.is_thread_participant_safe(thread_id, auth.uid())
);

CREATE POLICY "Thread creators can view messages" 
ON public.messages 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.message_threads 
    WHERE id = messages.thread_id AND created_by = auth.uid()
  )
);

CREATE POLICY "Thread participants can view messages" 
ON public.messages 
FOR SELECT 
TO authenticated 
USING (public.is_thread_participant_safe(thread_id, auth.uid()));
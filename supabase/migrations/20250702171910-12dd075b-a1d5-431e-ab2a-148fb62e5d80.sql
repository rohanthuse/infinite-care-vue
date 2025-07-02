-- Fix RLS policies for message threads to resolve circular dependency during creation

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can create threads they participate in" ON public.message_threads;
DROP POLICY IF EXISTS "Users can view threads they have access to" ON public.message_threads;
DROP POLICY IF EXISTS "Users can update threads they have access to" ON public.message_threads;

-- Create new policies that handle thread creation properly
CREATE POLICY "Authenticated users can create message threads" 
ON public.message_threads 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can view threads they participate in or created" 
ON public.message_threads 
FOR SELECT 
TO authenticated 
USING (
  created_by = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.message_participants 
    WHERE thread_id = message_threads.id AND user_id = auth.uid()
  )
);

CREATE POLICY "Thread creators can update their threads" 
ON public.message_threads 
FOR UPDATE 
TO authenticated 
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Fix message participants policies
DROP POLICY IF EXISTS "Users can add participants to accessible threads" ON public.message_participants;
DROP POLICY IF EXISTS "Users can view participants of accessible threads" ON public.message_participants;

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

CREATE POLICY "Users can view participants of threads they're in" 
ON public.message_participants 
FOR SELECT 
TO authenticated 
USING (
  user_id = auth.uid() OR
  EXISTS (
    SELECT 1 FROM public.message_threads 
    WHERE id = message_participants.thread_id AND created_by = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.message_participants mp2
    WHERE mp2.thread_id = message_participants.thread_id AND mp2.user_id = auth.uid()
  )
);

-- Fix messages policies
DROP POLICY IF EXISTS "Users can send messages to accessible threads" ON public.messages;
DROP POLICY IF EXISTS "Users can view messages from accessible threads" ON public.messages;

CREATE POLICY "Thread participants can send messages" 
ON public.messages 
FOR INSERT 
TO authenticated 
WITH CHECK (
  sender_id = auth.uid() AND (
    EXISTS (
      SELECT 1 FROM public.message_threads 
      WHERE id = messages.thread_id AND created_by = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.message_participants 
      WHERE thread_id = messages.thread_id AND user_id = auth.uid()
    )
  )
);

CREATE POLICY "Thread participants can view messages" 
ON public.messages 
FOR SELECT 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM public.message_threads 
    WHERE id = messages.thread_id AND created_by = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.message_participants 
    WHERE thread_id = messages.thread_id AND user_id = auth.uid()
  )
);

-- Update the can_access_thread function to handle creation scenarios better
CREATE OR REPLACE FUNCTION public.can_access_thread(thread_id_param uuid, user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $function$
BEGIN
  -- Return true if user created the thread or is a participant
  RETURN EXISTS (
    SELECT 1 FROM public.message_threads
    WHERE id = thread_id_param
    AND created_by = user_id_param
  ) OR EXISTS (
    SELECT 1 FROM public.message_participants 
    WHERE thread_id = thread_id_param 
    AND user_id = user_id_param
  );
END;
$function$;
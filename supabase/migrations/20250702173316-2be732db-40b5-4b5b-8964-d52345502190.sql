-- Fix infinite recursion by removing circular RLS policy dependencies

-- Drop all problematic policies that use can_access_thread() function (causes circular dependency)
DROP POLICY IF EXISTS "Users can view accessible threads" ON public.message_threads;
DROP POLICY IF EXISTS "Users can view messages in accessible threads" ON public.messages;
DROP POLICY IF EXISTS "Thread participants can send messages" ON public.messages;
DROP POLICY IF EXISTS "Thread participants can view messages" ON public.messages;

-- Drop and recreate message_threads policies with direct, non-recursive checks
DROP POLICY IF EXISTS "Authenticated users can create message threads" ON public.message_threads;
DROP POLICY IF EXISTS "Users can view threads they participate in or created" ON public.message_threads;
DROP POLICY IF EXISTS "Thread creators can update their threads" ON public.message_threads;

-- Create clean, direct policies for message_threads (no function calls)
CREATE POLICY "Users can create message threads" 
ON public.message_threads 
FOR INSERT 
TO authenticated 
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can view their own threads or threads they participate in" 
ON public.message_threads 
FOR SELECT 
TO authenticated 
USING (
  created_by = auth.uid() OR
  id IN (
    SELECT thread_id FROM public.message_participants 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Thread creators can update their threads" 
ON public.message_threads 
FOR UPDATE 
TO authenticated 
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Create clean, direct policies for messages (no function calls)
CREATE POLICY "Users can send messages to threads they participate in" 
ON public.messages 
FOR INSERT 
TO authenticated 
WITH CHECK (
  sender_id = auth.uid() AND (
    thread_id IN (
      SELECT id FROM public.message_threads 
      WHERE created_by = auth.uid()
    ) OR
    thread_id IN (
      SELECT thread_id FROM public.message_participants 
      WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can view messages from threads they participate in" 
ON public.messages 
FOR SELECT 
TO authenticated 
USING (
  thread_id IN (
    SELECT id FROM public.message_threads 
    WHERE created_by = auth.uid()
  ) OR
  thread_id IN (
    SELECT thread_id FROM public.message_participants 
    WHERE user_id = auth.uid()
  )
);

-- Update can_access_thread function to avoid querying message_participants directly
-- This removes the circular dependency by making it a simple thread creator check
CREATE OR REPLACE FUNCTION public.can_access_thread(thread_id_param uuid, user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $function$
BEGIN
  -- Simplified version - only check if user created the thread
  -- Participant checks are now handled directly in RLS policies
  RETURN EXISTS (
    SELECT 1 FROM public.message_threads
    WHERE id = thread_id_param
    AND created_by = user_id_param
  );
END;
$function$;
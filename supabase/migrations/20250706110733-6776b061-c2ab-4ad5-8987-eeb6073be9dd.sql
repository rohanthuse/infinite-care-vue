-- Fix RLS Policies for Messaging System

-- Drop overly restrictive policies that prevent group messaging and admin communication
DROP POLICY IF EXISTS "Thread creators can view participants" ON public.message_participants;
DROP POLICY IF EXISTS "Users can view their own participation" ON public.message_participants;
DROP POLICY IF EXISTS "Thread creators can add participants" ON public.message_participants;
DROP POLICY IF EXISTS "Thread creators can remove participants" ON public.message_participants;

-- Drop restrictive message thread policies
DROP POLICY IF EXISTS "Users can create threads" ON public.message_threads;
DROP POLICY IF EXISTS "Users can view accessible threads" ON public.message_threads;
DROP POLICY IF EXISTS "Users can update threads they created" ON public.message_threads;

-- Drop restrictive message policies
DROP POLICY IF EXISTS "Users can view messages in accessible threads" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages to their threads" ON public.messages;

-- Create simplified, admin-friendly RLS policies for message_threads
CREATE POLICY "Admins can manage all message threads" 
ON public.message_threads 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('super_admin', 'branch_admin')
  )
);

CREATE POLICY "Users can manage threads they created" 
ON public.message_threads 
FOR ALL 
USING (created_by = auth.uid());

CREATE POLICY "Users can view threads they participate in" 
ON public.message_threads 
FOR SELECT 
USING (
  id IN (
    SELECT thread_id FROM public.message_participants 
    WHERE user_id = auth.uid()
  )
);

-- Create simplified RLS policies for message_participants  
CREATE POLICY "Admins can manage all message participants" 
ON public.message_participants 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('super_admin', 'branch_admin')
  )
);

CREATE POLICY "Thread creators can manage participants" 
ON public.message_participants 
FOR ALL 
USING (
  thread_id IN (
    SELECT id FROM public.message_threads 
    WHERE created_by = auth.uid()
  )
);

CREATE POLICY "Users can view their own participation" 
ON public.message_participants 
FOR SELECT 
USING (user_id = auth.uid());

-- Create simplified RLS policies for messages
CREATE POLICY "Admins can manage all messages" 
ON public.messages 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('super_admin', 'branch_admin')
  )
);

CREATE POLICY "Users can view messages in their threads" 
ON public.messages 
FOR SELECT 
USING (
  thread_id IN (
    SELECT thread_id FROM public.message_participants 
    WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Users can send messages to their threads" 
ON public.messages 
FOR INSERT 
WITH CHECK (
  sender_id = auth.uid() 
  AND thread_id IN (
    SELECT thread_id FROM public.message_participants 
    WHERE user_id = auth.uid()
  )
);

-- Fix client ID mapping in message_participants
-- This function will map client database IDs to auth user IDs
SELECT public.fix_message_participants_user_ids();
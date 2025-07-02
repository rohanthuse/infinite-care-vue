
-- Phase 1: Database Foundation - Fix RLS Policies and Initialize Data

-- First, let's fix the message threads RLS policies to be more permissive for testing
DROP POLICY IF EXISTS "Users can view threads they participate in" ON public.message_threads;
DROP POLICY IF EXISTS "Users can create threads" ON public.message_threads;
DROP POLICY IF EXISTS "Users can update threads they created" ON public.message_threads;

-- More permissive policies for message threads
CREATE POLICY "Authenticated users can view message threads"
  ON public.message_threads FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can create message threads"
  ON public.message_threads FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update message threads"
  ON public.message_threads FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

-- Fix messages RLS policies
DROP POLICY IF EXISTS "Users can view messages in their threads" ON public.messages;
DROP POLICY IF EXISTS "Users can send messages to their threads" ON public.messages;

CREATE POLICY "Authenticated users can view messages"
  ON public.messages FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can send messages"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL AND sender_id = auth.uid());

-- Fix message participants RLS policies
DROP POLICY IF EXISTS "Users can view participants in their threads" ON public.message_participants;
DROP POLICY IF EXISTS "Users can add participants to threads they created" ON public.message_participants;

CREATE POLICY "Authenticated users can view message participants"
  ON public.message_participants FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can add message participants"
  ON public.message_participants FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

-- Fix message read status RLS policies
DROP POLICY IF EXISTS "Users can view their own read status" ON public.message_read_status;
DROP POLICY IF EXISTS "Users can mark messages as read" ON public.message_read_status;
DROP POLICY IF EXISTS "Users can update their read status" ON public.message_read_status;

CREATE POLICY "Authenticated users can manage read status"
  ON public.message_read_status FOR ALL
  TO authenticated
  USING (auth.uid() IS NOT NULL)
  WITH CHECK (auth.uid() IS NOT NULL);

-- Ensure all staff have user roles (fix missing role assignments)
INSERT INTO public.user_roles (user_id, role)
SELECT s.id, 'carer'::app_role
FROM public.staff s
LEFT JOIN public.user_roles ur ON s.id = ur.user_id
WHERE ur.user_id IS NULL
  AND EXISTS (SELECT 1 FROM auth.users WHERE id = s.id);

-- Add admin roles for existing admins
INSERT INTO public.user_roles (user_id, role)
SELECT ab.admin_id, 'branch_admin'::app_role
FROM public.admin_branches ab
LEFT JOIN public.user_roles ur ON ab.admin_id = ur.user_id AND ur.role = 'branch_admin'
WHERE ur.user_id IS NULL
  AND EXISTS (SELECT 1 FROM auth.users WHERE id = ab.admin_id);

-- Add client roles for existing clients
INSERT INTO public.user_roles (user_id, role)
SELECT c.id, 'client'::app_role
FROM public.clients c
LEFT JOIN public.user_roles ur ON c.id = ur.user_id AND ur.role = 'client'
WHERE ur.user_id IS NULL
  AND c.id IS NOT NULL;

-- Create some sample message threads for testing (only if none exist)
DO $$
DECLARE
  sample_branch_id UUID;
  sample_admin_id UUID;
  sample_client_id UUID;
  sample_thread_id UUID;
BEGIN
  -- Get a sample branch
  SELECT id INTO sample_branch_id FROM public.branches LIMIT 1;
  
  IF sample_branch_id IS NOT NULL THEN
    -- Get a sample admin for this branch
    SELECT ab.admin_id INTO sample_admin_id 
    FROM public.admin_branches ab 
    WHERE ab.branch_id = sample_branch_id 
    LIMIT 1;
    
    -- Get a sample client for this branch
    SELECT c.id INTO sample_client_id 
    FROM public.clients c 
    WHERE c.branch_id = sample_branch_id 
    LIMIT 1;
    
    -- Only create sample data if we have both admin and client, and no threads exist
    IF sample_admin_id IS NOT NULL AND sample_client_id IS NOT NULL THEN
      IF NOT EXISTS (SELECT 1 FROM public.message_threads LIMIT 1) THEN
        -- Create a sample thread
        INSERT INTO public.message_threads (
          id, subject, branch_id, created_by, created_at, updated_at, last_message_at
        ) VALUES (
          gen_random_uuid(),
          'Welcome - Care Coordination',
          sample_branch_id,
          sample_admin_id,
          now(),
          now(),
          now()
        ) RETURNING id INTO sample_thread_id;
        
        -- Add participants
        INSERT INTO public.message_participants (thread_id, user_id, user_type, user_name) VALUES
        (sample_thread_id, sample_admin_id, 'branch_admin', 'Care Coordinator'),
        (sample_thread_id, sample_client_id, 'client', 'Client');
        
        -- Add a sample message
        INSERT INTO public.messages (
          thread_id, sender_id, sender_type, content, created_at
        ) VALUES (
          sample_thread_id,
          sample_admin_id,
          'branch_admin',
          'Welcome to our care coordination system. Feel free to reach out if you have any questions or concerns.',
          now()
        );
      END IF;
    END IF;
  END IF;
END $$;

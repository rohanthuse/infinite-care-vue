-- Phase 2: Messaging System Isolation - Fix message threads and participants to be organization-aware

-- First, let's add organization_id to message_threads if it doesn't exist
ALTER TABLE public.message_threads 
ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id);

-- Update existing message_threads to set organization_id based on branch_id
UPDATE public.message_threads 
SET organization_id = (
  SELECT b.organization_id 
  FROM branches b 
  WHERE b.id = message_threads.branch_id
)
WHERE organization_id IS NULL AND branch_id IS NOT NULL;

-- Update message_threads RLS policies for organization isolation
DROP POLICY IF EXISTS "Admins can create message threads" ON public.message_threads;
DROP POLICY IF EXISTS "Users can view accessible threads" ON public.message_threads;
DROP POLICY IF EXISTS "Thread creators can update their threads" ON public.message_threads;

CREATE POLICY "Organization members can create message threads" ON public.message_threads
FOR INSERT WITH CHECK (
  organization_id = get_user_organization_id(auth.uid()) AND
  (branch_id IS NULL OR branch_id IN (
    SELECT b.id FROM branches b WHERE b.organization_id = get_user_organization_id(auth.uid())
  ))
);

CREATE POLICY "Organization members can view message threads" ON public.message_threads
FOR SELECT USING (
  organization_id = get_user_organization_id(auth.uid()) OR
  user_is_admin(auth.uid()) OR
  can_access_thread(id, auth.uid())
);

CREATE POLICY "Organization members can update message threads" ON public.message_threads
FOR UPDATE USING (
  organization_id = get_user_organization_id(auth.uid()) AND
  (created_by = auth.uid() OR user_is_admin(auth.uid()))
);

-- Update message_participants RLS policies for organization isolation
DROP POLICY IF EXISTS "Admins can manage all message participants" ON public.message_participants;
DROP POLICY IF EXISTS "Clients can add participants to threads they create" ON public.message_participants;
DROP POLICY IF EXISTS "Users can view thread participants" ON public.message_participants;

CREATE POLICY "Organization members can manage message participants" ON public.message_participants
FOR ALL USING (
  thread_id IN (
    SELECT mt.id FROM message_threads mt 
    WHERE mt.organization_id = get_user_organization_id(auth.uid())
  ) OR user_is_admin(auth.uid())
) WITH CHECK (
  thread_id IN (
    SELECT mt.id FROM message_threads mt 
    WHERE mt.organization_id = get_user_organization_id(auth.uid())
  ) OR user_is_admin(auth.uid())
);

-- Update messages RLS policies for organization isolation
DROP POLICY IF EXISTS "Admins can manage messages" ON public.messages;
DROP POLICY IF EXISTS "Thread participants can create messages" ON public.messages;
DROP POLICY IF EXISTS "Thread participants can view messages" ON public.messages;

CREATE POLICY "Organization members can manage messages" ON public.messages
FOR ALL USING (
  thread_id IN (
    SELECT mt.id FROM message_threads mt 
    WHERE mt.organization_id = get_user_organization_id(auth.uid())
  ) OR user_is_admin(auth.uid())
) WITH CHECK (
  thread_id IN (
    SELECT mt.id FROM message_threads mt 
    WHERE mt.organization_id = get_user_organization_id(auth.uid())
  ) OR user_is_admin(auth.uid())
);
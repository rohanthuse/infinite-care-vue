-- Fix RLS policies for client_events_logs to provide proper access control

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Users can view client events logs" ON public.client_events_logs;
DROP POLICY IF EXISTS "Users can insert client events logs" ON public.client_events_logs;
DROP POLICY IF EXISTS "Users can update client events logs" ON public.client_events_logs;
DROP POLICY IF EXISTS "Users can delete client events logs" ON public.client_events_logs;
DROP POLICY IF EXISTS "Users can view events from their branch" ON public.client_events_logs;
DROP POLICY IF EXISTS "Users can create events" ON public.client_events_logs;
DROP POLICY IF EXISTS "Users can update events from their branch" ON public.client_events_logs;
DROP POLICY IF EXISTS "Users can delete events from their branch" ON public.client_events_logs;
DROP POLICY IF EXISTS "Allow authenticated users to insert client events logs" ON public.client_events_logs;
DROP POLICY IF EXISTS "Allow authenticated users to update client events logs" ON public.client_events_logs;
DROP POLICY IF EXISTS "Allow authenticated users to delete client events logs" ON public.client_events_logs;

-- Create secure RLS policies for client_events_logs

-- Clients can view events for themselves only
CREATE POLICY "Clients can view their own events"
ON public.client_events_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.clients c
    WHERE c.id = client_events_logs.client_id
    AND c.auth_user_id = auth.uid()
  )
);

-- Staff can view events for clients in their branch
CREATE POLICY "Staff can view events in their branch"
ON public.client_events_logs
FOR SELECT  
USING (
  branch_id IN (
    SELECT s.branch_id FROM public.staff s WHERE s.auth_user_id = auth.uid()
    UNION
    SELECT ab.branch_id FROM public.admin_branches ab WHERE ab.admin_id = auth.uid()
  )
);

-- Super admins can view all events
CREATE POLICY "Super admins can view all events"
ON public.client_events_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin'
  )
);

-- Only staff and admins can create events
CREATE POLICY "Staff and admins can create events"
ON public.client_events_logs
FOR INSERT
WITH CHECK (
  branch_id IN (
    SELECT s.branch_id FROM public.staff s WHERE s.auth_user_id = auth.uid()
    UNION
    SELECT ab.branch_id FROM public.admin_branches ab WHERE ab.admin_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin'
  )
);

-- Only staff and admins can update events in their branch
CREATE POLICY "Staff and admins can update events in their branch"
ON public.client_events_logs
FOR UPDATE
USING (
  branch_id IN (
    SELECT s.branch_id FROM public.staff s WHERE s.auth_user_id = auth.uid()
    UNION
    SELECT ab.branch_id FROM public.admin_branches ab WHERE ab.admin_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin'
  )
);

-- Only staff and admins can delete events in their branch  
CREATE POLICY "Staff and admins can delete events in their branch"
ON public.client_events_logs
FOR DELETE
USING (
  branch_id IN (
    SELECT s.branch_id FROM public.staff s WHERE s.auth_user_id = auth.uid()
    UNION
    SELECT ab.branch_id FROM public.admin_branches ab WHERE ab.admin_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin'
  )
);
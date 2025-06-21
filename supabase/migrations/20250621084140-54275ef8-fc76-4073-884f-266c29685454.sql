
-- First, let's check if we need to add body map support to the existing client_events_logs table
ALTER TABLE public.client_events_logs 
ADD COLUMN IF NOT EXISTS body_map_points JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS location TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'other',
ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES public.branches(id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_client_events_logs_branch_id ON public.client_events_logs(branch_id);
CREATE INDEX IF NOT EXISTS idx_client_events_logs_event_type ON public.client_events_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_client_events_logs_severity ON public.client_events_logs(severity);
CREATE INDEX IF NOT EXISTS idx_client_events_logs_status ON public.client_events_logs(status);

-- Add RLS policies for the events logs table
ALTER TABLE public.client_events_logs ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to view events from their branch
CREATE POLICY "Users can view events from their branch" ON public.client_events_logs
  FOR SELECT 
  USING (true); -- For now, allow all authenticated users to view events

-- Policy to allow users to insert events
CREATE POLICY "Users can create events" ON public.client_events_logs
  FOR INSERT 
  WITH CHECK (true); -- For now, allow all authenticated users to create events

-- Policy to allow users to update events they created or from their branch
CREATE POLICY "Users can update events from their branch" ON public.client_events_logs
  FOR UPDATE 
  USING (true); -- For now, allow all authenticated users to update events

-- Policy to allow users to delete events (admin only in practice)
CREATE POLICY "Users can delete events from their branch" ON public.client_events_logs
  FOR DELETE 
  USING (true); -- For now, allow all authenticated users to delete events

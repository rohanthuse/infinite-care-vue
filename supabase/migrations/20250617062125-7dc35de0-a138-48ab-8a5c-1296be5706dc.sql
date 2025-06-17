
-- Create client_notes table for storing client notes
CREATE TABLE public.client_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  author text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create client_events_logs table for events and incident logs
CREATE TABLE public.client_events_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  title text NOT NULL,
  description text,
  severity text NOT NULL DEFAULT 'low',
  reporter text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on the new tables
ALTER TABLE public.client_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_events_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for client_notes
CREATE POLICY "Users can view client notes" ON public.client_notes FOR SELECT USING (true);
CREATE POLICY "Users can insert client notes" ON public.client_notes FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update client notes" ON public.client_notes FOR UPDATE USING (true);
CREATE POLICY "Users can delete client notes" ON public.client_notes FOR DELETE USING (true);

-- Create RLS policies for client_events_logs
CREATE POLICY "Users can view client events logs" ON public.client_events_logs FOR SELECT USING (true);
CREATE POLICY "Users can insert client events logs" ON public.client_events_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can update client events logs" ON public.client_events_logs FOR UPDATE USING (true);
CREATE POLICY "Users can delete client events logs" ON public.client_events_logs FOR DELETE USING (true);

-- Create storage bucket for client documents
INSERT INTO storage.buckets (id, name, public) VALUES ('client-documents', 'client-documents', true);

-- Create storage policies for client documents
CREATE POLICY "Users can view client documents" ON storage.objects FOR SELECT USING (bucket_id = 'client-documents');
CREATE POLICY "Users can upload client documents" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'client-documents');
CREATE POLICY "Users can update client documents" ON storage.objects FOR UPDATE USING (bucket_id = 'client-documents');
CREATE POLICY "Users can delete client documents" ON storage.objects FOR DELETE USING (bucket_id = 'client-documents');

-- Add updated_at trigger for client_notes
CREATE TRIGGER update_client_notes_updated_at BEFORE UPDATE ON public.client_notes FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- Add updated_at trigger for client_events_logs
CREATE TRIGGER update_client_events_logs_updated_at BEFORE UPDATE ON public.client_events_logs FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

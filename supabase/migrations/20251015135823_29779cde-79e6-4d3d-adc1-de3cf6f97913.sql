-- Create scheduled_messages table for message scheduling functionality
CREATE TABLE IF NOT EXISTS public.scheduled_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES public.message_threads(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_ids UUID[] NOT NULL,
  subject TEXT,
  content TEXT NOT NULL,
  message_type TEXT,
  priority TEXT DEFAULT 'medium',
  action_required BOOLEAN DEFAULT FALSE,
  admin_eyes_only BOOLEAN DEFAULT FALSE,
  attachments JSONB DEFAULT '[]'::jsonb,
  notification_methods TEXT[] DEFAULT ARRAY[]::TEXT[],
  scheduled_for TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  branch_id UUID REFERENCES public.branches(id),
  organization_id UUID REFERENCES public.organizations(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_scheduled_messages_status_scheduled_for 
  ON public.scheduled_messages(status, scheduled_for) 
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_scheduled_messages_sender 
  ON public.scheduled_messages(sender_id);

CREATE INDEX IF NOT EXISTS idx_scheduled_messages_thread 
  ON public.scheduled_messages(thread_id);

-- Enable RLS
ALTER TABLE public.scheduled_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can view their own scheduled messages
CREATE POLICY "Users can view own scheduled messages"
ON public.scheduled_messages
FOR SELECT
USING (sender_id = auth.uid());

-- RLS Policy: Users can insert their own scheduled messages
CREATE POLICY "Users can insert own scheduled messages"
ON public.scheduled_messages
FOR INSERT
WITH CHECK (sender_id = auth.uid());

-- RLS Policy: Users can update their own pending scheduled messages
CREATE POLICY "Users can update own pending scheduled messages"
ON public.scheduled_messages
FOR UPDATE
USING (sender_id = auth.uid() AND status = 'pending')
WITH CHECK (sender_id = auth.uid());

-- RLS Policy: Users can delete their own pending scheduled messages
CREATE POLICY "Users can delete own pending scheduled messages"
ON public.scheduled_messages
FOR DELETE
USING (sender_id = auth.uid() AND status = 'pending');

-- Trigger to auto-set branch_id and organization_id
CREATE OR REPLACE FUNCTION public.set_scheduled_message_context()
RETURNS TRIGGER AS $$
BEGIN
  -- Get branch_id and organization_id from sender's profile
  SELECT b.id, b.organization_id
  INTO NEW.branch_id, NEW.organization_id
  FROM public.staff s
  JOIN public.branches b ON s.branch_id = b.id
  WHERE s.auth_user_id = NEW.sender_id
  LIMIT 1;
  
  -- If not found in staff, try admin_branches
  IF NEW.branch_id IS NULL THEN
    SELECT ab.branch_id, b.organization_id
    INTO NEW.branch_id, NEW.organization_id
    FROM public.admin_branches ab
    JOIN public.branches b ON ab.branch_id = b.id
    WHERE ab.admin_id = NEW.sender_id
    LIMIT 1;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_scheduled_message_context_trigger
  BEFORE INSERT ON public.scheduled_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.set_scheduled_message_context();

-- Trigger to update updated_at
CREATE TRIGGER update_scheduled_messages_updated_at
  BEFORE UPDATE ON public.scheduled_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_essentials_updated_at();

-- Validation trigger for future dates
CREATE OR REPLACE FUNCTION public.validate_scheduled_message()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.scheduled_for <= now() THEN
    RAISE EXCEPTION 'Scheduled time must be in the future';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_scheduled_message_trigger
  BEFORE INSERT OR UPDATE ON public.scheduled_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_scheduled_message();
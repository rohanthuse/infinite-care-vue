
-- Create message threads table
CREATE TABLE public.message_threads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject TEXT NOT NULL,
  branch_id UUID REFERENCES public.branches(id),
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  is_archived BOOLEAN DEFAULT false
);

-- Create messages table
CREATE TABLE public.messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID NOT NULL REFERENCES public.message_threads(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('super_admin', 'branch_admin', 'carer', 'client')),
  content TEXT NOT NULL,
  has_attachments BOOLEAN DEFAULT false,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create message participants table
CREATE TABLE public.message_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  thread_id UUID NOT NULL REFERENCES public.message_threads(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  user_type TEXT NOT NULL CHECK (user_type IN ('super_admin', 'branch_admin', 'carer', 'client')),
  user_name TEXT NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_read_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(thread_id, user_id)
);

-- Create message read status table
CREATE TABLE public.message_read_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id)
);

-- Enable RLS on all tables
ALTER TABLE public.message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_read_status ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for message_threads
CREATE POLICY "Users can view threads they participate in"
  ON public.message_threads FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.message_participants 
      WHERE thread_id = message_threads.id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create threads"
  ON public.message_threads FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update threads they created"
  ON public.message_threads FOR UPDATE
  USING (created_by = auth.uid());

-- Create RLS policies for messages
CREATE POLICY "Users can view messages in their threads"
  ON public.messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.message_participants 
      WHERE thread_id = messages.thread_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Users can send messages to their threads"
  ON public.messages FOR INSERT
  WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.message_participants 
      WHERE thread_id = messages.thread_id 
      AND user_id = auth.uid()
    )
  );

-- Create RLS policies for message_participants
CREATE POLICY "Users can view participants in their threads"
  ON public.message_participants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.message_participants mp2
      WHERE mp2.thread_id = message_participants.thread_id 
      AND mp2.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can add participants to threads they created"
  ON public.message_participants FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.message_threads 
      WHERE id = message_participants.thread_id 
      AND created_by = auth.uid()
    )
  );

-- Create RLS policies for message_read_status
CREATE POLICY "Users can view their own read status"
  ON public.message_read_status FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can mark messages as read"
  ON public.message_read_status FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their read status"
  ON public.message_read_status FOR UPDATE
  USING (user_id = auth.uid());

-- Create triggers for updated_at
CREATE TRIGGER update_message_threads_updated_at
  BEFORE UPDATE ON public.message_threads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_messages_updated_at
  BEFORE UPDATE ON public.messages
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for performance
CREATE INDEX idx_message_threads_branch_id ON public.message_threads(branch_id);
CREATE INDEX idx_message_threads_created_by ON public.message_threads(created_by);
CREATE INDEX idx_messages_thread_id ON public.messages(thread_id);
CREATE INDEX idx_messages_sender_id ON public.messages(sender_id);
CREATE INDEX idx_message_participants_thread_id ON public.message_participants(thread_id);
CREATE INDEX idx_message_participants_user_id ON public.message_participants(user_id);
CREATE INDEX idx_message_read_status_message_id ON public.message_read_status(message_id);
CREATE INDEX idx_message_read_status_user_id ON public.message_read_status(user_id);

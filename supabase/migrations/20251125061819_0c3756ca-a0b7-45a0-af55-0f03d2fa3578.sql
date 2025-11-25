-- Create draft_messages table for storing unsent message drafts
CREATE TABLE public.draft_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  thread_id UUID REFERENCES public.message_threads(id) ON DELETE SET NULL,
  recipient_ids UUID[] NOT NULL,
  recipient_names TEXT[] NOT NULL,
  recipient_types TEXT[] NOT NULL,
  subject TEXT,
  content TEXT NOT NULL,
  message_type TEXT,
  priority TEXT DEFAULT 'medium',
  action_required BOOLEAN DEFAULT false,
  admin_eyes_only BOOLEAN DEFAULT false,
  attachments JSONB,
  notification_methods TEXT[],
  other_email_address TEXT,
  branch_id UUID REFERENCES public.branches(id),
  organization_id UUID REFERENCES public.organizations(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  auto_saved BOOLEAN DEFAULT false
);

-- Create indexes for better query performance
CREATE INDEX idx_draft_messages_sender ON public.draft_messages(sender_id);
CREATE INDEX idx_draft_messages_branch ON public.draft_messages(branch_id);
CREATE INDEX idx_draft_messages_organization ON public.draft_messages(organization_id);
CREATE INDEX idx_draft_messages_created_at ON public.draft_messages(created_at DESC);

-- Enable Row Level Security
ALTER TABLE public.draft_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only access their own drafts
CREATE POLICY "Users can view own drafts"
  ON public.draft_messages FOR SELECT
  USING (sender_id = auth.uid());

CREATE POLICY "Users can insert own drafts"
  ON public.draft_messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update own drafts"
  ON public.draft_messages FOR UPDATE
  USING (sender_id = auth.uid());

CREATE POLICY "Users can delete own drafts"
  ON public.draft_messages FOR DELETE
  USING (sender_id = auth.uid());

-- Auto-update timestamp trigger
CREATE TRIGGER update_draft_messages_updated_at
  BEFORE UPDATE ON public.draft_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_essentials_updated_at();
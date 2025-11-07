-- Create event_shares table for tracking event log sharing
CREATE TABLE event_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES client_events_logs(id) ON DELETE CASCADE,
  shared_by UUID REFERENCES auth.users(id),
  shared_with UUID[],
  share_method TEXT CHECK (share_method IN ('web_share', 'internal', 'email')),
  share_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create report_shares table for tracking report sharing
CREATE TABLE report_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_type TEXT NOT NULL,
  report_data JSONB,
  branch_id UUID REFERENCES branches(id),
  shared_by UUID REFERENCES auth.users(id),
  shared_with UUID[],
  file_format TEXT CHECK (file_format IN ('pdf', 'csv', 'excel')),
  share_method TEXT CHECK (share_method IN ('web_share', 'internal', 'email')),
  share_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create agreement_shares table for tracking agreement/contract sharing
CREATE TABLE agreement_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_id UUID REFERENCES agreements(id) ON DELETE CASCADE,
  shared_by UUID REFERENCES auth.users(id),
  shared_with UUID[],
  share_method TEXT CHECK (share_method IN ('web_share', 'internal', 'email')),
  viewed_at TIMESTAMP WITH TIME ZONE[],
  viewed_by UUID[],
  share_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE event_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE agreement_shares ENABLE ROW LEVEL SECURITY;

-- RLS Policies for event_shares
CREATE POLICY "Users can view their event shares" ON event_shares
  FOR SELECT USING (
    shared_by = auth.uid() OR 
    auth.uid() = ANY(shared_with) OR
    has_role(auth.uid(), 'super_admin'::app_role) OR
    has_role(auth.uid(), 'branch_admin'::app_role)
  );

CREATE POLICY "Users can create event shares" ON event_shares
  FOR INSERT WITH CHECK (shared_by = auth.uid());

CREATE POLICY "Users can delete their event shares" ON event_shares
  FOR DELETE USING (shared_by = auth.uid());

-- RLS Policies for report_shares
CREATE POLICY "Users can view their report shares" ON report_shares
  FOR SELECT USING (
    shared_by = auth.uid() OR 
    auth.uid() = ANY(shared_with) OR
    has_role(auth.uid(), 'super_admin'::app_role) OR
    has_role(auth.uid(), 'branch_admin'::app_role)
  );

CREATE POLICY "Users can create report shares" ON report_shares
  FOR INSERT WITH CHECK (shared_by = auth.uid());

CREATE POLICY "Users can delete their report shares" ON report_shares
  FOR DELETE USING (shared_by = auth.uid());

-- RLS Policies for agreement_shares
CREATE POLICY "Users can view their agreement shares" ON agreement_shares
  FOR SELECT USING (
    shared_by = auth.uid() OR 
    auth.uid() = ANY(shared_with) OR
    has_role(auth.uid(), 'super_admin'::app_role) OR
    has_role(auth.uid(), 'branch_admin'::app_role)
  );

CREATE POLICY "Users can create agreement shares" ON agreement_shares
  FOR INSERT WITH CHECK (shared_by = auth.uid());

CREATE POLICY "Users can update agreement shares" ON agreement_shares
  FOR UPDATE USING (
    shared_by = auth.uid() OR 
    auth.uid() = ANY(shared_with)
  );

CREATE POLICY "Users can delete their agreement shares" ON agreement_shares
  FOR DELETE USING (shared_by = auth.uid());

-- Create indexes for better query performance
CREATE INDEX idx_event_shares_event_id ON event_shares(event_id);
CREATE INDEX idx_event_shares_shared_by ON event_shares(shared_by);
CREATE INDEX idx_report_shares_branch_id ON report_shares(branch_id);
CREATE INDEX idx_report_shares_shared_by ON report_shares(shared_by);
CREATE INDEX idx_agreement_shares_agreement_id ON agreement_shares(agreement_id);
CREATE INDEX idx_agreement_shares_shared_by ON agreement_shares(shared_by);
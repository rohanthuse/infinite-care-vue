-- Phase 5: Create invoice_generation_batches table for audit trail
CREATE TABLE IF NOT EXISTS invoice_generation_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  period_type TEXT NOT NULL CHECK (period_type IN ('weekly', 'fortnightly', 'monthly')),
  period_start_date DATE NOT NULL,
  period_end_date DATE NOT NULL,
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  generated_by UUID REFERENCES auth.users(id),
  
  -- Statistics
  clients_processed INTEGER NOT NULL DEFAULT 0,
  invoices_created INTEGER NOT NULL DEFAULT 0,
  invoices_failed INTEGER NOT NULL DEFAULT 0,
  total_net_amount NUMERIC(10,2) DEFAULT 0,
  total_vat_amount NUMERIC(10,2) DEFAULT 0,
  total_amount NUMERIC(10,2) DEFAULT 0,
  
  -- Performance
  execution_time_ms INTEGER,
  
  -- Data
  error_details JSONB,
  invoice_ids UUID[],
  
  -- Status
  status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'partial', 'failed')),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_batches_org ON invoice_generation_batches(organization_id);
CREATE INDEX IF NOT EXISTS idx_batches_branch ON invoice_generation_batches(branch_id);
CREATE INDEX IF NOT EXISTS idx_batches_period ON invoice_generation_batches(period_start_date, period_end_date);
CREATE INDEX IF NOT EXISTS idx_batches_generated_at ON invoice_generation_batches(generated_at DESC);

-- Enable RLS
ALTER TABLE invoice_generation_batches ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view batches for their organization"
  ON invoice_generation_batches FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert batches for their organization"
  ON invoice_generation_batches FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
  );

-- Phase 6: Create email notification tables
CREATE TABLE IF NOT EXISTS invoice_email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES client_billing(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'cancelled')),
  
  -- Email content
  template_name TEXT DEFAULT 'invoice_generated',
  template_data JSONB,
  
  -- Tracking
  scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  error_message TEXT,
  
  -- Audit
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_queue_status ON invoice_email_queue(status);
CREATE INDEX IF NOT EXISTS idx_email_queue_scheduled ON invoice_email_queue(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_email_queue_invoice ON invoice_email_queue(invoice_id);

-- Enable RLS
ALTER TABLE invoice_email_queue ENABLE ROW LEVEL SECURITY;

-- RLS Policies for email queue
CREATE POLICY "Users can view email queue for their organization"
  ON invoice_email_queue FOR SELECT
  USING (
    client_id IN (
      SELECT c.id FROM clients c
      JOIN branches b ON c.branch_id = b.id
      JOIN organization_members om ON b.organization_id = om.organization_id
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert into email queue for their organization"
  ON invoice_email_queue FOR INSERT
  WITH CHECK (
    client_id IN (
      SELECT c.id FROM clients c
      JOIN branches b ON c.branch_id = b.id
      JOIN organization_members om ON b.organization_id = om.organization_id
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "System can update email queue"
  ON invoice_email_queue FOR UPDATE
  USING (true);

-- Client email settings table
CREATE TABLE IF NOT EXISTS client_email_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  
  -- Preferences
  send_invoice_emails BOOLEAN DEFAULT true,
  email_on_generation BOOLEAN DEFAULT true,
  email_on_due_date_reminder BOOLEAN DEFAULT true,
  reminder_days_before INTEGER DEFAULT 7,
  
  -- Recipient override
  invoice_email TEXT,
  cc_emails TEXT[],
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(client_id)
);

-- Enable RLS
ALTER TABLE client_email_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view email settings for their organization"
  ON client_email_settings FOR SELECT
  USING (
    client_id IN (
      SELECT c.id FROM clients c
      JOIN branches b ON c.branch_id = b.id
      JOIN organization_members om ON b.organization_id = om.organization_id
      WHERE om.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage email settings for their organization"
  ON client_email_settings FOR ALL
  USING (
    client_id IN (
      SELECT c.id FROM clients c
      JOIN branches b ON c.branch_id = b.id
      JOIN organization_members om ON b.organization_id = om.organization_id
      WHERE om.user_id = auth.uid()
    )
  )
  WITH CHECK (
    client_id IN (
      SELECT c.id FROM clients c
      JOIN branches b ON c.branch_id = b.id
      JOIN organization_members om ON b.organization_id = om.organization_id
      WHERE om.user_id = auth.uid()
    )
  );
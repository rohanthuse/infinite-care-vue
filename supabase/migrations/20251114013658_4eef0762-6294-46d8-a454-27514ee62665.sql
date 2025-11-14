-- Create fluid intake records table
CREATE TABLE fluid_intake_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  visit_record_id UUID REFERENCES visit_records(id) ON DELETE SET NULL,
  service_report_id UUID REFERENCES client_service_reports(id) ON DELETE SET NULL,
  record_date DATE NOT NULL,
  recorded_by UUID REFERENCES staff(id),
  
  -- Entry details
  time TIMESTAMP WITH TIME ZONE NOT NULL,
  fluid_type TEXT NOT NULL,
  amount_ml INTEGER NOT NULL CHECK (amount_ml > 0 AND amount_ml <= 5000),
  method TEXT NOT NULL,
  comments TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create fluid output records table
CREATE TABLE fluid_output_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  visit_record_id UUID REFERENCES visit_records(id) ON DELETE SET NULL,
  service_report_id UUID REFERENCES client_service_reports(id) ON DELETE SET NULL,
  record_date DATE NOT NULL,
  recorded_by UUID REFERENCES staff(id),
  
  -- Entry details
  time TIMESTAMP WITH TIME ZONE NOT NULL,
  output_type TEXT NOT NULL,
  amount_ml INTEGER,
  amount_estimate TEXT,
  appearance TEXT,
  comments TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create urinary output records table
CREATE TABLE urinary_output_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
  visit_record_id UUID REFERENCES visit_records(id) ON DELETE SET NULL,
  service_report_id UUID REFERENCES client_service_reports(id) ON DELETE SET NULL,
  record_date DATE NOT NULL,
  recorded_by UUID REFERENCES staff(id),
  
  -- Entry details
  time TIMESTAMP WITH TIME ZONE NOT NULL,
  collection_method TEXT NOT NULL,
  amount_ml INTEGER,
  amount_estimate TEXT,
  colour TEXT,
  odour TEXT,
  discomfort_observations TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create fluid balance targets table
CREATE TABLE fluid_balance_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE UNIQUE,
  daily_intake_target_ml INTEGER,
  daily_output_target_ml INTEGER,
  alert_threshold_percentage INTEGER DEFAULT 50,
  notes TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_fluid_intake_client_date ON fluid_intake_records(client_id, record_date);
CREATE INDEX idx_fluid_intake_visit ON fluid_intake_records(visit_record_id);
CREATE INDEX idx_fluid_intake_service_report ON fluid_intake_records(service_report_id);

CREATE INDEX idx_fluid_output_client_date ON fluid_output_records(client_id, record_date);
CREATE INDEX idx_fluid_output_visit ON fluid_output_records(visit_record_id);
CREATE INDEX idx_fluid_output_service_report ON fluid_output_records(service_report_id);

CREATE INDEX idx_urinary_output_client_date ON urinary_output_records(client_id, record_date);
CREATE INDEX idx_urinary_output_visit ON urinary_output_records(visit_record_id);
CREATE INDEX idx_urinary_output_service_report ON urinary_output_records(service_report_id);

-- Enable Row Level Security
ALTER TABLE fluid_intake_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE fluid_output_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE urinary_output_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE fluid_balance_targets ENABLE ROW LEVEL SECURITY;

-- RLS Policies for fluid_intake_records
CREATE POLICY "Staff can view fluid intake records for their branch clients"
  ON fluid_intake_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clients c
      JOIN admin_branches ab ON ab.branch_id = c.branch_id
      WHERE c.id = fluid_intake_records.client_id
      AND ab.admin_id = auth.uid()
    )
  );

CREATE POLICY "Staff can insert fluid intake records for their branch clients"
  ON fluid_intake_records FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients c
      JOIN admin_branches ab ON ab.branch_id = c.branch_id
      WHERE c.id = fluid_intake_records.client_id
      AND ab.admin_id = auth.uid()
    )
  );

CREATE POLICY "Staff can update fluid intake records for their branch clients"
  ON fluid_intake_records FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM clients c
      JOIN admin_branches ab ON ab.branch_id = c.branch_id
      WHERE c.id = fluid_intake_records.client_id
      AND ab.admin_id = auth.uid()
    )
  );

CREATE POLICY "Staff can delete fluid intake records for their branch clients"
  ON fluid_intake_records FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM clients c
      JOIN admin_branches ab ON ab.branch_id = c.branch_id
      WHERE c.id = fluid_intake_records.client_id
      AND ab.admin_id = auth.uid()
    )
  );

-- RLS Policies for fluid_output_records
CREATE POLICY "Staff can view fluid output records for their branch clients"
  ON fluid_output_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clients c
      JOIN admin_branches ab ON ab.branch_id = c.branch_id
      WHERE c.id = fluid_output_records.client_id
      AND ab.admin_id = auth.uid()
    )
  );

CREATE POLICY "Staff can insert fluid output records for their branch clients"
  ON fluid_output_records FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients c
      JOIN admin_branches ab ON ab.branch_id = c.branch_id
      WHERE c.id = fluid_output_records.client_id
      AND ab.admin_id = auth.uid()
    )
  );

CREATE POLICY "Staff can update fluid output records for their branch clients"
  ON fluid_output_records FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM clients c
      JOIN admin_branches ab ON ab.branch_id = c.branch_id
      WHERE c.id = fluid_output_records.client_id
      AND ab.admin_id = auth.uid()
    )
  );

CREATE POLICY "Staff can delete fluid output records for their branch clients"
  ON fluid_output_records FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM clients c
      JOIN admin_branches ab ON ab.branch_id = c.branch_id
      WHERE c.id = fluid_output_records.client_id
      AND ab.admin_id = auth.uid()
    )
  );

-- RLS Policies for urinary_output_records
CREATE POLICY "Staff can view urinary output records for their branch clients"
  ON urinary_output_records FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clients c
      JOIN admin_branches ab ON ab.branch_id = c.branch_id
      WHERE c.id = urinary_output_records.client_id
      AND ab.admin_id = auth.uid()
    )
  );

CREATE POLICY "Staff can insert urinary output records for their branch clients"
  ON urinary_output_records FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients c
      JOIN admin_branches ab ON ab.branch_id = c.branch_id
      WHERE c.id = urinary_output_records.client_id
      AND ab.admin_id = auth.uid()
    )
  );

CREATE POLICY "Staff can update urinary output records for their branch clients"
  ON urinary_output_records FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM clients c
      JOIN admin_branches ab ON ab.branch_id = c.branch_id
      WHERE c.id = urinary_output_records.client_id
      AND ab.admin_id = auth.uid()
    )
  );

CREATE POLICY "Staff can delete urinary output records for their branch clients"
  ON urinary_output_records FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM clients c
      JOIN admin_branches ab ON ab.branch_id = c.branch_id
      WHERE c.id = urinary_output_records.client_id
      AND ab.admin_id = auth.uid()
    )
  );

-- RLS Policies for fluid_balance_targets
CREATE POLICY "Staff can view fluid balance targets for their branch clients"
  ON fluid_balance_targets FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clients c
      JOIN admin_branches ab ON ab.branch_id = c.branch_id
      WHERE c.id = fluid_balance_targets.client_id
      AND ab.admin_id = auth.uid()
    )
  );

CREATE POLICY "Staff can insert fluid balance targets for their branch clients"
  ON fluid_balance_targets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM clients c
      JOIN admin_branches ab ON ab.branch_id = c.branch_id
      WHERE c.id = fluid_balance_targets.client_id
      AND ab.admin_id = auth.uid()
    )
  );

CREATE POLICY "Staff can update fluid balance targets for their branch clients"
  ON fluid_balance_targets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM clients c
      JOIN admin_branches ab ON ab.branch_id = c.branch_id
      WHERE c.id = fluid_balance_targets.client_id
      AND ab.admin_id = auth.uid()
    )
  );

CREATE POLICY "Staff can delete fluid balance targets for their branch clients"
  ON fluid_balance_targets FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM clients c
      JOIN admin_branches ab ON ab.branch_id = c.branch_id
      WHERE c.id = fluid_balance_targets.client_id
      AND ab.admin_id = auth.uid()
    )
  );

-- Add triggers for updated_at
CREATE TRIGGER update_fluid_intake_records_updated_at
  BEFORE UPDATE ON fluid_intake_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fluid_output_records_updated_at
  BEFORE UPDATE ON fluid_output_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_urinary_output_records_updated_at
  BEFORE UPDATE ON urinary_output_records
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fluid_balance_targets_updated_at
  BEFORE UPDATE ON fluid_balance_targets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
-- Create staff_working_hours table for tracking daily staff availability
CREATE TABLE staff_working_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Date and time
  work_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  
  -- Type of availability
  availability_type TEXT NOT NULL DEFAULT 'shift',
  
  -- Status
  status TEXT NOT NULL DEFAULT 'scheduled',
  
  -- Additional info
  notes TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('scheduled', 'confirmed', 'cancelled')),
  CONSTRAINT valid_type CHECK (availability_type IN ('shift', 'on-call', 'overtime'))
);

-- Create validation trigger for time range instead of CHECK constraint
CREATE OR REPLACE FUNCTION validate_working_hours_time()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.end_time <= NEW.start_time AND NEW.end_time != '00:00:00' THEN
    RAISE EXCEPTION 'end_time must be greater than start_time';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER validate_working_hours_time_trigger
  BEFORE INSERT OR UPDATE ON staff_working_hours
  FOR EACH ROW
  EXECUTE FUNCTION validate_working_hours_time();

-- Indexes for performance
CREATE INDEX idx_staff_working_hours_staff ON staff_working_hours(staff_id);
CREATE INDEX idx_staff_working_hours_date ON staff_working_hours(work_date);
CREATE INDEX idx_staff_working_hours_branch ON staff_working_hours(branch_id);
CREATE INDEX idx_staff_working_hours_lookup ON staff_working_hours(staff_id, work_date);

-- RLS Policies
ALTER TABLE staff_working_hours ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view working hours in their branches"
  ON staff_working_hours FOR SELECT
  USING (
    branch_id IN (
      SELECT branch_id FROM admin_branches WHERE admin_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage working hours in their branches"
  ON staff_working_hours FOR ALL
  USING (
    branch_id IN (
      SELECT branch_id FROM admin_branches WHERE admin_id = auth.uid()
    )
  );
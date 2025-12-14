-- Add late arrival audit trail columns to visit_records
ALTER TABLE visit_records 
ADD COLUMN IF NOT EXISTS late_submitted_by UUID REFERENCES staff(id),
ADD COLUMN IF NOT EXISTS late_submitted_at TIMESTAMPTZ;
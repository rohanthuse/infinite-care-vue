-- Add approval workflow columns to agreements table
ALTER TABLE agreements 
ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'pending_signatures' 
  CHECK (approval_status IN ('pending_signatures', 'pending_review', 'approved', 'rejected', 'archived')),
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS approval_notes TEXT,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS archived_by UUID REFERENCES auth.users(id);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_agreements_approval_status ON agreements(approval_status);
CREATE INDEX IF NOT EXISTS idx_agreements_approved_by ON agreements(approved_by);

-- Add comment for documentation
COMMENT ON COLUMN agreements.approval_status IS 'Tracks admin approval workflow: pending_signatures → pending_review → approved/rejected → archived';
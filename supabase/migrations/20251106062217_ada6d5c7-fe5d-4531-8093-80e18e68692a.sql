-- Add approval tracking columns to agreement_signers
ALTER TABLE agreement_signers 
ADD COLUMN IF NOT EXISTS admin_approved BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_agreement_signers_admin_approved 
ON agreement_signers(admin_approved);

CREATE INDEX IF NOT EXISTS idx_agreement_signers_approved_by 
ON agreement_signers(approved_by);

-- Add comment for documentation
COMMENT ON COLUMN agreement_signers.admin_approved IS 'Whether the signature has been approved by an admin';
COMMENT ON COLUMN agreement_signers.approved_by IS 'The admin user who approved this signature';
COMMENT ON COLUMN agreement_signers.approved_at IS 'Timestamp when the signature was approved';
-- Add signature tracking columns to agreement_signers table
ALTER TABLE agreement_signers 
ADD COLUMN IF NOT EXISTS signed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS signature_file_id UUID REFERENCES agreement_files(id),
ADD COLUMN IF NOT EXISTS signing_status TEXT DEFAULT 'pending' CHECK (signing_status IN ('pending', 'signed', 'declined'));

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_agreement_signers_auth_user_id ON agreement_signers(signer_auth_user_id);
CREATE INDEX IF NOT EXISTS idx_agreement_signers_status ON agreement_signers(signing_status);

-- Extend the staff table with additional fields for comprehensive carer management
ALTER TABLE public.staff 
ADD COLUMN IF NOT EXISTS national_insurance_number TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_relationship TEXT,
ADD COLUMN IF NOT EXISTS dbs_check_date DATE,
ADD COLUMN IF NOT EXISTS dbs_certificate_number TEXT,
ADD COLUMN IF NOT EXISTS dbs_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS qualifications TEXT[],
ADD COLUMN IF NOT EXISTS certifications TEXT[],
ADD COLUMN IF NOT EXISTS training_records JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS contract_start_date DATE,
ADD COLUMN IF NOT EXISTS contract_type TEXT DEFAULT 'permanent',
ADD COLUMN IF NOT EXISTS salary_amount NUMERIC,
ADD COLUMN IF NOT EXISTS salary_frequency TEXT DEFAULT 'monthly',
ADD COLUMN IF NOT EXISTS bank_account_name TEXT,
ADD COLUMN IF NOT EXISTS bank_account_number TEXT,
ADD COLUMN IF NOT EXISTS bank_sort_code TEXT,
ADD COLUMN IF NOT EXISTS bank_name TEXT,
ADD COLUMN IF NOT EXISTS profile_completed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS invitation_sent_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS invitation_accepted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS temporary_password TEXT,
ADD COLUMN IF NOT EXISTS first_login_completed BOOLEAN DEFAULT false;

-- Create a function to send carer invitation
CREATE OR REPLACE FUNCTION public.create_carer_with_invitation(
  p_carer_data JSONB,
  p_branch_id UUID
) RETURNS UUID AS $$
DECLARE
  new_carer_id UUID;
  temp_password TEXT;
BEGIN
  -- Generate a temporary password
  temp_password := encode(gen_random_bytes(12), 'base64');
  
  -- Insert the carer record
  INSERT INTO public.staff (
    first_name, last_name, email, phone, address,
    specialization, availability, experience, date_of_birth,
    national_insurance_number, emergency_contact_name, emergency_contact_phone,
    emergency_contact_relationship, dbs_check_date, dbs_certificate_number,
    dbs_status, qualifications, certifications, contract_start_date,
    contract_type, salary_amount, salary_frequency, bank_account_name,
    bank_account_number, bank_sort_code, bank_name, branch_id,
    temporary_password, invitation_sent_at, status
  ) VALUES (
    p_carer_data->>'first_name',
    p_carer_data->>'last_name',
    p_carer_data->>'email',
    p_carer_data->>'phone',
    p_carer_data->>'address',
    p_carer_data->>'specialization',
    p_carer_data->>'availability',
    p_carer_data->>'experience',
    (p_carer_data->>'date_of_birth')::DATE,
    p_carer_data->>'national_insurance_number',
    p_carer_data->>'emergency_contact_name',
    p_carer_data->>'emergency_contact_phone',
    p_carer_data->>'emergency_contact_relationship',
    (p_carer_data->>'dbs_check_date')::DATE,
    p_carer_data->>'dbs_certificate_number',
    COALESCE(p_carer_data->>'dbs_status', 'pending'),
    CASE WHEN p_carer_data->'qualifications' IS NOT NULL 
         THEN ARRAY(SELECT jsonb_array_elements_text(p_carer_data->'qualifications'))
         ELSE NULL END,
    CASE WHEN p_carer_data->'certifications' IS NOT NULL 
         THEN ARRAY(SELECT jsonb_array_elements_text(p_carer_data->'certifications'))
         ELSE NULL END,
    (p_carer_data->>'contract_start_date')::DATE,
    COALESCE(p_carer_data->>'contract_type', 'permanent'),
    (p_carer_data->>'salary_amount')::NUMERIC,
    COALESCE(p_carer_data->>'salary_frequency', 'monthly'),
    p_carer_data->>'bank_account_name',
    p_carer_data->>'bank_account_number',
    p_carer_data->>'bank_sort_code',
    p_carer_data->>'bank_name',
    p_branch_id,
    temp_password,
    now(),
    'Pending Invitation'
  ) RETURNING id INTO new_carer_id;
  
  RETURN new_carer_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create table for carer invitations tracking
CREATE TABLE IF NOT EXISTS public.carer_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES public.staff(id) ON DELETE CASCADE,
  invitation_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on carer_invitations
ALTER TABLE public.carer_invitations ENABLE ROW LEVEL SECURITY;

-- Create policy for carer invitations
CREATE POLICY "Branch admins can manage carer invitations" ON public.carer_invitations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.staff s
      JOIN public.admin_branches ab ON s.branch_id = ab.branch_id
      WHERE s.id = carer_invitations.staff_id
      AND ab.admin_id = auth.uid()
    )
  );

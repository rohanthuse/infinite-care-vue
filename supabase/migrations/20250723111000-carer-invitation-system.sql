
-- Enhanced carer invitation system with email integration

-- First, ensure the carer_invitations table exists with proper structure
CREATE TABLE IF NOT EXISTS public.carer_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES public.staff(id) ON DELETE CASCADE,
  invitation_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  used_at TIMESTAMP WITH TIME ZONE,
  email_sent_at TIMESTAMP WITH TIME ZONE,
  email_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on carer_invitations
ALTER TABLE public.carer_invitations ENABLE ROW LEVEL SECURITY;

-- Create policy for carer invitations
CREATE POLICY "Branch admins can manage carer invitations" ON public.carer_invitations
  FOR ALL USING (
    has_role(auth.uid(), 'super_admin'::app_role) OR
    EXISTS (
      SELECT 1 FROM public.staff s
      JOIN public.admin_branches ab ON s.branch_id = ab.branch_id
      WHERE s.id = carer_invitations.staff_id
      AND ab.admin_id = auth.uid()
    )
  );

-- Create function to generate secure invitation tokens
CREATE OR REPLACE FUNCTION public.generate_invitation_token()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64url');
END;
$$;

-- Enhanced function to create carer with email invitation
CREATE OR REPLACE FUNCTION public.create_carer_with_invitation(
  p_carer_data JSONB,
  p_branch_id UUID
) RETURNS JSONB AS $$
DECLARE
  new_carer_id UUID;
  invitation_token TEXT;
  branch_record RECORD;
  email_result JSONB;
  function_url TEXT;
BEGIN
  -- Generate invitation token
  invitation_token := generate_invitation_token();
  
  -- Get branch information
  SELECT name INTO branch_record FROM public.branches WHERE id = p_branch_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Branch not found');
  END IF;
  
  -- Insert the carer record
  INSERT INTO public.staff (
    first_name, last_name, email, phone, address,
    specialization, availability, experience, date_of_birth,
    national_insurance_number, emergency_contact_name, emergency_contact_phone,
    emergency_contact_relationship, dbs_check_date, dbs_certificate_number,
    dbs_status, qualifications, certifications, contract_start_date,
    contract_type, salary_amount, salary_frequency, bank_account_name,
    bank_account_number, bank_sort_code, bank_name, branch_id,
    status, created_at, updated_at
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
    'Pending Invitation',
    now(),
    now()
  ) RETURNING id INTO new_carer_id;
  
  -- Create invitation record
  INSERT INTO public.carer_invitations (
    staff_id,
    invitation_token,
    created_by
  ) VALUES (
    new_carer_id,
    invitation_token,
    auth.uid()
  );
  
  -- Construct the function URL for the edge function
  function_url := format('%s/functions/v1/send-carer-invitation', 
    COALESCE(current_setting('app.supabase_url', true), 'https://vcrjntfjsmpoupgairep.supabase.co'));
  
  -- Call the email service using http extension
  BEGIN
    SELECT content::jsonb INTO email_result
    FROM http((
      'POST',
      function_url,
      ARRAY[
        http_header('Content-Type', 'application/json'),
        http_header('Authorization', format('Bearer %s', 
          COALESCE(current_setting('app.service_role_key', true), 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZjcmpudGZqc21wb3VwZ2FpcmVwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTk2NzE0MCwiZXhwIjoyMDY1NTQzMTQwfQ.vHBXgJ8P7p5WmNnPjRxJnqK_t2-QzF_p4lV4x2Qr0WI')))
      ],
      'application/json',
      jsonb_build_object(
        'staff_id', new_carer_id,
        'email', p_carer_data->>'email',
        'first_name', p_carer_data->>'first_name',
        'last_name', p_carer_data->>'last_name',
        'invitation_token', invitation_token,
        'branch_name', branch_record.name
      )::text
    ));
    
    -- Check if email was sent successfully
    IF email_result->>'success' = 'true' THEN
      -- Update invitation record with email details
      UPDATE public.carer_invitations 
      SET email_sent_at = now(),
          email_id = email_result->>'email_id'
      WHERE staff_id = new_carer_id;
      
      -- Update staff record to mark invitation as sent
      UPDATE public.staff 
      SET invitation_sent_at = now()
      WHERE id = new_carer_id;
      
      RETURN jsonb_build_object(
        'success', true, 
        'carer_id', new_carer_id,
        'message', 'Carer created and invitation email sent successfully'
      );
    ELSE
      -- Email failed, but carer was created
      RETURN jsonb_build_object(
        'success', false, 
        'carer_id', new_carer_id,
        'error', format('Carer created but email failed: %s', email_result->>'error')
      );
    END IF;
    
  EXCEPTION WHEN OTHERS THEN
    -- Email service failed, but carer was created
    RETURN jsonb_build_object(
      'success', false, 
      'carer_id', new_carer_id,
      'error', format('Carer created but email service unavailable: %s', SQLERRM)
    );
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to accept carer invitation
CREATE OR REPLACE FUNCTION public.accept_carer_invitation(
  p_invitation_token TEXT,
  p_password TEXT
) RETURNS JSONB AS $$
DECLARE
  invitation_record RECORD;
  staff_record RECORD;
  auth_user_id UUID;
BEGIN  
  -- Find and validate invitation
  SELECT ci.*, s.email, s.first_name, s.last_name 
  INTO invitation_record
  FROM public.carer_invitations ci
  JOIN public.staff s ON ci.staff_id = s.id
  WHERE ci.invitation_token = p_invitation_token
  AND ci.used_at IS NULL
  AND ci.expires_at > now();
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invitation');
  END IF;
  
  -- Create auth user
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    confirmation_token,
    recovery_token,
    email_change_token_new,
    email_change_token_current,
    email_change,
    email_change_confirm_status
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    invitation_record.email,
    crypt(p_password, gen_salt('bf')),
    now(),
    now(),
    now(),
    '',
    '',
    '',
    '',
    '',
    0
  ) RETURNING id INTO auth_user_id;
  
  -- Update staff record
  UPDATE public.staff 
  SET auth_user_id = auth_user_id,
      invitation_accepted_at = now(),
      first_login_completed = false,
      status = 'Active'
  WHERE id = invitation_record.staff_id;
  
  -- Mark invitation as used
  UPDATE public.carer_invitations
  SET used_at = now()
  WHERE id = invitation_record.id;
  
  -- Assign carer role
  INSERT INTO public.user_roles (user_id, role) 
  VALUES (auth_user_id, 'carer')
  ON CONFLICT (user_id, role) DO NOTHING;
  
  RETURN jsonb_build_object(
    'success', true,
    'message', 'Invitation accepted successfully'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

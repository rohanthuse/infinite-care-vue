
-- Fix the generate_invite_token function to use base64 instead of base64url
CREATE OR REPLACE FUNCTION generate_invite_token()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64');
END;
$$;

-- Create third_party_login_sessions table for managing temporary login sessions
CREATE TABLE public.third_party_login_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  third_party_user_id UUID NOT NULL REFERENCES public.third_party_users(id) ON DELETE CASCADE,
  ip_address INET,
  user_agent TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Add indexes for performance
CREATE INDEX idx_third_party_login_sessions_token ON public.third_party_login_sessions(token);
CREATE INDEX idx_third_party_login_sessions_user_id ON public.third_party_login_sessions(third_party_user_id);
CREATE INDEX idx_third_party_login_sessions_expires_at ON public.third_party_login_sessions(expires_at);

-- Enable RLS on the new table
ALTER TABLE public.third_party_login_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policy for login sessions (only allow system access)
CREATE POLICY "Service role can manage login sessions"
  ON public.third_party_login_sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Function to create third-party user accounts after approval
CREATE OR REPLACE FUNCTION create_third_party_user_account(request_id_param UUID)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  request_record RECORD;
  new_user_id UUID;
BEGIN
  -- Get the approved request details
  SELECT * INTO request_record
  FROM public.third_party_access_requests
  WHERE id = request_id_param AND status = 'approved';
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Approved request not found';
  END IF;
  
  -- Create the third-party user account
  INSERT INTO public.third_party_users (
    request_id,
    email,
    first_name,
    surname,
    organisation,
    role,
    branch_id,
    access_type,
    access_expires_at
  ) VALUES (
    request_record.id,
    request_record.email,
    request_record.first_name,
    request_record.surname,
    request_record.organisation,
    request_record.role,
    request_record.branch_id,
    request_record.request_for,
    COALESCE(request_record.access_until, now() + interval '1 year')
  ) RETURNING id INTO new_user_id;
  
  RETURN new_user_id;
END;
$$;

-- Function to create login session for third-party users
CREATE OR REPLACE FUNCTION create_third_party_login_session(
  token_param TEXT,
  user_id_param UUID,
  ip_address_param INET DEFAULT NULL,
  user_agent_param TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  session_id UUID;
BEGIN
  INSERT INTO public.third_party_login_sessions (
    token,
    third_party_user_id,
    ip_address,
    user_agent,
    expires_at
  ) VALUES (
    token_param,
    user_id_param,
    ip_address_param,
    user_agent_param,
    now() + interval '24 hours'
  ) RETURNING id INTO session_id;
  
  RETURN session_id;
END;
$$;

-- Function to validate and get third-party user by login token
CREATE OR REPLACE FUNCTION get_third_party_user_by_token(token_param TEXT)
RETURNS TABLE(
  user_id UUID,
  email TEXT,
  first_name TEXT,
  surname TEXT,
  organisation TEXT,
  role TEXT,
  branch_id UUID,
  access_type third_party_access_type,
  access_expires_at TIMESTAMPTZ,
  is_active BOOLEAN
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    tpu.id,
    tpu.email,
    tpu.first_name,
    tpu.surname,
    tpu.organisation,
    tpu.role,
    tpu.branch_id,
    tpu.access_type,
    tpu.access_expires_at,
    tpu.is_active
  FROM public.third_party_users tpu
  JOIN public.third_party_login_sessions tpls ON tpu.id = tpls.third_party_user_id
  WHERE tpls.token = token_param
    AND tpls.is_active = true
    AND tpls.expires_at > now()
    AND tpu.is_active = true
    AND tpu.access_expires_at > now();
END;
$$;

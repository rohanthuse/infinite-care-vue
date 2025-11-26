-- Add password_hash column to third_party_users table
ALTER TABLE public.third_party_users 
ADD COLUMN IF NOT EXISTS password_hash TEXT;

-- Add access_expires_at column if not exists
ALTER TABLE public.third_party_users 
ADD COLUMN IF NOT EXISTS access_expires_at TIMESTAMPTZ;

-- Create function to authenticate third-party users
CREATE OR REPLACE FUNCTION public.authenticate_third_party_user(
  p_email TEXT,
  p_password TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user RECORD;
  v_session_token TEXT;
  v_result JSON;
BEGIN
  -- Find the user by email
  SELECT 
    tpu.*,
    tpar.request_for,
    tpar.branch_id,
    tpar.access_until,
    b.name as branch_name,
    b.organization_id
  INTO v_user
  FROM third_party_users tpu
  JOIN third_party_access_requests tpar ON tpar.id = tpu.request_id
  JOIN branches b ON b.id = tpar.branch_id
  WHERE tpu.email = p_email
    AND tpu.is_active = true
    AND tpar.status = 'approved'
  LIMIT 1;

  -- Check if user exists
  IF v_user IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid email or password'
    );
  END IF;

  -- Verify password using pgcrypto
  IF v_user.password_hash IS NULL OR v_user.password_hash != crypt(p_password, v_user.password_hash) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid email or password'
    );
  END IF;

  -- Check access expiry
  IF v_user.access_until IS NOT NULL AND v_user.access_until < NOW() THEN
    -- Deactivate the user
    UPDATE third_party_users SET is_active = false WHERE id = v_user.id;
    
    RETURN json_build_object(
      'success', false,
      'error', 'Access has expired'
    );
  END IF;

  -- Generate session token
  v_session_token := encode(gen_random_bytes(32), 'hex');

  -- Create session record
  INSERT INTO third_party_sessions (
    user_id,
    session_token,
    expires_at
  ) VALUES (
    v_user.id,
    v_session_token,
    COALESCE(v_user.access_until, NOW() + INTERVAL '24 hours')
  );

  -- Update last login
  UPDATE third_party_users 
  SET last_login_at = NOW()
  WHERE id = v_user.id;

  -- Return success with user info
  RETURN json_build_object(
    'success', true,
    'user', json_build_object(
      'id', v_user.id,
      'email', v_user.email,
      'full_name', v_user.full_name,
      'access_scope', v_user.request_for,
      'branch_id', v_user.branch_id,
      'branch_name', v_user.branch_name,
      'organization_id', v_user.organization_id,
      'access_expires_at', v_user.access_until
    ),
    'session_token', v_session_token
  );
END;
$$;

-- Create third_party_sessions table if not exists
CREATE TABLE IF NOT EXISTS public.third_party_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.third_party_users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Enable RLS on third_party_sessions
ALTER TABLE public.third_party_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy for third_party_sessions
CREATE POLICY "Allow insert for authenticated users" ON public.third_party_sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow select for session owners" ON public.third_party_sessions
  FOR SELECT USING (true);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_third_party_users_email ON public.third_party_users(email);
CREATE INDEX IF NOT EXISTS idx_third_party_sessions_token ON public.third_party_sessions(session_token);

-- Enable pgcrypto extension if not exists
CREATE EXTENSION IF NOT EXISTS pgcrypto;
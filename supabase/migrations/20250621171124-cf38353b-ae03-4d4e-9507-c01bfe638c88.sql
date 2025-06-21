
-- Create enum for third-party access request status
CREATE TYPE third_party_request_status AS ENUM ('pending', 'approved', 'rejected', 'expired', 'revoked');

-- Create enum for third-party access types
CREATE TYPE third_party_access_type AS ENUM ('client', 'staff', 'both');

-- Create third_party_access_requests table
CREATE TABLE public.third_party_access_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  surname TEXT NOT NULL,
  email TEXT NOT NULL,
  organisation TEXT,
  role TEXT,
  request_for third_party_access_type NOT NULL DEFAULT 'client',
  client_consent_required BOOLEAN NOT NULL DEFAULT true,
  reason_for_access TEXT NOT NULL,
  access_from TIMESTAMPTZ NOT NULL,
  access_until TIMESTAMPTZ,
  status third_party_request_status NOT NULL DEFAULT 'pending',
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  rejection_reason TEXT,
  invite_token TEXT UNIQUE,
  invite_sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create third_party_users table for temporary user accounts
CREATE TABLE public.third_party_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES public.third_party_access_requests(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  first_name TEXT NOT NULL,
  surname TEXT NOT NULL,
  organisation TEXT,
  role TEXT,
  branch_id UUID NOT NULL REFERENCES public.branches(id) ON DELETE CASCADE,
  access_type third_party_access_type NOT NULL,
  access_expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMPTZ,
  login_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create third_party_sessions table for tracking access
CREATE TABLE public.third_party_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  third_party_user_id UUID NOT NULL REFERENCES public.third_party_users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  ip_address INET,
  user_agent TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  is_active BOOLEAN NOT NULL DEFAULT true
);

-- Create third_party_access_logs table for audit trail
CREATE TABLE public.third_party_access_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  third_party_user_id UUID NOT NULL REFERENCES public.third_party_users(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.third_party_sessions(id),
  action TEXT NOT NULL,
  resource_type TEXT,
  resource_id UUID,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX idx_third_party_requests_branch_id ON public.third_party_access_requests(branch_id);
CREATE INDEX idx_third_party_requests_status ON public.third_party_access_requests(status);
CREATE INDEX idx_third_party_requests_email ON public.third_party_access_requests(email);
CREATE INDEX idx_third_party_users_branch_id ON public.third_party_users(branch_id);
CREATE INDEX idx_third_party_users_email ON public.third_party_users(email);
CREATE INDEX idx_third_party_sessions_user_id ON public.third_party_sessions(third_party_user_id);
CREATE INDEX idx_third_party_logs_user_id ON public.third_party_access_logs(third_party_user_id);

-- Add updated_at trigger for third_party_access_requests
CREATE TRIGGER handle_third_party_requests_updated_at
  BEFORE UPDATE ON public.third_party_access_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add updated_at trigger for third_party_users
CREATE TRIGGER handle_third_party_users_updated_at
  BEFORE UPDATE ON public.third_party_users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Enable RLS on all tables
ALTER TABLE public.third_party_access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.third_party_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.third_party_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.third_party_access_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for third_party_access_requests
CREATE POLICY "Super admins can manage all third party requests"
  ON public.third_party_access_requests
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin'
    )
  );

CREATE POLICY "Branch admins can manage requests for their branches"
  ON public.third_party_access_requests
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role = 'branch_admin'
    )
    AND EXISTS (
      SELECT 1 FROM public.admin_branches ab
      WHERE ab.admin_id = auth.uid() AND ab.branch_id = third_party_access_requests.branch_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role = 'branch_admin'
    )
    AND EXISTS (
      SELECT 1 FROM public.admin_branches ab
      WHERE ab.admin_id = auth.uid() AND ab.branch_id = third_party_access_requests.branch_id
    )
  );

-- RLS Policies for third_party_users
CREATE POLICY "Super admins can view all third party users"
  ON public.third_party_users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role = 'super_admin'
    )
  );

CREATE POLICY "Branch admins can view third party users for their branches"
  ON public.third_party_users
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role = 'branch_admin'
    )
    AND EXISTS (
      SELECT 1 FROM public.admin_branches ab
      WHERE ab.admin_id = auth.uid() AND ab.branch_id = third_party_users.branch_id
    )
  );

-- RLS Policies for third_party_sessions
CREATE POLICY "Admins can view third party sessions"
  ON public.third_party_sessions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role IN ('super_admin', 'branch_admin')
    )
  );

-- RLS Policies for third_party_access_logs
CREATE POLICY "Admins can view third party access logs"
  ON public.third_party_access_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles ur 
      WHERE ur.user_id = auth.uid() AND ur.role IN ('super_admin', 'branch_admin')
    )
  );

-- Function to generate secure invite tokens
CREATE OR REPLACE FUNCTION generate_invite_token()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN encode(gen_random_bytes(32), 'base64url');
END;
$$;

-- Function to automatically expire access
CREATE OR REPLACE FUNCTION expire_third_party_access()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  -- Expire requests that have passed their access_until date
  UPDATE public.third_party_access_requests
  SET status = 'expired', updated_at = now()
  WHERE status = 'approved' 
    AND access_until IS NOT NULL 
    AND access_until < now();
    
  -- Deactivate third-party users whose access has expired
  UPDATE public.third_party_users
  SET is_active = false, updated_at = now()
  WHERE is_active = true 
    AND access_expires_at < now();
    
  -- End active sessions for expired users
  UPDATE public.third_party_sessions
  SET is_active = false, ended_at = now()
  WHERE is_active = true
    AND third_party_user_id IN (
      SELECT id FROM public.third_party_users WHERE is_active = false
    );
END;
$$;

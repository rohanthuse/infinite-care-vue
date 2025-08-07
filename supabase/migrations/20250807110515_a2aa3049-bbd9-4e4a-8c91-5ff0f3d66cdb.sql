-- Phase 1: System Administration Portal - Database Structure

-- Create enum for system roles
CREATE TYPE public.system_role AS ENUM ('super_admin', 'tenant_manager', 'support_admin', 'analytics_viewer');

-- Create system_users table for system administrators
CREATE TABLE public.system_users (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  encrypted_password TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMP WITH TIME ZONE,
  failed_login_attempts INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.system_users(id)
);

-- Create system_user_roles table for role assignments
CREATE TABLE public.system_user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  system_user_id UUID NOT NULL REFERENCES public.system_users(id) ON DELETE CASCADE,
  role public.system_role NOT NULL,
  granted_by UUID REFERENCES public.system_users(id),
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(system_user_id, role)
);

-- Create system_sessions table for session management
CREATE TABLE public.system_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  system_user_id UUID NOT NULL REFERENCES public.system_users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  ip_address INET,
  user_agent TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create system_audit_logs table for tracking actions
CREATE TABLE public.system_audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  system_user_id UUID REFERENCES public.system_users(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all system tables
ALTER TABLE public.system_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_audit_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for system_users
CREATE POLICY "System users can view themselves" ON public.system_users
  FOR SELECT USING (id = (current_setting('app.current_system_user_id', true))::uuid);

CREATE POLICY "Super admins can manage all system users" ON public.system_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.system_user_roles sur
      WHERE sur.system_user_id = (current_setting('app.current_system_user_id', true))::uuid
      AND sur.role = 'super_admin'
    )
  );

-- Create RLS policies for system_user_roles
CREATE POLICY "Users can view their own roles" ON public.system_user_roles
  FOR SELECT USING (system_user_id = (current_setting('app.current_system_user_id', true))::uuid);

CREATE POLICY "Super admins can manage all roles" ON public.system_user_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.system_user_roles sur
      WHERE sur.system_user_id = (current_setting('app.current_system_user_id', true))::uuid
      AND sur.role = 'super_admin'
    )
  );

-- Create RLS policies for system_sessions
CREATE POLICY "Users can view their own sessions" ON public.system_sessions
  FOR SELECT USING (system_user_id = (current_setting('app.current_system_user_id', true))::uuid);

CREATE POLICY "Super admins can view all sessions" ON public.system_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.system_user_roles sur
      WHERE sur.system_user_id = (current_setting('app.current_system_user_id', true))::uuid
      AND sur.role = 'super_admin'
    )
  );

-- Create RLS policies for system_audit_logs
CREATE POLICY "Super admins can view all audit logs" ON public.system_audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.system_user_roles sur
      WHERE sur.system_user_id = (current_setting('app.current_system_user_id', true))::uuid
      AND sur.role = 'super_admin'
    )
  );

-- Create system authentication functions
CREATE OR REPLACE FUNCTION public.system_authenticate(
  p_email TEXT,
  p_password TEXT,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_record RECORD;
  v_session_token TEXT;
  v_session_id UUID;
  v_expires_at TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Check if user exists and is active
  SELECT * INTO v_user_record
  FROM public.system_users
  WHERE email = p_email AND is_active = true;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid credentials');
  END IF;

  -- Check if account is locked
  IF v_user_record.locked_until IS NOT NULL AND v_user_record.locked_until > now() THEN
    RETURN json_build_object('success', false, 'error', 'Account is temporarily locked');
  END IF;

  -- Verify password (simplified - in production use proper hashing)
  IF NOT (v_user_record.encrypted_password = crypt(p_password, v_user_record.encrypted_password)) THEN
    -- Increment failed attempts
    UPDATE public.system_users
    SET failed_login_attempts = failed_login_attempts + 1,
        locked_until = CASE WHEN failed_login_attempts >= 4 THEN now() + interval '15 minutes' ELSE NULL END
    WHERE id = v_user_record.id;
    
    RETURN json_build_object('success', false, 'error', 'Invalid credentials');
  END IF;

  -- Reset failed attempts on successful login
  UPDATE public.system_users
  SET failed_login_attempts = 0,
      locked_until = NULL,
      last_login_at = now()
  WHERE id = v_user_record.id;

  -- Generate session token
  v_session_token := encode(gen_random_bytes(32), 'base64');
  v_expires_at := now() + interval '8 hours';

  -- Create session
  INSERT INTO public.system_sessions (system_user_id, session_token, ip_address, user_agent, expires_at)
  VALUES (v_user_record.id, v_session_token, p_ip_address, p_user_agent, v_expires_at)
  RETURNING id INTO v_session_id;

  -- Log successful login
  INSERT INTO public.system_audit_logs (system_user_id, action, resource_type, ip_address, user_agent)
  VALUES (v_user_record.id, 'login', 'system_session', p_ip_address, p_user_agent);

  RETURN json_build_object(
    'success', true,
    'session_token', v_session_token,
    'expires_at', v_expires_at,
    'user', json_build_object(
      'id', v_user_record.id,
      'email', v_user_record.email,
      'first_name', v_user_record.first_name,
      'last_name', v_user_record.last_name
    )
  );
END;
$$;

-- Create function to validate system session
CREATE OR REPLACE FUNCTION public.system_validate_session(p_session_token TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session_record RECORD;
  v_user_record RECORD;
  v_roles TEXT[];
BEGIN
  -- Find active session
  SELECT s.*, u.email, u.first_name, u.last_name, u.is_active
  INTO v_session_record
  FROM public.system_sessions s
  JOIN public.system_users u ON s.system_user_id = u.id
  WHERE s.session_token = p_session_token
    AND s.expires_at > now()
    AND u.is_active = true;

  IF NOT FOUND THEN
    RETURN json_build_object('success', false, 'error', 'Invalid or expired session');
  END IF;

  -- Update last activity
  UPDATE public.system_sessions
  SET last_activity_at = now()
  WHERE id = v_session_record.id;

  -- Get user roles
  SELECT array_agg(role::text) INTO v_roles
  FROM public.system_user_roles
  WHERE system_user_id = v_session_record.system_user_id;

  -- Set current user context for RLS
  PERFORM set_config('app.current_system_user_id', v_session_record.system_user_id::text, true);

  RETURN json_build_object(
    'success', true,
    'user', json_build_object(
      'id', v_session_record.system_user_id,
      'email', v_session_record.email,
      'first_name', v_session_record.first_name,
      'last_name', v_session_record.last_name,
      'roles', COALESCE(v_roles, ARRAY[]::text[])
    )
  );
END;
$$;

-- Create function to logout system user
CREATE OR REPLACE FUNCTION public.system_logout(p_session_token TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session_record RECORD;
BEGIN
  SELECT * INTO v_session_record
  FROM public.system_sessions
  WHERE session_token = p_session_token;

  IF FOUND THEN
    DELETE FROM public.system_sessions WHERE id = v_session_record.id;
    
    -- Log logout
    INSERT INTO public.system_audit_logs (system_user_id, action, resource_type)
    VALUES (v_session_record.system_user_id, 'logout', 'system_session');
  END IF;

  RETURN json_build_object('success', true);
END;
$$;

-- Create initial super admin user (password: 'admin123')
INSERT INTO public.system_users (email, encrypted_password, first_name, last_name)
VALUES (
  'admin@system.local',
  crypt('admin123', gen_salt('bf')),
  'System',
  'Administrator'
) ON CONFLICT (email) DO NOTHING;

-- Assign super_admin role to initial user
INSERT INTO public.system_user_roles (system_user_id, role)
SELECT id, 'super_admin'
FROM public.system_users
WHERE email = 'admin@system.local'
ON CONFLICT (system_user_id, role) DO NOTHING;
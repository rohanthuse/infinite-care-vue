-- Create function to hash password using pgcrypto from extensions schema
CREATE OR REPLACE FUNCTION public.hash_password(password_text TEXT)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
  SELECT extensions.crypt(password_text, extensions.gen_salt('bf', 10));
$$;

-- Create function to create third-party user with hashed password
CREATE OR REPLACE FUNCTION public.create_third_party_user_with_password(
  p_request_id UUID,
  p_email TEXT,
  p_full_name TEXT,
  p_password TEXT,
  p_access_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_user_id UUID;
  v_password_hash TEXT;
BEGIN
  -- Hash the password using extensions schema
  v_password_hash := extensions.crypt(p_password, extensions.gen_salt('bf', 10));
  
  -- Check if user already exists for this request
  SELECT id INTO v_user_id
  FROM third_party_users
  WHERE request_id = p_request_id;
  
  IF v_user_id IS NOT NULL THEN
    -- Update existing user
    UPDATE third_party_users
    SET 
      email = p_email,
      full_name = p_full_name,
      password_hash = v_password_hash,
      access_expires_at = p_access_expires_at,
      is_active = true,
      updated_at = NOW()
    WHERE id = v_user_id;
  ELSE
    -- Create new user
    INSERT INTO third_party_users (
      request_id,
      email,
      full_name,
      password_hash,
      access_expires_at,
      is_active
    ) VALUES (
      p_request_id,
      p_email,
      p_full_name,
      v_password_hash,
      p_access_expires_at,
      true
    )
    RETURNING id INTO v_user_id;
  END IF;
  
  RETURN v_user_id;
END;
$$;

-- Also update the authenticate function to use extensions schema
CREATE OR REPLACE FUNCTION public.authenticate_third_party_user(
  p_email TEXT,
  p_password TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_user RECORD;
  v_session_token TEXT;
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

  -- Verify password using pgcrypto from extensions
  IF v_user.password_hash IS NULL OR v_user.password_hash != extensions.crypt(p_password, v_user.password_hash) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Invalid email or password'
    );
  END IF;

  -- Check access expiry
  IF v_user.access_until IS NOT NULL AND v_user.access_until < NOW() THEN
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
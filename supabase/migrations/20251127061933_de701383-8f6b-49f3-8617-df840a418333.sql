-- Fix the authenticate_third_party_user function with correct column names
CREATE OR REPLACE FUNCTION public.authenticate_third_party_user(p_email text, p_password text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions'
AS $$
DECLARE
  v_user RECORD;
  v_session_token TEXT;
  v_session_id UUID;
BEGIN
  -- Find the user by email and join with access request for expiry info
  SELECT 
    tpu.*,
    tpu.first_name || ' ' || tpu.surname as full_name,
    tpar.request_for,
    tpar.branch_id as request_branch_id,
    tpar.access_until,
    b.name as branch_name,
    b.organization_id
  INTO v_user
  FROM third_party_users tpu
  JOIN third_party_access_requests tpar ON tpar.id = tpu.request_id
  JOIN branches b ON b.id = tpu.branch_id
  WHERE tpu.email = p_email
    AND tpu.is_active = true
    AND tpar.status = 'approved'
  LIMIT 1;

  -- Check if user exists
  IF v_user IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Invalid email or password');
  END IF;

  -- Verify password using pgcrypto
  IF v_user.password_hash IS NULL OR 
     v_user.password_hash != extensions.crypt(p_password, v_user.password_hash) THEN
    RETURN json_build_object('success', false, 'error', 'Invalid email or password');
  END IF;

  -- Check access expiry (use access_expires_at from user or access_until from request)
  IF v_user.access_expires_at IS NOT NULL AND v_user.access_expires_at < NOW() THEN
    UPDATE third_party_users SET is_active = false WHERE id = v_user.id;
    RETURN json_build_object('success', false, 'error', 'Your access has expired');
  END IF;

  IF v_user.access_until IS NOT NULL AND v_user.access_until < NOW() THEN
    UPDATE third_party_users SET is_active = false WHERE id = v_user.id;
    RETURN json_build_object('success', false, 'error', 'Your access has expired');
  END IF;

  -- Generate session token
  v_session_token := encode(gen_random_bytes(32), 'hex');
  v_session_id := gen_random_uuid();

  -- Create session record with CORRECT column names (third_party_user_id, started_at)
  INSERT INTO third_party_sessions (
    id,
    third_party_user_id,
    session_token,
    started_at,
    last_activity_at,
    is_active
  ) VALUES (
    v_session_id,
    v_user.id,
    v_session_token,
    NOW(),
    NOW(),
    true
  );

  -- Update login count and last login
  UPDATE third_party_users 
  SET 
    last_login_at = NOW(),
    login_count = COALESCE(login_count, 0) + 1
  WHERE id = v_user.id;

  -- Return success with complete user info
  RETURN json_build_object(
    'success', true,
    'user', json_build_object(
      'id', v_user.id,
      'email', v_user.email,
      'first_name', v_user.first_name,
      'surname', v_user.surname,
      'full_name', v_user.full_name,
      'access_scope', v_user.request_for,
      'branch_id', v_user.branch_id,
      'branch_name', v_user.branch_name,
      'organization_id', v_user.organization_id,
      'access_expires_at', COALESCE(v_user.access_expires_at, v_user.access_until)
    ),
    'session_token', v_session_token
  );
END;
$$;
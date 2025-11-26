-- Fix create_third_party_user_with_password function to use correct column names
CREATE OR REPLACE FUNCTION public.create_third_party_user_with_password(
  p_request_id UUID,
  p_email TEXT,
  p_first_name TEXT,
  p_surname TEXT,
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
  v_hashed_password TEXT;
  v_branch_id UUID;
  v_request_for TEXT;
  v_access_type TEXT;
BEGIN
  -- Get branch_id and request_for from the access request
  SELECT branch_id, request_for INTO v_branch_id, v_request_for
  FROM third_party_access_requests
  WHERE id = p_request_id;
  
  IF v_branch_id IS NULL THEN
    RAISE EXCEPTION 'Access request not found or missing branch_id';
  END IF;
  
  -- Map request_for to access_type enum
  v_access_type := CASE 
    WHEN v_request_for = 'client' THEN 'client_records'
    WHEN v_request_for = 'staff' THEN 'staff_records'
    ELSE 'client_records'
  END;

  -- Hash the password using pgcrypto
  v_hashed_password := extensions.crypt(p_password, extensions.gen_salt('bf'));
  
  -- Generate UUID for the new user
  v_user_id := gen_random_uuid();
  
  -- Insert the third-party user with correct column names
  INSERT INTO third_party_users (
    id,
    request_id,
    email,
    first_name,
    surname,
    password_hash,
    branch_id,
    access_type,
    access_expires_at,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    p_request_id,
    p_email,
    p_first_name,
    p_surname,
    v_hashed_password,
    v_branch_id,
    v_access_type::third_party_access_type,
    COALESCE(p_access_expires_at, NOW() + INTERVAL '30 days'),
    true,
    NOW(),
    NOW()
  );
  
  RETURN v_user_id;
END;
$$;
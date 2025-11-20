-- Create session validation function that accepts token as parameter
CREATE OR REPLACE FUNCTION public.validate_system_session(p_session_token text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  v_system_user_id uuid;
BEGIN
  IF p_session_token IS NULL OR p_session_token = '' THEN
    RETURN NULL;
  END IF;
  
  -- Validate session and get user_id
  SELECT ss.system_user_id INTO v_system_user_id
  FROM public.system_sessions ss
  JOIN public.system_users su ON ss.system_user_id = su.id
  WHERE ss.session_token = p_session_token
    AND ss.expires_at > now()
    AND ss.last_activity_at > now() - interval '1 hour'
    AND su.is_active = true
  LIMIT 1;
  
  -- Update activity if valid
  IF v_system_user_id IS NOT NULL THEN
    UPDATE public.system_sessions
    SET last_activity_at = now()
    WHERE session_token = p_session_token;
  END IF;
  
  RETURN v_system_user_id;
END;
$$;

-- Create subscription plan with session validation
CREATE OR REPLACE FUNCTION public.create_subscription_plan_as_admin(
  p_session_token text,
  p_name text,
  p_description text,
  p_max_users integer,
  p_max_branches integer,
  p_price_monthly numeric,
  p_price_yearly numeric,
  p_features jsonb,
  p_is_active boolean
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_system_user_id uuid;
  v_plan_id uuid;
  v_is_admin boolean;
BEGIN
  -- Validate session
  v_system_user_id := validate_system_session(p_session_token);
  
  IF v_system_user_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired session. Please log in again.';
  END IF;
  
  -- Check if user is super_admin
  SELECT EXISTS (
    SELECT 1 FROM system_user_roles
    WHERE system_user_id = v_system_user_id AND role = 'super_admin'
  ) INTO v_is_admin;
  
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Permission denied: Only system administrators can create subscription plans';
  END IF;
  
  -- Insert the plan
  INSERT INTO subscription_plans (
    name, description, max_users, max_branches,
    price_monthly, price_yearly, features, is_active
  ) VALUES (
    p_name, p_description, p_max_users, p_max_branches,
    p_price_monthly, p_price_yearly, p_features, p_is_active
  )
  RETURNING id INTO v_plan_id;
  
  RETURN v_plan_id;
END;
$$;

-- Delete subscription plan with session validation
CREATE OR REPLACE FUNCTION public.delete_subscription_plan_as_admin(
  p_session_token text,
  p_plan_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_system_user_id uuid;
  v_is_admin boolean;
  v_org_count integer;
BEGIN
  -- Validate session
  v_system_user_id := validate_system_session(p_session_token);
  
  IF v_system_user_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired session. Please log in again.';
  END IF;
  
  -- Check if user is super_admin
  SELECT EXISTS (
    SELECT 1 FROM system_user_roles
    WHERE system_user_id = v_system_user_id AND role = 'super_admin'
  ) INTO v_is_admin;
  
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Permission denied: Only system administrators can delete subscription plans';
  END IF;
  
  -- Check if any organizations are using this plan
  SELECT COUNT(*) INTO v_org_count
  FROM organizations
  WHERE subscription_plan_id = p_plan_id;
  
  IF v_org_count > 0 THEN
    RAISE EXCEPTION 'Cannot delete plan: % organization(s) are currently using this plan', v_org_count;
  END IF;
  
  -- Delete the plan
  DELETE FROM subscription_plans WHERE id = p_plan_id;
  
  RETURN true;
END;
$$;

-- Update subscription plan with session validation
CREATE OR REPLACE FUNCTION public.update_subscription_plan_as_admin(
  p_session_token text,
  p_plan_id uuid,
  p_name text,
  p_description text,
  p_max_users integer,
  p_max_branches integer,
  p_price_monthly numeric,
  p_price_yearly numeric,
  p_features jsonb,
  p_is_active boolean
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_system_user_id uuid;
  v_is_admin boolean;
BEGIN
  -- Validate session
  v_system_user_id := validate_system_session(p_session_token);
  
  IF v_system_user_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired session. Please log in again.';
  END IF;
  
  -- Check if user is super_admin
  SELECT EXISTS (
    SELECT 1 FROM system_user_roles
    WHERE system_user_id = v_system_user_id AND role = 'super_admin'
  ) INTO v_is_admin;
  
  IF NOT v_is_admin THEN
    RAISE EXCEPTION 'Permission denied: Only system administrators can update subscription plans';
  END IF;
  
  -- Update the plan
  UPDATE subscription_plans
  SET 
    name = p_name,
    description = p_description,
    max_users = p_max_users,
    max_branches = p_max_branches,
    price_monthly = p_price_monthly,
    price_yearly = p_price_yearly,
    features = p_features,
    is_active = p_is_active,
    updated_at = now()
  WHERE id = p_plan_id;
  
  RETURN true;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.validate_system_session(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_subscription_plan_as_admin(text, text, text, integer, integer, numeric, numeric, jsonb, boolean) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_subscription_plan_as_admin(text, uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.update_subscription_plan_as_admin(text, uuid, text, text, integer, integer, numeric, numeric, jsonb, boolean) TO anon, authenticated;
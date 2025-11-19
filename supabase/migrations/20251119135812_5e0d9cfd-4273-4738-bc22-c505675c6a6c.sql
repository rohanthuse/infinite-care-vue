-- Add database-level subscription limit validation
-- This ensures subscription limits are enforced even if frontend validation is bypassed

-- Function to check subscription limit before client insert
CREATE OR REPLACE FUNCTION check_subscription_limit_before_client_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_subscription_plan TEXT;
  v_max_limit INTEGER;
  v_current_count INTEGER;
BEGIN
  -- Get organization's subscription plan
  SELECT subscription_plan INTO v_subscription_plan
  FROM organizations
  WHERE id = NEW.organization_id;

  -- If no organization found, allow insert (for backwards compatibility)
  IF v_subscription_plan IS NULL THEN
    RETURN NEW;
  END IF;

  -- Map subscription plan to limit
  v_max_limit := CASE v_subscription_plan
    WHEN '0-10' THEN 10
    WHEN '11-25' THEN 25
    WHEN '26-50' THEN 50
    WHEN '51-100' THEN 100
    WHEN '101-250' THEN 250
    WHEN '251-500' THEN 500
    WHEN '500+' THEN 999999 -- Effectively unlimited
    WHEN 'basic' THEN 50
    ELSE 50 -- Default fallback
  END;

  -- Count current clients for this organization
  SELECT COUNT(*) INTO v_current_count
  FROM clients
  WHERE organization_id = NEW.organization_id;

  -- Check if limit would be exceeded
  IF v_current_count >= v_max_limit THEN
    RAISE EXCEPTION 'Subscription limit reached: % plan allows maximum % clients, currently have %', 
      v_subscription_plan, v_max_limit, v_current_count
      USING ERRCODE = '23514'; -- check_violation error code
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on clients table
DROP TRIGGER IF EXISTS enforce_subscription_limit ON clients;
CREATE TRIGGER enforce_subscription_limit
  BEFORE INSERT ON clients
  FOR EACH ROW
  EXECUTE FUNCTION check_subscription_limit_before_client_insert();

-- Add helpful comment
COMMENT ON FUNCTION check_subscription_limit_before_client_insert() IS 
  'Enforces subscription plan limits by preventing client creation when organization has reached their plan limit. Validates based on subscription_plan field in organizations table.';
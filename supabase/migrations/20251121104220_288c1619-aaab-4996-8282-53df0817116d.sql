-- Function to check subscription limits before inserting clients
CREATE OR REPLACE FUNCTION check_subscription_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  org_id UUID;
  max_clients INTEGER;
  current_count INTEGER;
  org_max_users INTEGER;
BEGIN
  -- Get the organization_id from the branch
  SELECT organization_id INTO org_id
  FROM branches
  WHERE id = NEW.branch_id;
  
  IF org_id IS NULL THEN
    RAISE EXCEPTION 'Invalid branch_id: branch not found';
  END IF;
  
  -- Get the organization's max_users
  SELECT max_users INTO org_max_users
  FROM organizations
  WHERE id = org_id;
  
  -- Determine max_clients from max_users
  max_clients := COALESCE(org_max_users, 50);
  
  -- Count current clients across all branches in this organization
  SELECT COUNT(*) INTO current_count
  FROM clients c
  JOIN branches b ON c.branch_id = b.id
  WHERE b.organization_id = org_id;
  
  -- Check if limit would be exceeded
  IF current_count >= max_clients THEN
    RAISE EXCEPTION 'Subscription limit reached. Your plan allows % clients, and you currently have %. Please upgrade your subscription to add more clients.', 
      max_clients, current_count
    USING ERRCODE = 'P0001';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on clients table
DROP TRIGGER IF EXISTS trigger_check_subscription_limit ON clients;
CREATE TRIGGER trigger_check_subscription_limit
  BEFORE INSERT ON clients
  FOR EACH ROW
  EXECUTE FUNCTION check_subscription_limit();

-- Add helpful comment
COMMENT ON FUNCTION check_subscription_limit() IS 
  'Enforces subscription limits by blocking client inserts when organization has reached max_users limit';
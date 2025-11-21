-- Function to get max_users from subscription_plan string
CREATE OR REPLACE FUNCTION get_max_users_from_plan(plan_text TEXT)
RETURNS INTEGER
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  -- Match against known plan formats
  CASE 
    WHEN plan_text = '0-10' THEN RETURN 10;
    WHEN plan_text = '11-25' THEN RETURN 25;
    WHEN plan_text = '26-50' THEN RETURN 50;
    WHEN plan_text = '51-100' THEN RETURN 100;
    WHEN plan_text = '101-250' THEN RETURN 250;
    WHEN plan_text = '251-500' THEN RETURN 500;
    WHEN plan_text = '500+' THEN RETURN 999999;
    WHEN plan_text = 'free' THEN RETURN 10;
    WHEN plan_text = 'basic' THEN RETURN 50;
    WHEN plan_text = 'professional' THEN RETURN 150;
    WHEN plan_text = 'enterprise' THEN RETURN 500;
    ELSE RETURN 50; -- Default fallback
  END CASE;
END;
$$;

-- Trigger function to auto-sync max_users when subscription_plan changes
CREATE OR REPLACE FUNCTION sync_organization_max_users()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Only update max_users if subscription_plan changed
  IF NEW.subscription_plan IS DISTINCT FROM OLD.subscription_plan THEN
    NEW.max_users := get_max_users_from_plan(NEW.subscription_plan);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger on organizations table
DROP TRIGGER IF EXISTS trigger_sync_max_users ON organizations;
CREATE TRIGGER trigger_sync_max_users
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION sync_organization_max_users();

-- Fix all existing organizations where max_users doesn't match plan
UPDATE organizations
SET max_users = get_max_users_from_plan(subscription_plan)
WHERE max_users != get_max_users_from_plan(subscription_plan);
-- Fix user-organization association and extra time record creation
-- First, ensure the organization_id is properly handled in extra time records

-- The RLS policy on extra_time_records requires organization_id = get_user_organization_id(auth.uid())
-- But the insertion is not including organization_id, causing the violation

-- Let's update the RLS policy to be more flexible and allow setting organization_id explicitly
-- or derive it from the branch when not provided

-- Drop the existing policy
DROP POLICY IF EXISTS "Organization members can manage extra time records" ON public.extra_time_records;

-- Create a new policy that allows organization members to manage records
-- where the organization_id matches their organization OR is derived from the branch
CREATE POLICY "Organization members can manage extra time records" 
ON public.extra_time_records 
FOR ALL 
USING (
  -- Allow if organization_id matches user's organization
  organization_id = get_user_organization_id(auth.uid()) 
  OR 
  -- Allow if branch belongs to user's organization (when organization_id is null)
  (organization_id IS NULL AND branch_id IN (
    SELECT b.id 
    FROM branches b 
    WHERE b.organization_id = get_user_organization_id(auth.uid())
  ))
)
WITH CHECK (
  -- For inserts/updates, ensure organization_id matches user's organization
  organization_id = get_user_organization_id(auth.uid()) 
  OR 
  -- Allow if branch belongs to user's organization (will auto-set organization_id via trigger)
  (organization_id IS NULL AND branch_id IN (
    SELECT b.id 
    FROM branches b 
    WHERE b.organization_id = get_user_organization_id(auth.uid())
  ))
);

-- Create a trigger to automatically set organization_id from branch when inserting extra time records
CREATE OR REPLACE FUNCTION set_extra_time_organization_id()
RETURNS TRIGGER AS $$
BEGIN
  -- If organization_id is not set, get it from the branch
  IF NEW.organization_id IS NULL THEN
    SELECT b.organization_id INTO NEW.organization_id
    FROM branches b
    WHERE b.id = NEW.branch_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
CREATE TRIGGER set_extra_time_organization_id_trigger
  BEFORE INSERT ON public.extra_time_records
  FOR EACH ROW
  EXECUTE FUNCTION set_extra_time_organization_id();
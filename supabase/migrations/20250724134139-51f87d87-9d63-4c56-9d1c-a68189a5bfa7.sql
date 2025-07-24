-- Clean up conflicting user roles - keep only the highest priority role per user
-- Priority: super_admin > branch_admin > carer > client

-- First, let's see what we're working with
CREATE TEMP TABLE role_priority AS
SELECT 'super_admin'::app_role as role, 1 as priority
UNION ALL
SELECT 'branch_admin'::app_role, 2
UNION ALL  
SELECT 'carer'::app_role, 3
UNION ALL
SELECT 'client'::app_role, 4;

-- Remove lower priority duplicate roles, keeping only the highest priority role per user
WITH user_highest_role AS (
  SELECT 
    ur.user_id,
    ur.role,
    ROW_NUMBER() OVER (PARTITION BY ur.user_id ORDER BY rp.priority ASC) as rn
  FROM user_roles ur
  JOIN role_priority rp ON ur.role = rp.role
)
DELETE FROM user_roles 
WHERE (user_id, role) IN (
  SELECT user_id, role 
  FROM user_highest_role 
  WHERE rn > 1
);

-- Add a unique constraint to prevent future duplicates
ALTER TABLE user_roles 
ADD CONSTRAINT unique_user_role UNIQUE (user_id);

-- Update the useUserRole function to handle role priority better
CREATE OR REPLACE FUNCTION public.get_user_highest_role(p_user_id uuid)
RETURNS TABLE(role app_role)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT ur.role
  FROM user_roles ur
  WHERE ur.user_id = p_user_id
  ORDER BY 
    CASE ur.role
      WHEN 'super_admin' THEN 1
      WHEN 'branch_admin' THEN 2  
      WHEN 'carer' THEN 3
      WHEN 'client' THEN 4
    END
  LIMIT 1;
END;
$$;
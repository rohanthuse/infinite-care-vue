-- Fix organization membership for branch admins
-- Phase 1: Add missing organization membership for shivamk@gmail.com
INSERT INTO organization_members (
  organization_id,
  user_id,
  role,
  status,
  joined_at
) 
SELECT DISTINCT 
  b.organization_id,
  ab.admin_id,
  'admin' as role,
  'active' as status,
  now() as joined_at
FROM admin_branches ab
JOIN branches b ON ab.branch_id = b.id
WHERE ab.admin_id = 'c83c5cd8-a9ca-455a-b6c9-a279b7634a08'
AND NOT EXISTS (
  SELECT 1 FROM organization_members om 
  WHERE om.user_id = ab.admin_id 
  AND om.organization_id = b.organization_id
);

-- Phase 3: Create function to fix all existing branch admins missing organization memberships
CREATE OR REPLACE FUNCTION fix_branch_admin_organization_memberships()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  fixed_count INTEGER := 0;
  error_count INTEGER := 0;
  results JSONB := '[]'::JSONB;
  admin_record RECORD;
BEGIN
  -- Find all branch admins who are missing organization memberships
  FOR admin_record IN 
    SELECT DISTINCT 
      ab.admin_id,
      b.organization_id,
      au.email,
      o.name as org_name
    FROM admin_branches ab
    JOIN branches b ON ab.branch_id = b.id
    JOIN organizations o ON b.organization_id = o.id
    JOIN auth.users au ON ab.admin_id = au.id
    WHERE NOT EXISTS (
      SELECT 1 FROM organization_members om 
      WHERE om.user_id = ab.admin_id 
      AND om.organization_id = b.organization_id
    )
  LOOP
    BEGIN
      -- Add organization membership
      INSERT INTO organization_members (
        organization_id,
        user_id,
        role,
        status,
        joined_at
      ) VALUES (
        admin_record.organization_id,
        admin_record.admin_id,
        'admin',
        'active',
        now()
      );
      
      fixed_count := fixed_count + 1;
      
      results := results || jsonb_build_object(
        'user_id', admin_record.admin_id,
        'email', admin_record.email,
        'organization_id', admin_record.organization_id,
        'organization_name', admin_record.org_name,
        'status', 'fixed'
      );
      
    EXCEPTION WHEN OTHERS THEN
      error_count := error_count + 1;
      results := results || jsonb_build_object(
        'user_id', admin_record.admin_id,
        'email', admin_record.email,
        'organization_id', admin_record.organization_id,
        'status', 'error',
        'error_message', SQLERRM
      );
    END;
  END LOOP;
  
  RETURN json_build_object(
    'success', true,
    'fixed_count', fixed_count,
    'error_count', error_count,
    'details', results
  );
END;
$$;

-- Phase 4: Create trigger to ensure new branch admins always get organization memberships
CREATE OR REPLACE FUNCTION ensure_branch_admin_org_membership()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Add organization membership for new branch admin assignment
  INSERT INTO organization_members (
    organization_id,
    user_id,
    role,
    status,
    joined_at
  )
  SELECT 
    b.organization_id,
    NEW.admin_id,
    'admin',
    'active',
    now()
  FROM branches b
  WHERE b.id = NEW.branch_id
  AND NOT EXISTS (
    SELECT 1 FROM organization_members om 
    WHERE om.user_id = NEW.admin_id 
    AND om.organization_id = b.organization_id
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger on admin_branches table
DROP TRIGGER IF EXISTS ensure_branch_admin_org_membership_trigger ON admin_branches;
CREATE TRIGGER ensure_branch_admin_org_membership_trigger
  AFTER INSERT ON admin_branches
  FOR EACH ROW
  EXECUTE FUNCTION ensure_branch_admin_org_membership();
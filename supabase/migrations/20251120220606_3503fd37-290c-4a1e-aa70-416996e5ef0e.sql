-- Create audit trail table for organization assignments
CREATE TABLE IF NOT EXISTS system_user_organization_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  system_user_id uuid NOT NULL REFERENCES system_users(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  action text NOT NULL CHECK (action IN ('assigned', 'unassigned', 'role_changed', 'sync_repaired')),
  old_role text,
  new_role text,
  performed_by uuid REFERENCES system_users(id),
  performed_at timestamp with time zone DEFAULT now(),
  success boolean NOT NULL,
  error_message text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now()
);

-- Create indexes for audit trail
CREATE INDEX IF NOT EXISTS idx_system_user_org_audit_user ON system_user_organization_audit(system_user_id);
CREATE INDEX IF NOT EXISTS idx_system_user_org_audit_org ON system_user_organization_audit(organization_id);
CREATE INDEX IF NOT EXISTS idx_system_user_org_audit_performed_at ON system_user_organization_audit(performed_at DESC);

-- Enable RLS on audit table
ALTER TABLE system_user_organization_audit ENABLE ROW LEVEL SECURITY;

-- Allow system users to view audit logs for their organizations
CREATE POLICY "System users can view audit logs for their organizations"
  ON system_user_organization_audit
  FOR SELECT
  USING (
    organization_id IN (
      SELECT suo.organization_id 
      FROM system_user_organizations suo 
      WHERE suo.system_user_id IN (
        SELECT id FROM system_users WHERE auth_user_id = auth.uid()
      )
    )
  );

-- Allow service role to insert audit logs
CREATE POLICY "Service role can insert audit logs"
  ON system_user_organization_audit
  FOR INSERT
  WITH CHECK (true);

-- Data integrity validation function
CREATE OR REPLACE FUNCTION validate_system_user_organization_integrity()
RETURNS TABLE(
  system_user_id uuid,
  email text,
  missing_in_system_user_organizations boolean,
  missing_in_organization_members boolean,
  organization_id uuid,
  organization_name text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  -- Find users in organization_members but not in system_user_organizations
  SELECT 
    su.id as system_user_id,
    su.email,
    TRUE as missing_in_system_user_organizations,
    FALSE as missing_in_organization_members,
    om.organization_id,
    o.name as organization_name
  FROM system_users su
  JOIN organization_members om ON su.auth_user_id = om.user_id
  LEFT JOIN system_user_organizations suo ON su.id = suo.system_user_id AND om.organization_id = suo.organization_id
  JOIN organizations o ON om.organization_id = o.id
  WHERE suo.system_user_id IS NULL
  
  UNION ALL
  
  -- Find users in system_user_organizations but not in organization_members
  SELECT 
    su.id as system_user_id,
    su.email,
    FALSE as missing_in_system_user_organizations,
    TRUE as missing_in_organization_members,
    suo.organization_id,
    o.name as organization_name
  FROM system_users su
  JOIN system_user_organizations suo ON su.id = suo.system_user_id
  LEFT JOIN organization_members om ON su.auth_user_id = om.user_id AND suo.organization_id = om.organization_id
  JOIN organizations o ON suo.organization_id = o.id
  WHERE om.user_id IS NULL;
END;
$$;

-- Automatic sync repair function
CREATE OR REPLACE FUNCTION repair_system_user_organization_sync()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_repaired_count int := 0;
  v_user_record RECORD;
  v_result jsonb;
BEGIN
  -- Fix users in organization_members but not in system_user_organizations
  FOR v_user_record IN (
    SELECT 
      su.id as system_user_id,
      su.email,
      om.organization_id,
      om.role,
      o.name as organization_name
    FROM system_users su
    JOIN organization_members om ON su.auth_user_id = om.user_id
    LEFT JOIN system_user_organizations suo ON su.id = suo.system_user_id AND om.organization_id = suo.organization_id
    JOIN organizations o ON om.organization_id = o.id
    WHERE suo.system_user_id IS NULL
  ) LOOP
    BEGIN
      -- Insert into system_user_organizations
      INSERT INTO system_user_organizations (system_user_id, organization_id, role)
      VALUES (v_user_record.system_user_id, v_user_record.organization_id, v_user_record.role)
      ON CONFLICT (system_user_id, organization_id) DO UPDATE
      SET role = EXCLUDED.role, updated_at = now();
      
      -- Log to audit trail
      INSERT INTO system_user_organization_audit (
        system_user_id,
        organization_id,
        action,
        new_role,
        success,
        metadata
      ) VALUES (
        v_user_record.system_user_id,
        v_user_record.organization_id,
        'sync_repaired',
        v_user_record.role,
        true,
        jsonb_build_object(
          'email', v_user_record.email,
          'organization_name', v_user_record.organization_name,
          'repair_type', 'missing_in_system_user_organizations'
        )
      );
      
      v_repaired_count := v_repaired_count + 1;
    EXCEPTION WHEN OTHERS THEN
      -- Log failure to audit trail
      INSERT INTO system_user_organization_audit (
        system_user_id,
        organization_id,
        action,
        success,
        error_message,
        metadata
      ) VALUES (
        v_user_record.system_user_id,
        v_user_record.organization_id,
        'sync_repaired',
        false,
        SQLERRM,
        jsonb_build_object(
          'email', v_user_record.email,
          'organization_name', v_user_record.organization_name,
          'repair_type', 'missing_in_system_user_organizations'
        )
      );
    END;
  END LOOP;
  
  v_result := jsonb_build_object(
    'success', true,
    'repaired_count', v_repaired_count,
    'timestamp', now()
  );
  
  RETURN v_result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION validate_system_user_organization_integrity() TO authenticated;
GRANT EXECUTE ON FUNCTION repair_system_user_organization_sync() TO authenticated;
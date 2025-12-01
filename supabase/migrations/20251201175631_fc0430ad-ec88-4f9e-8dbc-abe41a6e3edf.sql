-- Drop the existing restrictive policies
DROP POLICY IF EXISTS "Tenant super admins can view their agreements" ON system_tenant_agreements;
DROP POLICY IF EXISTS "Tenant super admins can create agreements" ON system_tenant_agreements;
DROP POLICY IF EXISTS "Tenant super admins can update their agreements" ON system_tenant_agreements;
DROP POLICY IF EXISTS "Tenant super admins can delete their agreements" ON system_tenant_agreements;

-- Create new policy that allows ALL organization members to view agreements
CREATE POLICY "Organization members can view their tenant agreements"
  ON system_tenant_agreements
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = auth.uid() 
      AND om.organization_id = system_tenant_agreements.tenant_id
    )
  );

-- Allow admins to create agreements
CREATE POLICY "Organization admins can create agreements"
  ON system_tenant_agreements
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = auth.uid() 
      AND om.organization_id = system_tenant_agreements.tenant_id 
      AND om.role IN ('super_admin', 'admin')
    )
  );

-- Allow admins to update agreements
CREATE POLICY "Organization admins can update their agreements"
  ON system_tenant_agreements
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = auth.uid() 
      AND om.organization_id = system_tenant_agreements.tenant_id 
      AND om.role IN ('super_admin', 'admin')
    )
  );

-- Allow admins to delete agreements
CREATE POLICY "Organization admins can delete their agreements"
  ON system_tenant_agreements
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = auth.uid() 
      AND om.organization_id = system_tenant_agreements.tenant_id 
      AND om.role IN ('super_admin', 'admin')
    )
  );
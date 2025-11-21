-- Allow tenant super admins to SELECT their own organization's agreements
CREATE POLICY "Tenant super admins can view their agreements"
ON system_tenant_agreements
FOR SELECT
TO authenticated
USING (
  -- Check if user is a super_admin in the organization that matches tenant_id
  EXISTS (
    SELECT 1 
    FROM organization_members om
    WHERE om.user_id = auth.uid()
      AND om.organization_id = system_tenant_agreements.tenant_id
      AND om.role = 'super_admin'
  )
);

-- Allow tenant super admins to INSERT agreements for their organization
CREATE POLICY "Tenant super admins can create agreements"
ON system_tenant_agreements
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 
    FROM organization_members om
    WHERE om.user_id = auth.uid()
      AND om.organization_id = system_tenant_agreements.tenant_id
      AND om.role = 'super_admin'
  )
);

-- Allow tenant super admins to UPDATE their organization's agreements
CREATE POLICY "Tenant super admins can update their agreements"
ON system_tenant_agreements
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM organization_members om
    WHERE om.user_id = auth.uid()
      AND om.organization_id = system_tenant_agreements.tenant_id
      AND om.role = 'super_admin'
  )
);

-- Allow tenant super admins to DELETE their organization's agreements
CREATE POLICY "Tenant super admins can delete their agreements"
ON system_tenant_agreements
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM organization_members om
    WHERE om.user_id = auth.uid()
      AND om.organization_id = system_tenant_agreements.tenant_id
      AND om.role = 'super_admin'
  )
);
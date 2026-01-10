-- Fix critical security issue: Cross-organization authority data leakage
-- Drop existing flawed policies that allow branch_admin to see all authorities

DROP POLICY IF EXISTS "Users can view authorities in their organization" ON authorities;
DROP POLICY IF EXISTS "Users can insert authorities in their organization" ON authorities;
DROP POLICY IF EXISTS "Users can update authorities in their organization" ON authorities;
DROP POLICY IF EXISTS "Users can delete authorities in their organization" ON authorities;

-- Recreate with proper organization scoping
-- Only super_admin can access all organizations; all other users must match organization_id

CREATE POLICY "Users can view authorities in their organization" ON authorities
FOR SELECT USING (
  has_role(auth.uid(), 'super_admin'::app_role) 
  OR organization_id = get_user_organization_id(auth.uid())
);

CREATE POLICY "Users can insert authorities in their organization" ON authorities
FOR INSERT WITH CHECK (
  has_role(auth.uid(), 'super_admin'::app_role) 
  OR organization_id = get_user_organization_id(auth.uid())
);

CREATE POLICY "Users can update authorities in their organization" ON authorities
FOR UPDATE USING (
  has_role(auth.uid(), 'super_admin'::app_role) 
  OR organization_id = get_user_organization_id(auth.uid())
);

CREATE POLICY "Users can delete authorities in their organization" ON authorities
FOR DELETE USING (
  has_role(auth.uid(), 'super_admin'::app_role) 
  OR organization_id = get_user_organization_id(auth.uid())
);
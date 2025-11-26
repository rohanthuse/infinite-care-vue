-- Add DELETE policies for third_party_users table to allow admins to remove linked user records

-- Branch admins can delete third party users for their branches
CREATE POLICY "Branch admins can delete third party users for their branches"
ON public.third_party_users FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM admin_branches ab 
    WHERE ab.admin_id = auth.uid() 
    AND ab.branch_id = third_party_users.branch_id
  )
);

-- Super admins can delete all third party users
CREATE POLICY "Super admins can delete all third party users"
ON public.third_party_users FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_roles ur 
    WHERE ur.user_id = auth.uid() 
    AND ur.role = 'super_admin'
  )
);
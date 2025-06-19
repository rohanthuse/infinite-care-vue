
-- Check and update RLS policies for super_admin access to personal information tables

-- Update clients table policies
DROP POLICY IF EXISTS "Admins can view all clients" ON clients;
DROP POLICY IF EXISTS "Admins can update all clients" ON clients;

CREATE POLICY "Admins can view all clients" ON clients
  FOR SELECT 
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'super_admin') OR
    public.has_role(auth.uid(), 'carer')
  );

CREATE POLICY "Admins can update all clients" ON clients
  FOR UPDATE 
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'super_admin')
  );

-- Update client_personal_info table policies
DROP POLICY IF EXISTS "Admins can view all personal info" ON client_personal_info;
DROP POLICY IF EXISTS "Admins can create personal info" ON client_personal_info;
DROP POLICY IF EXISTS "Admins can update personal info" ON client_personal_info;

CREATE POLICY "Admins can view all personal info" ON client_personal_info
  FOR SELECT 
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'super_admin') OR
    public.has_role(auth.uid(), 'carer')
  );

CREATE POLICY "Admins can create personal info" ON client_personal_info
  FOR INSERT 
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Admins can update personal info" ON client_personal_info
  FOR UPDATE 
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'super_admin')
  );

-- Update client_medical_info table policies
DROP POLICY IF EXISTS "Admins can view all medical info" ON client_medical_info;
DROP POLICY IF EXISTS "Admins can create medical info" ON client_medical_info;
DROP POLICY IF EXISTS "Admins can update medical info" ON client_medical_info;

CREATE POLICY "Admins can view all medical info" ON client_medical_info
  FOR SELECT 
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'super_admin') OR
    public.has_role(auth.uid(), 'carer')
  );

CREATE POLICY "Admins can create medical info" ON client_medical_info
  FOR INSERT 
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Admins can update medical info" ON client_medical_info
  FOR UPDATE 
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'super_admin')
  );

-- Update client_care_plan_goals table policies
DROP POLICY IF EXISTS "Admins can view all goals" ON client_care_plan_goals;
DROP POLICY IF EXISTS "Admins can create goals" ON client_care_plan_goals;
DROP POLICY IF EXISTS "Admins can update goals" ON client_care_plan_goals;

CREATE POLICY "Admins can view all goals" ON client_care_plan_goals
  FOR SELECT 
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'super_admin') OR
    public.has_role(auth.uid(), 'carer')
  );

CREATE POLICY "Admins can create goals" ON client_care_plan_goals
  FOR INSERT 
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Admins can update goals" ON client_care_plan_goals
  FOR UPDATE 
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'super_admin')
  );

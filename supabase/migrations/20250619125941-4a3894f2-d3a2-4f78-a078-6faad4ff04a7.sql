
-- Add comprehensive RLS policies for client data tables to allow authenticated users to perform all operations

-- Policies for client_personal_info table
CREATE POLICY "Allow authenticated users to insert client personal info" ON public.client_personal_info
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update client personal info" ON public.client_personal_info
  FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete client personal info" ON public.client_personal_info
  FOR DELETE TO authenticated
  USING (true);

-- Policies for client_medical_info table
CREATE POLICY "Allow authenticated users to insert client medical info" ON public.client_medical_info
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update client medical info" ON public.client_medical_info
  FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete client medical info" ON public.client_medical_info
  FOR DELETE TO authenticated
  USING (true);

-- Policies for client_dietary_requirements table
CREATE POLICY "Allow authenticated users to insert client dietary requirements" ON public.client_dietary_requirements
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update client dietary requirements" ON public.client_dietary_requirements
  FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete client dietary requirements" ON public.client_dietary_requirements
  FOR DELETE TO authenticated
  USING (true);

-- Policies for client_personal_care table
CREATE POLICY "Allow authenticated users to insert client personal care" ON public.client_personal_care
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update client personal care" ON public.client_personal_care
  FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete client personal care" ON public.client_personal_care
  FOR DELETE TO authenticated
  USING (true);

-- Policies for client_equipment table
CREATE POLICY "Allow authenticated users to insert client equipment" ON public.client_equipment
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update client equipment" ON public.client_equipment
  FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete client equipment" ON public.client_equipment
  FOR DELETE TO authenticated
  USING (true);

-- Policies for client_risk_assessments table
CREATE POLICY "Allow authenticated users to insert client risk assessments" ON public.client_risk_assessments
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update client risk assessments" ON public.client_risk_assessments
  FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete client risk assessments" ON public.client_risk_assessments
  FOR DELETE TO authenticated
  USING (true);

-- Policies for client_service_actions table
CREATE POLICY "Allow authenticated users to insert client service actions" ON public.client_service_actions
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update client service actions" ON public.client_service_actions
  FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete client service actions" ON public.client_service_actions
  FOR DELETE TO authenticated
  USING (true);

-- Policies for client_assessments table
CREATE POLICY "Allow authenticated users to insert client assessments" ON public.client_assessments
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update client assessments" ON public.client_assessments
  FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete client assessments" ON public.client_assessments
  FOR DELETE TO authenticated
  USING (true);

-- Policies for client_notes table
CREATE POLICY "Allow authenticated users to insert client notes" ON public.client_notes
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update client notes" ON public.client_notes
  FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete client notes" ON public.client_notes
  FOR DELETE TO authenticated
  USING (true);

-- Policies for client_events_logs table
CREATE POLICY "Allow authenticated users to insert client events logs" ON public.client_events_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update client events logs" ON public.client_events_logs
  FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete client events logs" ON public.client_events_logs
  FOR DELETE TO authenticated
  USING (true);

-- Policies for client_activities table
CREATE POLICY "Allow authenticated users to insert client activities" ON public.client_activities
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update client activities" ON public.client_activities
  FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete client activities" ON public.client_activities
  FOR DELETE TO authenticated
  USING (true);

-- Policies for client_care_plan_goals table
CREATE POLICY "Allow authenticated users to insert client care plan goals" ON public.client_care_plan_goals
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow authenticated users to update client care plan goals" ON public.client_care_plan_goals
  FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to delete client care plan goals" ON public.client_care_plan_goals
  FOR DELETE TO authenticated
  USING (true);

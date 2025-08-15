-- Phase 1: RLS Policy Hardening - Fix overly permissive policies and add organization-level filtering

-- Fix client_notes policies to be organization-aware
DROP POLICY IF EXISTS "Allow authenticated users to read client notes" ON public.client_notes;
DROP POLICY IF EXISTS "Allow authenticated users to insert client notes" ON public.client_notes;
DROP POLICY IF EXISTS "Allow authenticated users to update client notes" ON public.client_notes;
DROP POLICY IF EXISTS "Allow authenticated users to delete client notes" ON public.client_notes;
DROP POLICY IF EXISTS "Users can view client notes" ON public.client_notes;
DROP POLICY IF EXISTS "Users can insert client notes" ON public.client_notes;
DROP POLICY IF EXISTS "Users can update client notes" ON public.client_notes;
DROP POLICY IF EXISTS "Users can delete client notes" ON public.client_notes;

CREATE POLICY "Organization members can view client notes" ON public.client_notes
FOR SELECT USING (
  client_id IN (
    SELECT c.id FROM clients c
    JOIN branches b ON c.branch_id = b.id
    WHERE b.organization_id = get_user_organization_id(auth.uid())
  )
);

CREATE POLICY "Organization members can insert client notes" ON public.client_notes
FOR INSERT WITH CHECK (
  client_id IN (
    SELECT c.id FROM clients c
    JOIN branches b ON c.branch_id = b.id
    WHERE b.organization_id = get_user_organization_id(auth.uid())
  )
);

CREATE POLICY "Organization members can update client notes" ON public.client_notes
FOR UPDATE USING (
  client_id IN (
    SELECT c.id FROM clients c
    JOIN branches b ON c.branch_id = b.id
    WHERE b.organization_id = get_user_organization_id(auth.uid())
  )
);

CREATE POLICY "Organization members can delete client notes" ON public.client_notes
FOR DELETE USING (
  client_id IN (
    SELECT c.id FROM clients c
    JOIN branches b ON c.branch_id = b.id
    WHERE b.organization_id = get_user_organization_id(auth.uid())
  )
);

-- Fix services policies to be organization-aware instead of public
DROP POLICY IF EXISTS "Allow public read access to all services" ON public.services;

CREATE POLICY "Organization members can view services" ON public.services
FOR SELECT USING (
  organization_id = get_user_organization_id(auth.uid()) OR
  organization_id IS NULL -- Global services
);

-- Fix communication_types to be organization-aware
DROP POLICY IF EXISTS "Allow authenticated users to manage communication_types" ON public.communication_types;

CREATE POLICY "Organization members can manage communication_types" ON public.communication_types
FOR ALL USING (true) WITH CHECK (true); -- These can remain global for now

-- Fix agreements policies to be organization-aware
DROP POLICY IF EXISTS "Allow authenticated users to manage agreements" ON public.agreements;

CREATE POLICY "Organization members can manage agreements" ON public.agreements
FOR ALL USING (
  branch_id IN (
    SELECT b.id FROM branches b
    WHERE b.organization_id = get_user_organization_id(auth.uid())
  )
) WITH CHECK (
  branch_id IN (
    SELECT b.id FROM branches b
    WHERE b.organization_id = get_user_organization_id(auth.uid())
  )
);

-- Fix client_service_actions to be organization-aware
DROP POLICY IF EXISTS "Allow authenticated users to read client service actions" ON public.client_service_actions;
DROP POLICY IF EXISTS "Allow authenticated users to insert client service actions" ON public.client_service_actions;
DROP POLICY IF EXISTS "Allow authenticated users to update client service actions" ON public.client_service_actions;
DROP POLICY IF EXISTS "Allow authenticated users to delete client service actions" ON public.client_service_actions;

CREATE POLICY "Organization members can manage client service actions" ON public.client_service_actions
FOR ALL USING (
  client_id IN (
    SELECT c.id FROM clients c
    JOIN branches b ON c.branch_id = b.id
    WHERE b.organization_id = get_user_organization_id(auth.uid())
  )
) WITH CHECK (
  client_id IN (
    SELECT c.id FROM clients c
    JOIN branches b ON c.branch_id = b.id
    WHERE b.organization_id = get_user_organization_id(auth.uid())
  )
);

-- Fix expenses to be organization-aware
DROP POLICY IF EXISTS "Allow authenticated users to read expenses" ON public.expenses;
DROP POLICY IF EXISTS "Allow authenticated users to insert expenses" ON public.expenses;
DROP POLICY IF EXISTS "Allow authenticated users to update expenses" ON public.expenses;
DROP POLICY IF EXISTS "Allow authenticated users to delete expenses" ON public.expenses;

CREATE POLICY "Organization members can manage expenses" ON public.expenses
FOR ALL USING (
  organization_id = get_user_organization_id(auth.uid())
) WITH CHECK (
  organization_id = get_user_organization_id(auth.uid())
);

-- Fix travel_records to be organization-aware
DROP POLICY IF EXISTS "Allow authenticated users to read travel records" ON public.travel_records;
DROP POLICY IF EXISTS "Allow authenticated users to insert travel records" ON public.travel_records;
DROP POLICY IF EXISTS "Allow authenticated users to update travel records" ON public.travel_records;
DROP POLICY IF EXISTS "Allow authenticated users to delete travel records" ON public.travel_records;

CREATE POLICY "Organization members can manage travel records" ON public.travel_records
FOR ALL USING (
  organization_id = get_user_organization_id(auth.uid())
) WITH CHECK (
  organization_id = get_user_organization_id(auth.uid())
);

-- Fix extra_time_records to be organization-aware
DROP POLICY IF EXISTS "Allow authenticated users to read extra time records" ON public.extra_time_records;
DROP POLICY IF EXISTS "Allow authenticated users to insert extra time records" ON public.extra_time_records;
DROP POLICY IF EXISTS "Allow authenticated users to update extra time records" ON public.extra_time_records;
DROP POLICY IF EXISTS "Allow authenticated users to delete extra time records" ON public.extra_time_records;

CREATE POLICY "Organization members can manage extra time records" ON public.extra_time_records
FOR ALL USING (
  organization_id = get_user_organization_id(auth.uid())
) WITH CHECK (
  organization_id = get_user_organization_id(auth.uid())
);

-- Fix staff_bank_details to be organization-aware
DROP POLICY IF EXISTS "Allow authenticated users to read staff bank details" ON public.staff_bank_details;
DROP POLICY IF EXISTS "Allow authenticated users to insert staff bank details" ON public.staff_bank_details;
DROP POLICY IF EXISTS "Allow authenticated users to update staff bank details" ON public.staff_bank_details;

CREATE POLICY "Organization members can manage staff bank details" ON public.staff_bank_details
FOR ALL USING (
  staff_id IN (
    SELECT s.id FROM staff s
    JOIN branches b ON s.branch_id = b.id
    WHERE b.organization_id = get_user_organization_id(auth.uid())
  )
) WITH CHECK (
  staff_id IN (
    SELECT s.id FROM staff s
    JOIN branches b ON s.branch_id = b.id
    WHERE b.organization_id = get_user_organization_id(auth.uid())
  )
);

-- Ensure documents table has proper organization filtering through branch_id
UPDATE public.documents 
SET organization_id = (
  SELECT b.organization_id 
  FROM branches b 
  WHERE b.id = documents.branch_id
)
WHERE organization_id IS NULL AND branch_id IS NOT NULL;
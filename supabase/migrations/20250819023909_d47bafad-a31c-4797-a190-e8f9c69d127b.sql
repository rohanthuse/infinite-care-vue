-- Update the RLS policy for staff_documents to properly handle the staff_id relationship
-- Drop existing policies
DROP POLICY IF EXISTS "Staff can upload their own documents" ON public.staff_documents;
DROP POLICY IF EXISTS "Staff can view their own documents" ON public.staff_documents;
DROP POLICY IF EXISTS "Staff can update their own documents" ON public.staff_documents;
DROP POLICY IF EXISTS "Staff can delete their own documents" ON public.staff_documents;

-- Create updated policies that properly check the relationship
CREATE POLICY "Staff can upload their own documents" ON public.staff_documents
  FOR INSERT 
  WITH CHECK (
    staff_id IN (
      SELECT s.id 
      FROM public.staff s 
      WHERE s.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can view their own documents" ON public.staff_documents
  FOR SELECT 
  USING (
    staff_id IN (
      SELECT s.id 
      FROM public.staff s 
      WHERE s.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can update their own documents" ON public.staff_documents
  FOR UPDATE 
  USING (
    staff_id IN (
      SELECT s.id 
      FROM public.staff s 
      WHERE s.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Staff can delete their own documents" ON public.staff_documents
  FOR DELETE 
  USING (
    staff_id IN (
      SELECT s.id 
      FROM public.staff s 
      WHERE s.auth_user_id = auth.uid()
    )
  );
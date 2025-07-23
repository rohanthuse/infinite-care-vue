-- Add missing columns to staff_documents table for file management
ALTER TABLE public.staff_documents 
ADD COLUMN IF NOT EXISTS file_path TEXT,
ADD COLUMN IF NOT EXISTS file_size TEXT, 
ADD COLUMN IF NOT EXISTS file_type TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create trigger to automatically update updated_at
CREATE OR REPLACE FUNCTION public.update_staff_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates on staff_documents
DROP TRIGGER IF EXISTS update_staff_documents_updated_at ON public.staff_documents;
CREATE TRIGGER update_staff_documents_updated_at
  BEFORE UPDATE ON public.staff_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.update_staff_documents_updated_at();

-- Update RLS policies for staff_documents to ensure proper access
DROP POLICY IF EXISTS "Staff can view their own documents" ON public.staff_documents;
DROP POLICY IF EXISTS "Staff can upload their own documents" ON public.staff_documents;
DROP POLICY IF EXISTS "Staff can update their own documents" ON public.staff_documents;
DROP POLICY IF EXISTS "Staff can delete their own documents" ON public.staff_documents;
DROP POLICY IF EXISTS "Admins can view staff documents" ON public.staff_documents;

-- Create comprehensive RLS policies for staff_documents
CREATE POLICY "Staff can view their own documents"
  ON public.staff_documents
  FOR SELECT
  USING (
    staff_id IN (
      SELECT id FROM public.staff 
      WHERE auth_user_id = auth.uid() OR id = auth.uid()
    )
  );

CREATE POLICY "Staff can upload their own documents"
  ON public.staff_documents
  FOR INSERT
  WITH CHECK (
    staff_id IN (
      SELECT id FROM public.staff 
      WHERE auth_user_id = auth.uid() OR id = auth.uid()
    )
  );

CREATE POLICY "Staff can update their own documents"
  ON public.staff_documents
  FOR UPDATE
  USING (
    staff_id IN (
      SELECT id FROM public.staff 
      WHERE auth_user_id = auth.uid() OR id = auth.uid()
    )
  );

CREATE POLICY "Staff can delete their own documents"
  ON public.staff_documents
  FOR DELETE
  USING (
    staff_id IN (
      SELECT id FROM public.staff 
      WHERE auth_user_id = auth.uid() OR id = auth.uid()
    )
  );

-- Allow admins to view staff documents in their branches
CREATE POLICY "Admins can view staff documents"
  ON public.staff_documents
  FOR SELECT
  USING (
    has_role(auth.uid(), 'super_admin'::app_role) OR
    EXISTS (
      SELECT 1 FROM public.staff s
      JOIN public.admin_branches ab ON s.branch_id = ab.branch_id
      WHERE s.id = staff_documents.staff_id
      AND ab.admin_id = auth.uid()
    )
  );

-- Update RLS policies for client_assessments to include super_admin role

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view all assessments" ON client_assessments;
DROP POLICY IF EXISTS "Admins and carers can create assessments" ON client_assessments;
DROP POLICY IF EXISTS "Admins and performing carers can update assessments" ON client_assessments;

-- Recreate policies with super_admin included
CREATE POLICY "Admins can view all assessments" ON client_assessments
  FOR SELECT 
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'super_admin') OR
    public.has_role(auth.uid(), 'carer')
  );

CREATE POLICY "Admins and carers can create assessments" ON client_assessments
  FOR INSERT 
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'super_admin') OR
    public.has_role(auth.uid(), 'carer')
  );

CREATE POLICY "Admins and performing carers can update assessments" ON client_assessments
  FOR UPDATE 
  USING (
    public.has_role(auth.uid(), 'admin') OR 
    public.has_role(auth.uid(), 'super_admin') OR
    (public.has_role(auth.uid(), 'carer') AND performed_by_id = auth.uid())
  );

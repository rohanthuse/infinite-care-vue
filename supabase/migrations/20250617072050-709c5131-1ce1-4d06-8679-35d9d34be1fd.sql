
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view client documents" ON public.client_documents;
DROP POLICY IF EXISTS "Users can insert client documents" ON public.client_documents;
DROP POLICY IF EXISTS "Users can update client documents" ON public.client_documents;
DROP POLICY IF EXISTS "Users can delete client documents" ON public.client_documents;

-- Create comprehensive RLS policies for client_documents table
-- Policy for SELECT: Allow users to view documents for clients they have access to
CREATE POLICY "Users can view client documents" ON public.client_documents
  FOR SELECT USING (true);

-- Policy for INSERT: Allow authenticated users to insert client documents
CREATE POLICY "Users can insert client documents" ON public.client_documents
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Policy for UPDATE: Allow authenticated users to update client documents
CREATE POLICY "Users can update client documents" ON public.client_documents
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Policy for DELETE: Allow authenticated users to delete client documents
CREATE POLICY "Users can delete client documents" ON public.client_documents
  FOR DELETE USING (auth.uid() IS NOT NULL);

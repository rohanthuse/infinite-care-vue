
-- Create library resources table
CREATE TABLE public.library_resources (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  branch_id uuid REFERENCES public.branches(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'general',
  resource_type text NOT NULL,
  file_path text,
  file_size bigint,
  file_type text,
  url text,
  author text,
  version text,
  tags text[] DEFAULT '{}',
  is_private boolean DEFAULT false,
  access_roles text[] DEFAULT '{}',
  uploaded_by uuid REFERENCES auth.users(id),
  uploaded_by_name text,
  views_count integer DEFAULT 0,
  downloads_count integer DEFAULT 0,
  rating numeric(3,2),
  status text DEFAULT 'active',
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create library categories table
CREATE TABLE public.library_categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  description text,
  status text DEFAULT 'active',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Insert default categories
INSERT INTO public.library_categories (name, description) VALUES
  ('care_protocols', 'Care Protocols and Procedures'),
  ('training', 'Training Materials and Courses'),
  ('research', 'Research Papers and Studies'),
  ('guidelines', 'Clinical Guidelines and Standards'),
  ('reference', 'Reference Materials and Documentation'),
  ('presentations', 'Presentations and Slides'),
  ('courses', 'Educational Courses and Modules'),
  ('tools', 'Tools and Calculators');

-- Create library resource access logs table
CREATE TABLE public.library_resource_access_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  resource_id uuid REFERENCES public.library_resources(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id),
  branch_id uuid REFERENCES public.branches(id),
  access_type text NOT NULL, -- 'view', 'download', 'share'
  accessed_at timestamp with time zone DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.library_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_resource_access_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for library_resources
CREATE POLICY "Users can view resources in their branch"
  ON public.library_resources FOR SELECT
  USING (
    branch_id IN (
      SELECT ab.branch_id FROM public.admin_branches ab WHERE ab.admin_id = auth.uid()
      UNION
      SELECT s.branch_id FROM public.staff s WHERE s.id = auth.uid()
    )
    AND (NOT is_private OR access_roles && ARRAY(
      SELECT ur.role::text FROM public.user_roles ur WHERE ur.user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can create resources in their branch"
  ON public.library_resources FOR INSERT
  WITH CHECK (
    branch_id IN (
      SELECT ab.branch_id FROM public.admin_branches ab WHERE ab.admin_id = auth.uid()
      UNION
      SELECT s.branch_id FROM public.staff s WHERE s.id = auth.uid()
    )
  );

CREATE POLICY "Users can update resources they uploaded"
  ON public.library_resources FOR UPDATE
  USING (uploaded_by = auth.uid());

CREATE POLICY "Users can delete resources they uploaded"
  ON public.library_resources FOR DELETE
  USING (uploaded_by = auth.uid());

-- RLS Policies for library_categories
CREATE POLICY "Anyone can view active categories"
  ON public.library_categories FOR SELECT
  USING (status = 'active');

-- RLS Policies for access logs
CREATE POLICY "Users can view access logs for their branch"
  ON public.library_resource_access_logs FOR SELECT
  USING (
    branch_id IN (
      SELECT ab.branch_id FROM public.admin_branches ab WHERE ab.admin_id = auth.uid()
      UNION
      SELECT s.branch_id FROM public.staff s WHERE s.id = auth.uid()
    )
  );

CREATE POLICY "Users can create access logs"
  ON public.library_resource_access_logs FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- Create storage bucket for library files
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'library-resources',
  'library-resources',
  false,
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'audio/mpeg', 'audio/wav', 'text/plain']
);

-- Storage policies for library resources bucket
CREATE POLICY "Users can view files in their branch"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'library-resources' 
    AND (storage.foldername(name))[1] IN (
      SELECT ab.branch_id::text FROM public.admin_branches ab WHERE ab.admin_id = auth.uid()
      UNION
      SELECT s.branch_id::text FROM public.staff s WHERE s.id = auth.uid()
    )
  );

CREATE POLICY "Users can upload files to their branch"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'library-resources'
    AND (storage.foldername(name))[1] IN (
      SELECT ab.branch_id::text FROM public.admin_branches ab WHERE ab.admin_id = auth.uid()
      UNION
      SELECT s.branch_id::text FROM public.staff s WHERE s.id = auth.uid()
    )
  );

CREATE POLICY "Users can update files they uploaded"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'library-resources'
    AND owner = auth.uid()
  );

CREATE POLICY "Users can delete files they uploaded"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'library-resources'
    AND owner = auth.uid()
  );

-- Function to update resource statistics
CREATE OR REPLACE FUNCTION public.update_resource_stats(
  resource_id uuid,
  stat_type text
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF stat_type = 'view' THEN
    UPDATE public.library_resources 
    SET views_count = views_count + 1, updated_at = now()
    WHERE id = resource_id;
  ELSIF stat_type = 'download' THEN
    UPDATE public.library_resources 
    SET downloads_count = downloads_count + 1, updated_at = now()
    WHERE id = resource_id;
  END IF;
END;
$$;

-- Enable realtime for library resources
ALTER TABLE public.library_resources REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.library_resources;

-- Add triggers for updated_at
CREATE TRIGGER update_library_resources_updated_at
  BEFORE UPDATE ON public.library_resources
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_library_categories_updated_at
  BEFORE UPDATE ON public.library_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

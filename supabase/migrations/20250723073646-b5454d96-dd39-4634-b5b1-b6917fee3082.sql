
-- Add profile_photo_url column to clients table
ALTER TABLE public.clients 
ADD COLUMN profile_photo_url TEXT;

-- Create storage bucket for client photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('client-photos', 'client-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for client photos bucket
CREATE POLICY "Clients can upload their own photos" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'client-photos' 
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Clients can view their own photos" ON storage.objects
FOR SELECT USING (
  bucket_id = 'client-photos'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Clients can update their own photos" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'client-photos'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Clients can delete their own photos" ON storage.objects
FOR DELETE USING (
  bucket_id = 'client-photos'
  AND auth.uid() IS NOT NULL
);

-- Create policy for public read access to client photos
CREATE POLICY "Public read access for client photos" ON storage.objects
FOR SELECT USING (bucket_id = 'client-photos');

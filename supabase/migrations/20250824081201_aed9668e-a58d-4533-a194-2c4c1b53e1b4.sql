-- Add photo_url column to staff table
ALTER TABLE public.staff ADD COLUMN photo_url TEXT;

-- Create staff-photos storage bucket
INSERT INTO storage.buckets (id, name, public) 
VALUES ('staff-photos', 'staff-photos', true);

-- Create storage policies for staff-photos bucket
CREATE POLICY "Public can view staff photos" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'staff-photos');

CREATE POLICY "Staff can upload their own photos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'staff-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Staff can update their own photos" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'staff-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Staff can delete their own photos" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'staff-photos' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
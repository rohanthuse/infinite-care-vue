
-- Add columns to store body map image URLs
ALTER TABLE public.client_events_logs 
ADD COLUMN IF NOT EXISTS body_map_front_image_url TEXT,
ADD COLUMN IF NOT EXISTS body_map_back_image_url TEXT;

-- Create storage bucket for body map images
INSERT INTO storage.buckets (id, name, public)
VALUES ('body-map-images', 'body-map-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create policy to allow public read access to body map images
CREATE POLICY "Public read access for body map images" ON storage.objects
FOR SELECT USING (bucket_id = 'body-map-images');

-- Create policy to allow authenticated users to upload body map images
CREATE POLICY "Authenticated users can upload body map images" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'body-map-images' AND auth.role() = 'authenticated');

-- Create policy to allow authenticated users to update body map images
CREATE POLICY "Authenticated users can update body map images" ON storage.objects
FOR UPDATE USING (bucket_id = 'body-map-images' AND auth.role() = 'authenticated');

-- Create policy to allow authenticated users to delete body map images
CREATE POLICY "Authenticated users can delete body map images" ON storage.objects
FOR DELETE USING (bucket_id = 'body-map-images' AND auth.role() = 'authenticated');

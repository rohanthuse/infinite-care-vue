
-- First, let's check what's in the existing reviews table
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'reviews' AND table_schema = 'public'
ORDER BY ordinal_position;

-- Add missing columns to the existing reviews table if they don't exist
DO $$
BEGIN
    -- Add appointment_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'appointment_id') THEN
        ALTER TABLE public.reviews ADD COLUMN appointment_id UUID;
    END IF;
    
    -- Add booking_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'booking_id') THEN
        ALTER TABLE public.reviews ADD COLUMN booking_id UUID;
    END IF;
    
    -- Add service_date column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'service_date') THEN
        ALTER TABLE public.reviews ADD COLUMN service_date DATE NOT NULL DEFAULT CURRENT_DATE;
    END IF;
    
    -- Add service_type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'service_type') THEN
        ALTER TABLE public.reviews ADD COLUMN service_type TEXT;
    END IF;
    
    -- Add can_edit_until column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reviews' AND column_name = 'can_edit_until') THEN
        ALTER TABLE public.reviews ADD COLUMN can_edit_until TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + INTERVAL '24 hours');
    END IF;
END $$;

-- Enable RLS if not already enabled
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist and recreate them
DROP POLICY IF EXISTS "Clients can view their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Clients can create their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Clients can update their own reviews within 24 hours" ON public.reviews;

-- Create updated policies for client access
CREATE POLICY "Clients can view their own reviews" 
  ON public.reviews 
  FOR SELECT 
  USING (
    EXISTS(
      SELECT 1 FROM public.clients c 
      WHERE c.id = reviews.client_id 
      AND c.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Clients can create their own reviews" 
  ON public.reviews 
  FOR INSERT 
  WITH CHECK (
    EXISTS(
      SELECT 1 FROM public.clients c 
      WHERE c.id = reviews.client_id 
      AND c.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
  );

CREATE POLICY "Clients can update their own reviews within 24 hours" 
  ON public.reviews 
  FOR UPDATE 
  USING (
    EXISTS(
      SELECT 1 FROM public.clients c 
      WHERE c.id = reviews.client_id 
      AND c.email = (SELECT email FROM auth.users WHERE id = auth.uid())
    )
    AND can_edit_until > now()
  );

-- Add foreign key constraints if they don't exist
DO $$
BEGIN
    -- Add foreign key for appointment_id if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'reviews_appointment_id_fkey') THEN
        ALTER TABLE public.reviews 
        ADD CONSTRAINT reviews_appointment_id_fkey 
        FOREIGN KEY (appointment_id) REFERENCES public.client_appointments(id) ON DELETE SET NULL;
    END IF;
    
    -- Add foreign key for booking_id if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'reviews_booking_id_fkey') THEN
        ALTER TABLE public.reviews 
        ADD CONSTRAINT reviews_booking_id_fkey 
        FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_reviews_client_id ON public.reviews(client_id);
CREATE INDEX IF NOT EXISTS idx_reviews_staff_id ON public.reviews(staff_id);
CREATE INDEX IF NOT EXISTS idx_reviews_service_date ON public.reviews(service_date);
CREATE INDEX IF NOT EXISTS idx_reviews_appointment_id ON public.reviews(appointment_id);
CREATE INDEX IF NOT EXISTS idx_reviews_booking_id ON public.reviews(booking_id);

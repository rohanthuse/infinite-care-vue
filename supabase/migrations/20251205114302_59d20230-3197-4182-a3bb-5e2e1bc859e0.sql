-- Create junction table for many-to-many relationship between bookings and services
CREATE TABLE public.booking_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(booking_id, service_id)
);

-- Create indexes for performance
CREATE INDEX idx_booking_services_booking_id ON public.booking_services(booking_id);
CREATE INDEX idx_booking_services_service_id ON public.booking_services(service_id);

-- Migrate existing data from service_id to junction table
INSERT INTO public.booking_services (booking_id, service_id)
SELECT id, service_id FROM public.bookings WHERE service_id IS NOT NULL;

-- Enable RLS
ALTER TABLE public.booking_services ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view booking services" ON public.booking_services
FOR SELECT USING (true);

CREATE POLICY "Users can insert booking services" ON public.booking_services
FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update booking services" ON public.booking_services
FOR UPDATE USING (true);

CREATE POLICY "Users can delete booking services" ON public.booking_services
FOR DELETE USING (true);
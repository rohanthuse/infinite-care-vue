-- Add location_address column to bookings table for storing booking location
-- Stored as TEXT (snapshot) so changes to client address don't affect historical bookings
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS location_address TEXT;

-- Add a comment for documentation
COMMENT ON COLUMN public.bookings.location_address IS 'The address where the booking/appointment takes place. Stored as text (snapshot) so changes to client address do not affect historical bookings.';
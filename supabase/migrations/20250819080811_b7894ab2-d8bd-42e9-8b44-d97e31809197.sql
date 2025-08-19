
-- Add an optional notes column to bookings if it doesn't already exist
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add notes column to bookings table for additional information
ALTER TABLE public.bookings 
ADD COLUMN notes TEXT;
-- Add cancellation tracking fields to bookings table
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE;

-- Add late arrival tracking fields to visit_records table
ALTER TABLE public.visit_records
ADD COLUMN IF NOT EXISTS late_arrival_reason TEXT,
ADD COLUMN IF NOT EXISTS arrival_delay_minutes INTEGER;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_bookings_cancellation_reason ON public.bookings(cancellation_reason) WHERE cancellation_reason IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_visit_records_late_arrival ON public.visit_records(late_arrival_reason) WHERE late_arrival_reason IS NOT NULL;

-- Add comments for documentation
COMMENT ON COLUMN public.bookings.cancellation_reason IS 'Reason for booking cancellation or no-show';
COMMENT ON COLUMN public.bookings.cancelled_by IS 'User who cancelled the booking';
COMMENT ON COLUMN public.bookings.cancelled_at IS 'Timestamp when booking was cancelled';
COMMENT ON COLUMN public.visit_records.late_arrival_reason IS 'Reason for late arrival to visit';
COMMENT ON COLUMN public.visit_records.arrival_delay_minutes IS 'Number of minutes late for the visit';
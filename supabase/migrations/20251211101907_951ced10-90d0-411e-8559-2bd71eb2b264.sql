-- Add columns for staff payment type and amount on cancellation
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS staff_payment_type TEXT DEFAULT 'none';
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS staff_payment_amount NUMERIC DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN bookings.staff_payment_type IS 'Payment type for cancelled bookings: none, full, half, custom';
COMMENT ON COLUMN bookings.staff_payment_amount IS 'Custom payment amount for cancelled bookings when staff_payment_type is custom';
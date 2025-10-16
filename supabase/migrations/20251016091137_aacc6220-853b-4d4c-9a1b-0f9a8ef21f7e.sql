-- Add column to track staff payment protection during suspension
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS suspension_honor_staff_payment boolean DEFAULT false;

COMMENT ON COLUMN bookings.suspension_honor_staff_payment IS 'When true, staff will be paid for this booking even if client is suspended and visit does not occur';

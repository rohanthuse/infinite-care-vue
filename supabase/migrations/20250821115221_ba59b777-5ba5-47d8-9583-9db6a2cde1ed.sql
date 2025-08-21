-- Fix RLS policies for carers to update bookings and create visit records

-- 1. Allow carers to update their own bookings
CREATE POLICY "Carers can update their own bookings" ON public.bookings
FOR UPDATE 
USING (
  staff_id = auth.uid() OR 
  staff_id IN (
    SELECT id FROM staff WHERE auth_user_id = auth.uid()
  )
)
WITH CHECK (
  staff_id = auth.uid() OR 
  staff_id IN (
    SELECT id FROM staff WHERE auth_user_id = auth.uid()
  )
);

-- 2. Allow carers to insert visit records for their bookings
CREATE POLICY "Carers can insert their own visit records" ON public.visit_records
FOR INSERT
WITH CHECK (
  booking_id IN (
    SELECT b.id FROM bookings b 
    WHERE b.staff_id = auth.uid() OR 
    b.staff_id IN (SELECT s.id FROM staff s WHERE s.auth_user_id = auth.uid())
  )
);

-- 3. Allow carers to select their own visit records
CREATE POLICY "Carers can select their own visit records" ON public.visit_records
FOR SELECT
USING (
  booking_id IN (
    SELECT b.id FROM bookings b 
    WHERE b.staff_id = auth.uid() OR 
    b.staff_id IN (SELECT s.id FROM staff s WHERE s.auth_user_id = auth.uid())
  )
);

-- 4. Allow carers to update their own visit records
CREATE POLICY "Carers can update their own visit records" ON public.visit_records
FOR UPDATE
USING (
  booking_id IN (
    SELECT b.id FROM bookings b 
    WHERE b.staff_id = auth.uid() OR 
    b.staff_id IN (SELECT s.id FROM staff s WHERE s.auth_user_id = auth.uid())
  )
)
WITH CHECK (
  booking_id IN (
    SELECT b.id FROM bookings b 
    WHERE b.staff_id = auth.uid() OR 
    b.staff_id IN (SELECT s.id FROM staff s WHERE s.auth_user_id = auth.uid())
  )
);

-- 5. Update the booking overlap trigger to only run on schedule changes
DROP TRIGGER IF EXISTS booking_overlap_check ON public.bookings;

CREATE OR REPLACE FUNCTION public.check_booking_overlap()
RETURNS TRIGGER AS $$
BEGIN
  -- Only check overlap if schedule-related fields are being changed
  IF (TG_OP = 'UPDATE' AND 
      OLD.start_time = NEW.start_time AND 
      OLD.end_time = NEW.end_time AND 
      OLD.staff_id = NEW.staff_id AND 
      OLD.branch_id = NEW.branch_id) THEN
    -- No schedule changes, skip overlap check
    RETURN NEW;
  END IF;

  -- Check if there are any overlapping bookings for the same staff member on the same date
  IF EXISTS (
    SELECT 1 FROM bookings 
    WHERE staff_id = NEW.staff_id 
    AND branch_id = NEW.branch_id
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    AND DATE(start_time) = DATE(NEW.start_time)
    AND NEW.start_time < end_time 
    AND NEW.end_time > start_time
  ) THEN
    RAISE EXCEPTION 'Booking conflict detected: This carer already has an appointment during this time slot';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER booking_overlap_check
  BEFORE INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.check_booking_overlap();
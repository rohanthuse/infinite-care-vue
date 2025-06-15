
-- 1. Add a status field to bookings (nullable for now so old inserts work)
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'assigned';

-- 2. Update all existing bookings to 'assigned' status for consistency
UPDATE public.bookings SET status = 'assigned' WHERE status IS NULL;

-- 3. Optional: In production, consider adding a check constraint for allowed values
-- ALTER TABLE public.bookings ADD CONSTRAINT bookings_status_check CHECK (status IN (
--   'assigned','unassigned','done','in-progress','cancelled','departed','suspended'
-- ));


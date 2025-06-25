
-- First, let's update existing reviews to have the correct branch_id
-- We'll get the branch_id from the client associated with each review
UPDATE public.reviews 
SET branch_id = clients.branch_id
FROM public.clients 
WHERE reviews.client_id = clients.id 
AND reviews.branch_id IS NULL;

-- Let's also add a trigger to automatically set branch_id for future reviews
-- This ensures data consistency going forward
CREATE OR REPLACE FUNCTION public.set_review_branch_id()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Get branch_id from the client
  SELECT branch_id INTO NEW.branch_id
  FROM public.clients
  WHERE id = NEW.client_id;
  
  -- If we couldn't get it from client, try from booking
  IF NEW.branch_id IS NULL AND NEW.booking_id IS NOT NULL THEN
    SELECT branch_id INTO NEW.branch_id
    FROM public.bookings
    WHERE id = NEW.booking_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create the trigger to run before insert or update
DROP TRIGGER IF EXISTS trigger_set_review_branch_id ON public.reviews;
CREATE TRIGGER trigger_set_review_branch_id
  BEFORE INSERT OR UPDATE ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.set_review_branch_id();

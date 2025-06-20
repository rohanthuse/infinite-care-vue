
-- Create security definer function to check if user is participant in a thread
CREATE OR REPLACE FUNCTION public.is_thread_participant(thread_id_param uuid, user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.message_participants 
    WHERE thread_id = thread_id_param 
    AND user_id = user_id_param
  );
END;
$$;

-- Create security definer function to check if user can access a thread
CREATE OR REPLACE FUNCTION public.can_access_thread(thread_id_param uuid, user_id_param uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
BEGIN
  -- User can access thread if they are a participant or creator
  RETURN EXISTS (
    SELECT 1 FROM public.message_participants 
    WHERE thread_id = thread_id_param 
    AND user_id = user_id_param
  ) OR EXISTS (
    SELECT 1 FROM public.message_threads
    WHERE id = thread_id_param
    AND created_by = user_id_param
  );
END;
$$;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view participants in their threads" ON public.message_participants;
DROP POLICY IF EXISTS "Users can view threads they participate in" ON public.message_threads;
DROP POLICY IF EXISTS "Users can view messages in their threads" ON public.messages;

-- Create new RLS policies using security definer functions
CREATE POLICY "Users can view participants in accessible threads"
  ON public.message_participants FOR SELECT
  USING (public.can_access_thread(thread_id, auth.uid()));

CREATE POLICY "Users can view accessible threads"
  ON public.message_threads FOR SELECT
  USING (public.can_access_thread(id, auth.uid()));

CREATE POLICY "Users can view messages in accessible threads"
  ON public.messages FOR SELECT
  USING (public.can_access_thread(thread_id, auth.uid()));

-- Keep existing INSERT/UPDATE/DELETE policies as they don't have recursion issues
-- CREATE POLICY "Users can create threads" (already exists)
-- CREATE POLICY "Users can update threads they created" (already exists)
-- CREATE POLICY "Users can add participants to threads they created" (already exists)
-- CREATE POLICY "Users can send messages to their threads" (already exists)

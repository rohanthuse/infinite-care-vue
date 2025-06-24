
-- Add auth_user_id column to clients table to store the authentication user ID
ALTER TABLE public.clients 
ADD COLUMN auth_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Update existing client records to populate auth_user_id based on email matching
-- This will link existing clients to their auth users
UPDATE public.clients 
SET auth_user_id = (
  SELECT au.id 
  FROM auth.users au 
  WHERE au.email = clients.email
)
WHERE clients.email IS NOT NULL;

-- Drop the existing problematic RLS policies
DROP POLICY IF EXISTS "Clients can view their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Clients can create their own reviews" ON public.reviews;
DROP POLICY IF EXISTS "Clients can update their own reviews within 24 hours" ON public.reviews;

-- Create new RLS policies that use auth.uid() directly
CREATE POLICY "Clients can view their own reviews" 
  ON public.reviews 
  FOR SELECT 
  USING (
    EXISTS(
      SELECT 1 FROM public.clients c 
      WHERE c.id = reviews.client_id 
      AND c.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Clients can create their own reviews" 
  ON public.reviews 
  FOR INSERT 
  WITH CHECK (
    EXISTS(
      SELECT 1 FROM public.clients c 
      WHERE c.id = reviews.client_id 
      AND c.auth_user_id = auth.uid()
    )
  );

CREATE POLICY "Clients can update their own reviews within 24 hours" 
  ON public.reviews 
  FOR UPDATE 
  USING (
    EXISTS(
      SELECT 1 FROM public.clients c 
      WHERE c.id = reviews.client_id 
      AND c.auth_user_id = auth.uid()
    )
    AND can_edit_until > now()
  );

-- Add index for better performance on the new auth_user_id column
CREATE INDEX IF NOT EXISTS idx_clients_auth_user_id ON public.clients(auth_user_id);

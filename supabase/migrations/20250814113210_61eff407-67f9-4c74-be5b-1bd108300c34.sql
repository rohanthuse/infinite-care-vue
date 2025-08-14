-- Ensure the current user has app_admin role for testing
-- This is a one-time setup for development/testing
INSERT INTO public.user_roles (user_id, role) 
SELECT auth.uid(), 'app_admin'
WHERE auth.uid() IS NOT NULL
AND NOT EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() AND role = 'app_admin'
);
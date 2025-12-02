-- Enable RLS on subscription_expiry_notifications table
ALTER TABLE public.subscription_expiry_notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for subscription_expiry_notifications
-- Only system admins should be able to view these tracking records
CREATE POLICY "System admins can view subscription expiry notifications"
ON public.subscription_expiry_notifications
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.system_users
    WHERE auth_user_id = auth.uid()
    AND is_active = true
  )
);

-- System functions can insert tracking records
CREATE POLICY "System can insert subscription expiry notifications"
ON public.subscription_expiry_notifications
FOR INSERT
WITH CHECK (true);
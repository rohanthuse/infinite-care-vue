-- Add email_sent column to notifications table
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS email_sent BOOLEAN DEFAULT false;

-- Add index for faster queries on email_sent status
CREATE INDEX IF NOT EXISTS idx_notifications_email_sent 
ON public.notifications(email_sent, priority, created_at) 
WHERE email_sent = false AND priority IN ('high', 'urgent');

-- Add comment
COMMENT ON COLUMN public.notifications.email_sent IS 'Tracks whether an email notification has been sent for this notification';

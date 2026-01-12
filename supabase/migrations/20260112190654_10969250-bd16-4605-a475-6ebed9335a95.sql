-- Add archived_at column to notifications table for archive functionality
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add index for efficient filtering of non-archived notifications
CREATE INDEX IF NOT EXISTS idx_notifications_archived_at ON notifications(archived_at) 
WHERE archived_at IS NULL;
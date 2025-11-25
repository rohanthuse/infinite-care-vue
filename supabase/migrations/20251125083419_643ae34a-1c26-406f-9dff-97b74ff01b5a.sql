-- Add delivered_at column to message_read_status table
ALTER TABLE message_read_status 
ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Update existing records to have a delivered_at timestamp
UPDATE message_read_status 
SET delivered_at = read_at 
WHERE delivered_at IS NULL AND read_at IS NOT NULL;

UPDATE message_read_status 
SET delivered_at = NOW() 
WHERE delivered_at IS NULL;

-- Enable real-time for this table (if not already enabled)
ALTER TABLE message_read_status REPLICA IDENTITY FULL;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_message_read_status_delivered_at ON message_read_status(delivered_at);
CREATE INDEX IF NOT EXISTS idx_message_read_status_message_user ON message_read_status(message_id, user_id);
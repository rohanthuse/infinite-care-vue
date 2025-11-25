-- Add soft delete columns to messages table
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- Add soft delete columns to message_threads table  
ALTER TABLE public.message_threads
ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES auth.users(id);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_messages_is_deleted ON public.messages(is_deleted);
CREATE INDEX IF NOT EXISTS idx_message_threads_is_deleted ON public.message_threads(is_deleted);

-- Add comment for documentation
COMMENT ON COLUMN public.messages.is_deleted IS 'Soft delete flag - message is hidden but preserved for audit trail';
COMMENT ON COLUMN public.message_threads.is_deleted IS 'Soft delete flag - thread is hidden but preserved for audit trail';
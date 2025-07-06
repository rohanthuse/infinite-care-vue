-- Enable real-time for message_threads and messages tables for live updates
ALTER TABLE public.message_threads REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;

-- Add tables to realtime publication for live updates (only if not already added)
DO $$
BEGIN
    -- Add message_threads if not already in publication
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'message_threads'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.message_threads;
    END IF;
    
    -- Add messages if not already in publication
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    END IF;
END $$;
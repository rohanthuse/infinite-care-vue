-- Add client_id column to clients table
ALTER TABLE public.clients 
ADD COLUMN client_id TEXT UNIQUE;

-- Create index for performance
CREATE INDEX idx_clients_client_id ON public.clients(client_id);

-- Add comment for documentation
COMMENT ON COLUMN public.clients.client_id IS 'User-friendly client identifier (e.g., CLIENT-2025-001). Can be manually set or auto-generated. Separate from internal UUID.';

-- Create auto-generation function
CREATE OR REPLACE FUNCTION public.generate_client_id()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    current_year TEXT;
    next_num INTEGER;
    new_client_id TEXT;
BEGIN
    -- Only generate if client_id is not provided or is empty
    IF NEW.client_id IS NULL OR TRIM(NEW.client_id) = '' THEN
        -- Get current year
        current_year := TO_CHAR(CURRENT_DATE, 'YYYY');
        
        -- Get the next sequential number for this year
        -- Look for existing client_ids matching the pattern CLIENT-YYYY-NNN
        SELECT COALESCE(MAX(CAST(SUBSTRING(client_id FROM 13) AS INTEGER)), 0) + 1
        INTO next_num
        FROM public.clients
        WHERE client_id ~ ('^CLIENT-' || current_year || '-[0-9]+$');
        
        -- Generate new client_id with zero-padded 3-digit number
        new_client_id := 'CLIENT-' || current_year || '-' || LPAD(next_num::TEXT, 3, '0');
        
        -- Set the client_id
        NEW.client_id := new_client_id;
        
        RAISE NOTICE 'Auto-generated client_id: %', new_client_id;
    ELSE
        -- User provided a custom client_id, keep it as-is
        RAISE NOTICE 'Using custom client_id: %', NEW.client_id;
    END IF;
    
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.generate_client_id() IS 'Auto-generates client_id in format CLIENT-YYYY-NNN if not manually provided. Sequence resets each year.';

-- Create trigger to auto-generate client_id before insert
CREATE TRIGGER trigger_generate_client_id
BEFORE INSERT ON public.clients
FOR EACH ROW
EXECUTE FUNCTION public.generate_client_id();

COMMENT ON TRIGGER trigger_generate_client_id ON public.clients IS 'Automatically generates client_id before insert if not manually provided';

-- Backfill existing clients with auto-generated client_ids
DO $$
DECLARE
    client_record RECORD;
    current_year TEXT;
    counter INTEGER := 1;
    new_id TEXT;
BEGIN
    current_year := TO_CHAR(CURRENT_DATE, 'YYYY');
    
    -- Loop through all clients without a client_id, ordered by creation date
    FOR client_record IN 
        SELECT id FROM public.clients 
        WHERE client_id IS NULL 
        ORDER BY created_at ASC
    LOOP
        new_id := 'CLIENT-' || current_year || '-' || LPAD(counter::TEXT, 3, '0');
        
        UPDATE public.clients 
        SET client_id = new_id 
        WHERE id = client_record.id;
        
        counter := counter + 1;
    END LOOP;
    
    RAISE NOTICE 'Backfilled % existing clients with client_ids', counter - 1;
END $$;
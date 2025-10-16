-- Add updated_at column to client_status_history table
ALTER TABLE public.client_status_history
ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Backfill existing rows to ensure no NULLs
UPDATE public.client_status_history
SET updated_at = COALESCE(updated_at, created_at)
WHERE updated_at IS NULL;

-- Create trigger to auto-update the updated_at timestamp
DROP TRIGGER IF EXISTS trg_client_status_history_updated_at ON public.client_status_history;

CREATE TRIGGER trg_client_status_history_updated_at
BEFORE UPDATE ON public.client_status_history
FOR EACH ROW
EXECUTE FUNCTION public.update_essentials_updated_at();
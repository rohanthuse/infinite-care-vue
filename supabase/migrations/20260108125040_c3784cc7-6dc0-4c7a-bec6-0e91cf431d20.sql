-- Add active period columns to clients table
ALTER TABLE clients
ADD COLUMN IF NOT EXISTS active_from DATE,
ADD COLUMN IF NOT EXISTS active_until DATE;

-- Add index for efficient date-based queries
CREATE INDEX IF NOT EXISTS idx_clients_active_period ON clients(active_from, active_until);

-- Add comment for documentation
COMMENT ON COLUMN clients.active_from IS 'Start date of client active period';
COMMENT ON COLUMN clients.active_until IS 'End date when client automatically becomes inactive';
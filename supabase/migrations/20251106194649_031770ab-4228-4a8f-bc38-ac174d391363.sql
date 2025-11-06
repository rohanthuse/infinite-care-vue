-- Add general settings columns to clients table
ALTER TABLE clients 
ADD COLUMN IF NOT EXISTS core_lead_id UUID REFERENCES staff(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS agreement_id UUID REFERENCES agreements(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS expiry_date DATE,
ADD COLUMN IF NOT EXISTS show_in_task_matrix BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS show_in_form_matrix BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS enable_geo_fencing BOOLEAN DEFAULT FALSE;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_clients_core_lead_id ON clients(core_lead_id);
CREATE INDEX IF NOT EXISTS idx_clients_agreement_id ON clients(agreement_id);
CREATE INDEX IF NOT EXISTS idx_clients_expiry_date ON clients(expiry_date);

-- Add comments for documentation
COMMENT ON COLUMN clients.core_lead_id IS 'Reference to the staff member who is the core lead for this client';
COMMENT ON COLUMN clients.agreement_id IS 'Reference to the active agreement for this client';
COMMENT ON COLUMN clients.expiry_date IS 'Expiry date for the client agreement or service';
COMMENT ON COLUMN clients.show_in_task_matrix IS 'Whether to show this client in the task matrix view';
COMMENT ON COLUMN clients.show_in_form_matrix IS 'Whether to show this client in the form matrix view';
COMMENT ON COLUMN clients.enable_geo_fencing IS 'Whether geo-fencing is enabled for this client';
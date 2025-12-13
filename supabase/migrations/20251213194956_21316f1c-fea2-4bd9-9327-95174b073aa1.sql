-- Add booking_id column to link expenses to specific visits
ALTER TABLE expenses ADD COLUMN booking_id uuid REFERENCES bookings(id);

-- Add is_invoiced flag to track if expense has been added to an invoice
ALTER TABLE expenses ADD COLUMN is_invoiced boolean DEFAULT false;

-- Create index for efficient querying of expenses by booking
CREATE INDEX idx_expenses_booking_id ON expenses(booking_id);

-- Create index for efficient querying of non-invoiced approved expenses
CREATE INDEX idx_expenses_approved_not_invoiced ON expenses(status, is_invoiced) WHERE status = 'approved' AND is_invoiced = false;
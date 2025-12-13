-- Add metadata column to store expense-type-specific fields
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';

COMMENT ON COLUMN expenses.metadata IS 'Stores expense-type-specific fields like travel details, meal info, medical info, etc.';
-- Add expense_source column to track where expenses originated from
ALTER TABLE public.expenses 
ADD COLUMN IF NOT EXISTS expense_source TEXT DEFAULT 'general_claim';

-- Add comment explaining the values
COMMENT ON COLUMN public.expenses.expense_source IS 'Source of the expense: past_booking, general_claim, travel_mileage, extra_time';

-- Create an index for faster filtering by source
CREATE INDEX IF NOT EXISTS idx_expenses_source ON public.expenses(expense_source);
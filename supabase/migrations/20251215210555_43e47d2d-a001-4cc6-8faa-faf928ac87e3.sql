-- Add individual active flags for each deduction type
ALTER TABLE staff_deduction_settings 
ADD COLUMN IF NOT EXISTS tax_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS ni_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS pension_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS other_deductions_active BOOLEAN DEFAULT true;
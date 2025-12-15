-- Add fixed amount columns to staff_deduction_settings
ALTER TABLE staff_deduction_settings 
ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS ni_amount NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS pension_amount NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS other_deductions_amount NUMERIC(10,2) DEFAULT 0;
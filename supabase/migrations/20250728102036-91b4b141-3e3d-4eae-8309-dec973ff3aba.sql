-- Fix the foreign key constraint for payroll_records.created_by
-- Drop the existing foreign key constraint that references staff(id)
ALTER TABLE payroll_records DROP CONSTRAINT IF EXISTS payroll_records_created_by_fkey;

-- Add new foreign key constraint referencing auth.users(id)
ALTER TABLE payroll_records ADD CONSTRAINT payroll_records_created_by_fkey 
    FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE RESTRICT;
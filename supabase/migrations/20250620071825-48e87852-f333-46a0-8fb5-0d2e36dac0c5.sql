
-- Update client_care_plans table to support draft functionality
ALTER TABLE client_care_plans 
ADD COLUMN IF NOT EXISTS completion_percentage INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS auto_save_data JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS last_step_completed INTEGER DEFAULT 0;

-- Update the status enum to include 'draft'
ALTER TABLE client_care_plans 
ALTER COLUMN status TYPE TEXT;

-- Update any existing status values and set default
UPDATE client_care_plans 
SET status = 'active' 
WHERE status IS NULL;

-- Create table to track wizard step completion
CREATE TABLE IF NOT EXISTS care_plan_wizard_steps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  care_plan_id UUID NOT NULL REFERENCES client_care_plans(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  step_name TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  completed_at TIMESTAMP WITH TIME ZONE,
  step_data JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(care_plan_id, step_number)
);

-- Add RLS policies for wizard steps
ALTER TABLE care_plan_wizard_steps ENABLE ROW LEVEL SECURITY;

-- Create policy for viewing wizard steps (basic policy - adjust based on your auth system)
CREATE POLICY "Enable read access for all users" ON care_plan_wizard_steps FOR SELECT USING (true);
CREATE POLICY "Enable insert for all users" ON care_plan_wizard_steps FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update for all users" ON care_plan_wizard_steps FOR UPDATE USING (true);
CREATE POLICY "Enable delete for all users" ON care_plan_wizard_steps FOR DELETE USING (true);

-- Add trigger to update updated_at column
CREATE OR REPLACE TRIGGER update_care_plan_wizard_steps_updated_at
    BEFORE UPDATE ON care_plan_wizard_steps
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

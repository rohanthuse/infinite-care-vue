
-- Create medication administration records table
CREATE TABLE public.medication_administration_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  medication_id UUID NOT NULL REFERENCES public.client_medications(id) ON DELETE CASCADE,
  administered_at TIMESTAMP WITH TIME ZONE NOT NULL,
  administered_by TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('given', 'refused', 'not_given', 'not_applicable')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security
ALTER TABLE public.medication_administration_records ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for medication administration records
CREATE POLICY "Users can view medication administration records for their branch" 
  ON public.medication_administration_records 
  FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.client_medications cm
      JOIN public.client_care_plans ccp ON cm.care_plan_id = ccp.id
      JOIN public.clients c ON ccp.client_id = c.id
      JOIN public.admin_branches ab ON c.branch_id = ab.branch_id
      WHERE cm.id = medication_administration_records.medication_id 
      AND ab.admin_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Users can insert medication administration records for their branch" 
  ON public.medication_administration_records 
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.client_medications cm
      JOIN public.client_care_plans ccp ON cm.care_plan_id = ccp.id
      JOIN public.clients c ON ccp.client_id = c.id
      JOIN public.admin_branches ab ON c.branch_id = ab.branch_id
      WHERE cm.id = medication_administration_records.medication_id 
      AND ab.admin_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'super_admin')
  );

CREATE POLICY "Users can update medication administration records for their branch" 
  ON public.medication_administration_records 
  FOR UPDATE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.client_medications cm
      JOIN public.client_care_plans ccp ON cm.care_plan_id = ccp.id
      JOIN public.clients c ON ccp.client_id = c.id
      JOIN public.admin_branches ab ON c.branch_id = ab.branch_id
      WHERE cm.id = medication_administration_records.medication_id 
      AND ab.admin_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'super_admin')
  );

-- Add trigger for updated_at
CREATE TRIGGER update_medication_administration_records_updated_at
  BEFORE UPDATE ON public.medication_administration_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

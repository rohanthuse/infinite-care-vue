-- Create staff_notes table
CREATE TABLE public.staff_notes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id uuid NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  title text NOT NULL,
  content text NOT NULL,
  author text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.staff_notes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (organization-aware)
CREATE POLICY "Organization members can view staff notes" ON public.staff_notes
FOR SELECT USING (
  staff_id IN (
    SELECT s.id FROM public.staff s
    JOIN public.branches b ON s.branch_id = b.id
    WHERE b.organization_id = get_user_organization_id(auth.uid())
  )
);

CREATE POLICY "Organization members can insert staff notes" ON public.staff_notes
FOR INSERT WITH CHECK (
  staff_id IN (
    SELECT s.id FROM public.staff s
    JOIN public.branches b ON s.branch_id = b.id
    WHERE b.organization_id = get_user_organization_id(auth.uid())
  )
);

CREATE POLICY "Organization members can update staff notes" ON public.staff_notes
FOR UPDATE USING (
  staff_id IN (
    SELECT s.id FROM public.staff s
    JOIN public.branches b ON s.branch_id = b.id
    WHERE b.organization_id = get_user_organization_id(auth.uid())
  )
);

CREATE POLICY "Organization members can delete staff notes" ON public.staff_notes
FOR DELETE USING (
  staff_id IN (
    SELECT s.id FROM public.staff s
    JOIN public.branches b ON s.branch_id = b.id
    WHERE b.organization_id = get_user_organization_id(auth.uid())
  )
);

-- Add updated_at trigger
CREATE TRIGGER update_staff_notes_updated_at 
  BEFORE UPDATE ON public.staff_notes 
  FOR EACH ROW 
  EXECUTE PROCEDURE public.update_updated_at_column();

-- Add indexes for performance
CREATE INDEX idx_staff_notes_staff_id ON public.staff_notes(staff_id);
CREATE INDEX idx_staff_notes_created_at ON public.staff_notes(created_at DESC);
-- Create staff_statements table
CREATE TABLE public.staff_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  statement TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(staff_id)
);

-- Create staff_references table
CREATE TABLE public.staff_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position TEXT NOT NULL,
  company TEXT NOT NULL,
  relationship TEXT NOT NULL,
  contact_date DATE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  statement TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create staff_career_highlights table
CREATE TABLE public.staff_career_highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  achieved_date DATE NOT NULL,
  highlight_type TEXT NOT NULL CHECK (highlight_type IN ('award', 'achievement', 'certification', 'milestone')),
  color TEXT NOT NULL DEFAULT 'blue',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.staff_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_references ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_career_highlights ENABLE ROW LEVEL SECURITY;

-- RLS Policies for staff_statements
CREATE POLICY "Staff can view their own statement"
  ON public.staff_statements FOR SELECT
  USING (staff_id IN (SELECT id FROM public.staff WHERE auth_user_id = auth.uid()));

CREATE POLICY "Staff can update their own statement"
  ON public.staff_statements FOR UPDATE
  USING (staff_id IN (SELECT id FROM public.staff WHERE auth_user_id = auth.uid()));

CREATE POLICY "Staff can insert their own statement"
  ON public.staff_statements FOR INSERT
  WITH CHECK (staff_id IN (SELECT id FROM public.staff WHERE auth_user_id = auth.uid()));

CREATE POLICY "Admins can view all statements"
  ON public.staff_statements FOR SELECT
  USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'branch_admin'::app_role));

CREATE POLICY "Admins can manage all statements"
  ON public.staff_statements FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'branch_admin'::app_role));

-- RLS Policies for staff_references
CREATE POLICY "Staff can view their own references"
  ON public.staff_references FOR SELECT
  USING (staff_id IN (SELECT id FROM public.staff WHERE auth_user_id = auth.uid()));

CREATE POLICY "Admins can view all references"
  ON public.staff_references FOR SELECT
  USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'branch_admin'::app_role));

CREATE POLICY "Admins can manage references"
  ON public.staff_references FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'branch_admin'::app_role));

-- RLS Policies for staff_career_highlights
CREATE POLICY "Staff can view their own highlights"
  ON public.staff_career_highlights FOR SELECT
  USING (staff_id IN (SELECT id FROM public.staff WHERE auth_user_id = auth.uid()));

CREATE POLICY "Staff can manage their own highlights"
  ON public.staff_career_highlights FOR ALL
  USING (staff_id IN (SELECT id FROM public.staff WHERE auth_user_id = auth.uid()));

CREATE POLICY "Admins can view all highlights"
  ON public.staff_career_highlights FOR SELECT
  USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'branch_admin'::app_role));

CREATE POLICY "Admins can manage all highlights"
  ON public.staff_career_highlights FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role) OR has_role(auth.uid(), 'branch_admin'::app_role));

-- Create indexes
CREATE INDEX idx_staff_statements_staff_id ON public.staff_statements(staff_id);
CREATE INDEX idx_staff_references_staff_id ON public.staff_references(staff_id);
CREATE INDEX idx_staff_career_highlights_staff_id ON public.staff_career_highlights(staff_id);

-- Create updated_at triggers
CREATE TRIGGER update_staff_statements_updated_at
  BEFORE UPDATE ON public.staff_statements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_staff_references_updated_at
  BEFORE UPDATE ON public.staff_references
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_staff_career_highlights_updated_at
  BEFORE UPDATE ON public.staff_career_highlights
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
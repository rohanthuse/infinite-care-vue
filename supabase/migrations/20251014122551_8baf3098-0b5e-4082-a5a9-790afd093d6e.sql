-- Create staff_skills junction table
CREATE TABLE IF NOT EXISTS public.staff_skills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  skill_id UUID NOT NULL REFERENCES public.skills(id) ON DELETE CASCADE,
  proficiency_level TEXT NOT NULL DEFAULT 'intermediate',
  verified BOOLEAN DEFAULT false,
  last_assessed DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  CONSTRAINT unique_staff_skill UNIQUE (staff_id, skill_id),
  CONSTRAINT valid_proficiency_level CHECK (proficiency_level IN ('beginner', 'basic', 'intermediate', 'advanced', 'expert'))
);

-- Create indexes for performance
CREATE INDEX idx_staff_skills_staff_id ON public.staff_skills(staff_id);
CREATE INDEX idx_staff_skills_skill_id ON public.staff_skills(skill_id);

-- Enable RLS
ALTER TABLE public.staff_skills ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Staff can view their own skills
CREATE POLICY "Staff can view their own skills"
ON public.staff_skills
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.staff s
    WHERE s.auth_user_id = auth.uid()
    AND s.id = staff_skills.staff_id
  )
);

-- RLS Policy: Admins can manage staff skills in their branch
CREATE POLICY "Admins can manage staff skills"
ON public.staff_skills
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admin_branches ab
    JOIN public.staff s ON s.branch_id = ab.branch_id
    WHERE ab.admin_id = auth.uid()
    AND s.id = staff_skills.staff_id
  )
  OR
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'super_admin'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admin_branches ab
    JOIN public.staff s ON s.branch_id = ab.branch_id
    WHERE ab.admin_id = auth.uid()
    AND s.id = staff_skills.staff_id
  )
  OR
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'super_admin'
  )
);

-- Staff can manage their own skills
CREATE POLICY "Staff can manage their own skills"
ON public.staff_skills
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.staff s
    WHERE s.auth_user_id = auth.uid()
    AND s.id = staff_skills.staff_id
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.staff s
    WHERE s.auth_user_id = auth.uid()
    AND s.id = staff_skills.staff_id
  )
);

COMMENT ON TABLE public.staff_skills IS 'Junction table linking staff members to skills with proficiency levels and verification status';

-- Create tasks table with proper relationships (without foreign key references to auth.users)
CREATE TABLE public.tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'todo' CHECK (status IN ('backlog', 'todo', 'in-progress', 'review', 'done')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  branch_id UUID REFERENCES public.branches(id) NOT NULL,
  assignee_id UUID REFERENCES public.staff(id),
  client_id UUID REFERENCES public.clients(id),
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID, -- Remove foreign key constraint to avoid auth.users issues
  tags TEXT[] DEFAULT '{}',
  category TEXT DEFAULT 'general',
  notes TEXT,
  completion_percentage INTEGER DEFAULT 0 CHECK (completion_percentage >= 0 AND completion_percentage <= 100)
);

-- Add RLS policies for tasks
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Policy for reading tasks - users can see tasks in their branches
CREATE POLICY "Users can view tasks in their branches"
  ON public.tasks FOR SELECT
  USING (
    public.has_role(auth.uid(), 'super_admin') OR
    EXISTS (
      SELECT 1 FROM public.admin_branches ab 
      WHERE ab.branch_id = tasks.branch_id 
      AND ab.admin_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.staff s
      WHERE s.id = auth.uid()
      AND s.branch_id = tasks.branch_id
    ) OR
    EXISTS (
      SELECT 1 FROM public.clients c
      WHERE c.id = auth.uid()
      AND c.branch_id = tasks.branch_id
    )
  );

-- Policy for inserting tasks - admins and staff can create tasks
CREATE POLICY "Admins and staff can create tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (
    public.has_role(auth.uid(), 'super_admin') OR
    EXISTS (
      SELECT 1 FROM public.admin_branches ab 
      WHERE ab.branch_id = tasks.branch_id 
      AND ab.admin_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.staff s
      WHERE s.id = auth.uid()
      AND s.branch_id = tasks.branch_id
    )
  );

-- Policy for updating tasks - admins, staff, and assignees can update
CREATE POLICY "Admins, staff and assignees can update tasks"
  ON public.tasks FOR UPDATE
  USING (
    public.has_role(auth.uid(), 'super_admin') OR
    EXISTS (
      SELECT 1 FROM public.admin_branches ab 
      WHERE ab.branch_id = tasks.branch_id 
      AND ab.admin_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.staff s
      WHERE s.id = auth.uid()
      AND s.branch_id = tasks.branch_id
    ) OR
    assignee_id = auth.uid()
  );

-- Policy for deleting tasks - only admins can delete
CREATE POLICY "Admins can delete tasks"
  ON public.tasks FOR DELETE
  USING (
    public.has_role(auth.uid(), 'super_admin') OR
    EXISTS (
      SELECT 1 FROM public.admin_branches ab 
      WHERE ab.branch_id = tasks.branch_id 
      AND ab.admin_id = auth.uid()
    )
  );

-- Create trigger for updating updated_at timestamp
CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert comprehensive dummy data with safer approach
INSERT INTO public.tasks (title, description, status, priority, branch_id, assignee_id, client_id, due_date, tags, category, notes, completion_percentage) VALUES

-- Medical/Health Tasks
('Daily medication review for Emma Thompson', 'Review and update medication schedule, check for interactions and side effects', 'todo', 'high', 
 (SELECT id FROM public.branches LIMIT 1), 
 (SELECT id FROM public.staff LIMIT 1),
 (SELECT id FROM public.clients LIMIT 1),
 now() + interval '2 hours', 
 ARRAY['medication', 'urgent', 'review'], 'Medical', 'Patient reported feeling dizzy after morning medication', 0),

('Physiotherapy session preparation', 'Set up equipment and review treatment plan for client', 'in-progress', 'medium',
 (SELECT id FROM public.branches LIMIT 1),
 (SELECT id FROM public.staff LIMIT 1 OFFSET 1),
 (SELECT id FROM public.clients LIMIT 1 OFFSET 1),
 now() + interval '4 hours',
 ARRAY['physiotherapy', 'equipment', 'preparation'], 'Therapy', 'Focus on lower back exercises', 25),

-- Administrative Tasks
('Complete weekly care plan reviews', 'Review and update care plans for all assigned clients', 'todo', 'medium',
 (SELECT id FROM public.branches LIMIT 1),
 (SELECT id FROM public.staff LIMIT 1 OFFSET 2),
 NULL,
 now() + interval '1 day',
 ARRAY['care-plan', 'review', 'weekly'], 'Administrative', 'Include new dietary requirements updates', 0),

('Update client contact information', 'Verify and update emergency contact details for client', 'backlog', 'low',
 (SELECT id FROM public.branches LIMIT 1),
 (SELECT id FROM public.staff LIMIT 1 OFFSET 3),
 (SELECT id FROM public.clients LIMIT 1 OFFSET 2),
 now() + interval '3 days',
 ARRAY['admin', 'contact', 'update'], 'Administrative', 'Client requested to add daughter as secondary contact', 0),

-- Emergency/Urgent Tasks
('Equipment maintenance check', 'Inspect and test all mobility equipment in facility', 'todo', 'urgent',
 (SELECT id FROM public.branches LIMIT 1),
 (SELECT id FROM public.staff LIMIT 1),
 NULL,
 now() + interval '6 hours',
 ARRAY['equipment', 'maintenance', 'safety'], 'Maintenance', 'Wheelchair brake reported as loose', 0),

-- Nutritional Tasks
('Dietary assessment for client', 'Conduct comprehensive nutritional evaluation and meal planning', 'review', 'medium',
 (SELECT id FROM public.branches LIMIT 1),
 (SELECT id FROM public.staff LIMIT 1 OFFSET 1),
 (SELECT id FROM public.clients LIMIT 1 OFFSET 3),
 now() + interval '8 hours',
 ARRAY['nutrition', 'assessment', 'meal-planning'], 'Nutrition', 'Client has new diabetes diagnosis', 75),

-- Training Tasks
('New staff orientation session', 'Conduct orientation for newly hired care assistants', 'todo', 'high',
 (SELECT id FROM public.branches LIMIT 1),
 (SELECT id FROM public.staff LIMIT 1 OFFSET 2),
 NULL,
 now() + interval '2 days',
 ARRAY['training', 'orientation', 'new-staff'], 'Training', '3 new staff members starting Monday', 0),

-- Completed Tasks
('Monthly safety inspection', 'Complete facility safety checklist and document findings', 'done', 'medium',
 (SELECT id FROM public.branches LIMIT 1),
 (SELECT id FROM public.staff LIMIT 1 OFFSET 3),
 NULL,
 now() - interval '2 days',
 ARRAY['safety', 'inspection', 'monthly'], 'Safety', 'All safety measures passed inspection', 100),

('Client satisfaction survey collection', 'Gather feedback from clients about service quality', 'done', 'low',
 (SELECT id FROM public.branches LIMIT 1),
 (SELECT id FROM public.staff LIMIT 1),
 NULL,
 now() - interval '1 day',
 ARRAY['survey', 'feedback', 'quality'], 'Administrative', 'Positive feedback overall, 4.2/5 average rating', 100),

-- Social/Activity Tasks
('Organize weekly social activity', 'Plan and coordinate group activities for clients', 'in-progress', 'low',
 (SELECT id FROM public.branches LIMIT 1),
 (SELECT id FROM public.staff LIMIT 1 OFFSET 1),
 NULL,
 now() + interval '3 days',
 ARRAY['social', 'activities', 'group'], 'Social', 'Garden party weather permitting', 60),

-- Documentation Tasks
('Update care documentation system', 'Migrate old paper records to digital system', 'backlog', 'medium',
 (SELECT id FROM public.branches LIMIT 1),
 (SELECT id FROM public.staff LIMIT 1 OFFSET 2),
 NULL,
 now() + interval '1 week',
 ARRAY['documentation', 'digital', 'migration'], 'Administrative', 'Phase 1: Client records from 2023', 0),

-- Emergency Response Tasks
('Emergency contact drill', 'Practice emergency procedures with all staff members', 'todo', 'high',
 (SELECT id FROM public.branches LIMIT 1),
 (SELECT id FROM public.staff LIMIT 1 OFFSET 3),
 NULL,
 now() + interval '5 days',
 ARRAY['emergency', 'drill', 'training'], 'Safety', 'Annual requirement - due this month', 0),

-- Technology Tasks
('Software training session', 'Train staff on new care management software features', 'review', 'medium',
 (SELECT id FROM public.branches LIMIT 1),
 (SELECT id FROM public.staff LIMIT 1),
 NULL,
 now() + interval '4 days',
 ARRAY['software', 'training', 'technology'], 'Training', 'Focus on new reporting features', 80),

-- Client-specific Tasks
('Mobility assessment for client', 'Evaluate current mobility aids and recommend improvements', 'todo', 'medium',
 (SELECT id FROM public.branches LIMIT 1),
 (SELECT id FROM public.staff LIMIT 1 OFFSET 1),
 (SELECT id FROM public.clients LIMIT 1),
 now() + interval '6 hours',
 ARRAY['mobility', 'assessment', 'equipment'], 'Medical', 'Client reported difficulty with stairs', 0),

-- Facility Management
('Deep cleaning schedule coordination', 'Coordinate with cleaning service for quarterly deep clean', 'in-progress', 'low',
 (SELECT id FROM public.branches LIMIT 1),
 (SELECT id FROM public.staff LIMIT 1 OFFSET 2),
 NULL,
 now() + interval '2 weeks',
 ARRAY['cleaning', 'facility', 'coordination'], 'Maintenance', 'Include carpet cleaning and window washing', 30);

-- Enable realtime for tasks table
ALTER TABLE public.tasks REPLICA IDENTITY FULL;

-- Create staff_work_preferences table
CREATE TABLE public.staff_work_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
  client_types TEXT[] DEFAULT '{}',
  service_types TEXT[] DEFAULT '{}',
  work_patterns TEXT[] DEFAULT '{}',
  work_locations TEXT[] DEFAULT '{}',
  travel_distance INTEGER DEFAULT 10,
  special_notes TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(staff_id)
);

-- Enable RLS
ALTER TABLE public.staff_work_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies

-- Staff can view their own preferences
CREATE POLICY "Staff can view own work preferences"
  ON public.staff_work_preferences
  FOR SELECT
  USING (
    staff_id IN (
      SELECT id FROM public.staff WHERE auth_user_id = auth.uid()
    )
  );

-- Admins can view all work preferences
CREATE POLICY "Admins can view all work preferences"
  ON public.staff_work_preferences
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'branch_admin', 'app_admin')
    )
  );

-- Staff can insert their own preferences
CREATE POLICY "Staff can insert own work preferences"
  ON public.staff_work_preferences
  FOR INSERT
  WITH CHECK (
    staff_id IN (
      SELECT id FROM public.staff WHERE auth_user_id = auth.uid()
    )
  );

-- Admins can insert work preferences for any staff
CREATE POLICY "Admins can insert work preferences"
  ON public.staff_work_preferences
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'branch_admin', 'app_admin')
    )
  );

-- Staff can update their own preferences
CREATE POLICY "Staff can update own work preferences"
  ON public.staff_work_preferences
  FOR UPDATE
  USING (
    staff_id IN (
      SELECT id FROM public.staff WHERE auth_user_id = auth.uid()
    )
  );

-- Admins can update any work preferences
CREATE POLICY "Admins can update work preferences"
  ON public.staff_work_preferences
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('super_admin', 'branch_admin', 'app_admin')
    )
  );

-- Create trigger for updated_at
CREATE TRIGGER update_staff_work_preferences_updated_at
  BEFORE UPDATE ON public.staff_work_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_essentials_updated_at();
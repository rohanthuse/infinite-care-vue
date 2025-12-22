-- Create system_services table
CREATE TABLE public.system_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT,
  description TEXT,
  code TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create system_hobbies table
CREATE TABLE public.system_hobbies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create system_skills table
CREATE TABLE public.system_skills (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  explanation TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create system_medical_categories table
CREATE TABLE public.system_medical_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create system_medical_conditions table
CREATE TABLE public.system_medical_conditions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  category_id UUID REFERENCES public.system_medical_categories(id) ON DELETE SET NULL,
  field_caption TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create system_work_types table
CREATE TABLE public.system_work_types (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Create system_body_map_points table
CREATE TABLE public.system_body_map_points (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  letter TEXT NOT NULL,
  title TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#FF0000',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);

-- Enable RLS on all tables
ALTER TABLE public.system_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_hobbies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_skills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_medical_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_medical_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_work_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_body_map_points ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for system_services
CREATE POLICY "App admins can manage system_services" ON public.system_services
  FOR ALL USING (public.is_app_admin(auth.uid()));

CREATE POLICY "Authenticated users can view active system_services" ON public.system_services
  FOR SELECT USING (status = 'active');

-- Create RLS policies for system_hobbies
CREATE POLICY "App admins can manage system_hobbies" ON public.system_hobbies
  FOR ALL USING (public.is_app_admin(auth.uid()));

CREATE POLICY "Authenticated users can view active system_hobbies" ON public.system_hobbies
  FOR SELECT USING (status = 'active');

-- Create RLS policies for system_skills
CREATE POLICY "App admins can manage system_skills" ON public.system_skills
  FOR ALL USING (public.is_app_admin(auth.uid()));

CREATE POLICY "Authenticated users can view active system_skills" ON public.system_skills
  FOR SELECT USING (status = 'active');

-- Create RLS policies for system_medical_categories
CREATE POLICY "App admins can manage system_medical_categories" ON public.system_medical_categories
  FOR ALL USING (public.is_app_admin(auth.uid()));

CREATE POLICY "Authenticated users can view active system_medical_categories" ON public.system_medical_categories
  FOR SELECT USING (status = 'active');

-- Create RLS policies for system_medical_conditions
CREATE POLICY "App admins can manage system_medical_conditions" ON public.system_medical_conditions
  FOR ALL USING (public.is_app_admin(auth.uid()));

CREATE POLICY "Authenticated users can view active system_medical_conditions" ON public.system_medical_conditions
  FOR SELECT USING (status = 'active');

-- Create RLS policies for system_work_types
CREATE POLICY "App admins can manage system_work_types" ON public.system_work_types
  FOR ALL USING (public.is_app_admin(auth.uid()));

CREATE POLICY "Authenticated users can view active system_work_types" ON public.system_work_types
  FOR SELECT USING (status = 'active');

-- Create RLS policies for system_body_map_points
CREATE POLICY "App admins can manage system_body_map_points" ON public.system_body_map_points
  FOR ALL USING (public.is_app_admin(auth.uid()));

CREATE POLICY "Authenticated users can view active system_body_map_points" ON public.system_body_map_points
  FOR SELECT USING (status = 'active');

-- Create update triggers for updated_at
CREATE TRIGGER update_system_services_updated_at
  BEFORE UPDATE ON public.system_services
  FOR EACH ROW EXECUTE FUNCTION public.update_system_template_updated_at();

CREATE TRIGGER update_system_hobbies_updated_at
  BEFORE UPDATE ON public.system_hobbies
  FOR EACH ROW EXECUTE FUNCTION public.update_system_template_updated_at();

CREATE TRIGGER update_system_skills_updated_at
  BEFORE UPDATE ON public.system_skills
  FOR EACH ROW EXECUTE FUNCTION public.update_system_template_updated_at();

CREATE TRIGGER update_system_medical_categories_updated_at
  BEFORE UPDATE ON public.system_medical_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_system_template_updated_at();

CREATE TRIGGER update_system_medical_conditions_updated_at
  BEFORE UPDATE ON public.system_medical_conditions
  FOR EACH ROW EXECUTE FUNCTION public.update_system_template_updated_at();

CREATE TRIGGER update_system_work_types_updated_at
  BEFORE UPDATE ON public.system_work_types
  FOR EACH ROW EXECUTE FUNCTION public.update_system_template_updated_at();

CREATE TRIGGER update_system_body_map_points_updated_at
  BEFORE UPDATE ON public.system_body_map_points
  FOR EACH ROW EXECUTE FUNCTION public.update_system_template_updated_at();
-- Drop old broken RLS policies on system_templates
DROP POLICY IF EXISTS "App admins can manage system templates" ON public.system_templates;
DROP POLICY IF EXISTS "Authenticated users can read published templates" ON public.system_templates;

-- Drop old broken RLS policies on system_template_elements
DROP POLICY IF EXISTS "App admins can manage template elements" ON public.system_template_elements;
DROP POLICY IF EXISTS "Authenticated users can read elements of published templates" ON public.system_template_elements;

-- Create new RLS policies for system_templates using correct system session pattern
CREATE POLICY "System admins can view system templates"
ON public.system_templates FOR SELECT TO public
USING (is_system_super_admin(get_current_system_user_id()));

CREATE POLICY "System admins can insert system templates"
ON public.system_templates FOR INSERT TO public
WITH CHECK (is_system_super_admin(get_current_system_user_id()));

CREATE POLICY "System admins can update system templates"
ON public.system_templates FOR UPDATE TO public
USING (is_system_super_admin(get_current_system_user_id()));

CREATE POLICY "System admins can delete system templates"
ON public.system_templates FOR DELETE TO public
USING (is_system_super_admin(get_current_system_user_id()));

-- Tenants can read published templates (using standard auth)
CREATE POLICY "Tenants can read published templates"
ON public.system_templates FOR SELECT TO authenticated
USING (published = true);

-- Create new RLS policies for system_template_elements using correct system session pattern
CREATE POLICY "System admins can view template elements"
ON public.system_template_elements FOR SELECT TO public
USING (is_system_super_admin(get_current_system_user_id()));

CREATE POLICY "System admins can insert template elements"
ON public.system_template_elements FOR INSERT TO public
WITH CHECK (is_system_super_admin(get_current_system_user_id()));

CREATE POLICY "System admins can update template elements"
ON public.system_template_elements FOR UPDATE TO public
USING (is_system_super_admin(get_current_system_user_id()));

CREATE POLICY "System admins can delete template elements"
ON public.system_template_elements FOR DELETE TO public
USING (is_system_super_admin(get_current_system_user_id()));

-- Tenants can read elements of published templates
CREATE POLICY "Tenants can read elements of published templates"
ON public.system_template_elements FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.system_templates st
    WHERE st.id = system_template_elements.template_id
    AND st.published = true
  )
);
-- Create a demo organization for testing
INSERT INTO public.organizations (
  id,
  name,
  subdomain,
  slug,
  contact_email,
  subscription_status,
  subscription_plan,
  primary_color,
  secondary_color
) VALUES (
  gen_random_uuid(),
  'Demo Care Services',
  'demo',
  'demo',
  'demo@med-infinite.care',
  'active',
  'basic',
  '#1E40AF',
  '#F3F4F6'
) ON CONFLICT (subdomain) DO NOTHING;
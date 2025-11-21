-- Add License and Custom agreement types, and rename Subscription Agreement

-- Update existing Subscription Agreement to just Subscription
UPDATE public.system_tenant_agreement_types
SET name = 'Subscription'
WHERE name = 'Subscription Agreement';

-- Insert License agreement type
INSERT INTO public.system_tenant_agreement_types (name, description, status)
VALUES 
  ('License', 'Software licensing terms and conditions', 'Active'),
  ('Custom', 'Custom agreement terms tailored to specific requirements', 'Active')
ON CONFLICT DO NOTHING;
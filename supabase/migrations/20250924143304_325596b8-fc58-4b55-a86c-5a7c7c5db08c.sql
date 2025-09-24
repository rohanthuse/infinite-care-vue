-- Add missing user role for opeyemi.ayo-famure@nhs.net
-- This user exists in organization_members but is missing from user_roles table
-- which is causing login failure

INSERT INTO public.user_roles (user_id, role)
VALUES ('56738cbf-16f1-4334-9938-3fc0cae0d162', 'branch_admin')
ON CONFLICT (user_id, role) DO NOTHING;
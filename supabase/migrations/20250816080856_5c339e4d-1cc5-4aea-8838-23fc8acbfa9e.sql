-- Fix XYZ organization super admin role from 'member' to 'owner'
UPDATE public.organization_members 
SET role = 'owner', updated_at = now()
WHERE user_id = '4163455d-0657-424b-aa01-bf16b7311fc6' 
AND organization_id = 'cfde5bfd-02c8-431d-8d87-bd88b8e53f76'
AND role = 'member';
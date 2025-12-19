-- Drop the incorrect FK constraint that references organizations.id
ALTER TABLE public.client_billing 
DROP CONSTRAINT IF EXISTS client_billing_authority_id_fkey;

-- Add the correct FK constraint pointing to authorities table
ALTER TABLE public.client_billing 
ADD CONSTRAINT client_billing_authority_id_fkey 
FOREIGN KEY (authority_id) REFERENCES public.authorities(id);
-- Create client_key_contacts table to store client key contacts
CREATE TABLE public.client_key_contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  surname TEXT NOT NULL,
  relationship TEXT,
  is_next_of_kin BOOLEAN DEFAULT false,
  gender TEXT,
  email TEXT,
  phone TEXT,
  contact_type TEXT NOT NULL,
  address TEXT,
  preferred_communication TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.client_key_contacts ENABLE ROW LEVEL SECURITY;

-- Create policies for access
CREATE POLICY "Users can view client key contacts" 
ON public.client_key_contacts 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert client key contacts" 
ON public.client_key_contacts 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can update client key contacts" 
ON public.client_key_contacts 
FOR UPDATE 
USING (true);

CREATE POLICY "Users can delete client key contacts" 
ON public.client_key_contacts 
FOR DELETE 
USING (true);

-- Create index for faster lookups
CREATE INDEX idx_client_key_contacts_client_id ON public.client_key_contacts(client_id);

-- Create trigger for updating updated_at
CREATE TRIGGER update_client_key_contacts_updated_at
  BEFORE UPDATE ON public.client_key_contacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_essentials_updated_at();
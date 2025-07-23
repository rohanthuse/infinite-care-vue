
-- Add RLS policies to allow clients to view and update their own profiles
-- Policy for clients table - allow clients to view their own record
CREATE POLICY "Clients can view their own profile" 
ON public.clients 
FOR SELECT 
USING (auth_user_id = auth.uid());

-- Policy for clients table - allow clients to update their own record
CREATE POLICY "Clients can update their own profile" 
ON public.clients 
FOR UPDATE 
USING (auth_user_id = auth.uid());

-- Policy for client_personal_info table - allow clients to view their own info
CREATE POLICY "Clients can view their own personal info" 
ON public.client_personal_info 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.clients c 
    WHERE c.id = client_personal_info.client_id 
    AND c.auth_user_id = auth.uid()
  )
);

-- Policy for client_personal_info table - allow clients to update their own info
CREATE POLICY "Clients can update their own personal info" 
ON public.client_personal_info 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.clients c 
    WHERE c.id = client_personal_info.client_id 
    AND c.auth_user_id = auth.uid()
  )
);

-- Policy for client_personal_info table - allow clients to insert their own info
CREATE POLICY "Clients can insert their own personal info" 
ON public.client_personal_info 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.clients c 
    WHERE c.id = client_personal_info.client_id 
    AND c.auth_user_id = auth.uid()
  )
);

-- Policy for client_medical_info table - allow clients to view their own info
CREATE POLICY "Clients can view their own medical info" 
ON public.client_medical_info 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.clients c 
    WHERE c.id = client_medical_info.client_id 
    AND c.auth_user_id = auth.uid()
  )
);

-- Policy for client_medical_info table - allow clients to update their own info
CREATE POLICY "Clients can update their own medical info" 
ON public.client_medical_info 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.clients c 
    WHERE c.id = client_medical_info.client_id 
    AND c.auth_user_id = auth.uid()
  )
);

-- Policy for client_medical_info table - allow clients to insert their own info
CREATE POLICY "Clients can insert their own medical info" 
ON public.client_medical_info 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.clients c 
    WHERE c.id = client_medical_info.client_id 
    AND c.auth_user_id = auth.uid()
  )
);

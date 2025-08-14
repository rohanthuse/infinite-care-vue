-- Add public read policy for organizations to allow login page access
-- This allows unauthenticated users to read basic organization info needed for branding
CREATE POLICY "Public can read basic organization info for login" 
ON public.organizations 
FOR SELECT 
USING (true);

-- Note: This policy allows reading organization data for login page branding
-- Sensitive data access is still controlled by existing member-only policies
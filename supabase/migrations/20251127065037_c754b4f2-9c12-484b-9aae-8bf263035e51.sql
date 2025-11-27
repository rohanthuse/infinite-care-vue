-- Add auth_user_id column to third_party_users to link to Supabase Auth users
ALTER TABLE public.third_party_users 
ADD COLUMN IF NOT EXISTS auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_third_party_users_auth_user_id ON public.third_party_users(auth_user_id);

-- Add comment for documentation
COMMENT ON COLUMN public.third_party_users.auth_user_id IS 'Links to Supabase Auth user for unified login system';
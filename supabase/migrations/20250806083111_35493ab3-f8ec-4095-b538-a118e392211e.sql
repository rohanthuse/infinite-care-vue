-- Fix admin_branches foreign key constraint to reference auth.users instead of profiles
-- This resolves the foreign key violation when creating admins

-- First, drop the existing foreign key constraint
ALTER TABLE public.admin_branches 
DROP CONSTRAINT IF EXISTS admin_branches_admin_id_fkey;

-- Add new foreign key constraint referencing auth.users(id)
ALTER TABLE public.admin_branches 
ADD CONSTRAINT admin_branches_admin_id_fkey 
FOREIGN KEY (admin_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Ensure the admin_branches table has proper indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_branches_admin_id ON public.admin_branches(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_branches_branch_id ON public.admin_branches(branch_id);
-- Step 1: Assign all global services to Demo Care Services organization
UPDATE public.services
SET organization_id = 'eafad772-7e4c-491b-8d4d-dc489a5f425c'
WHERE organization_id IS NULL;

-- Step 2: Drop the old RLS policy that allowed global services
DROP POLICY IF EXISTS "Organization members can view services" ON public.services;

-- Step 3: Create new strict RLS policy - only show services from user's organization
CREATE POLICY "Organization members can view services"
  ON public.services
  FOR SELECT
  USING (
    organization_id = get_user_organization_id(auth.uid())
  );
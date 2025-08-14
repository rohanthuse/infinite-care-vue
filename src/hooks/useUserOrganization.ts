import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface UserOrganization {
  id: string;
  name: string;
  slug: string;
  role: string;
  status: string;
}

const fetchUserOrganization = async (): Promise<UserOrganization | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return null;
  }

  // Get user's organization membership
  const { data: membership, error } = await supabase
    .from('organization_members')
    .select(`
      role,
      status,
      organizations (
        id,
        name,
        slug
      )
    `)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();

  if (error || !membership || !membership.organizations) {
    return null;
  }

  return {
    id: membership.organizations.id,
    name: membership.organizations.name,
    slug: membership.organizations.slug,
    role: membership.role,
    status: membership.status,
  };
};

export const useUserOrganization = () => {
  return useQuery({
    queryKey: ['user-organization'],
    queryFn: fetchUserOrganization,
    enabled: true,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};
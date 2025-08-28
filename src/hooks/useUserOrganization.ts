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

  console.log('[useUserOrganization] Fetching organization for user:', user.id);

  // Get user's organization memberships with role-based priority
  const { data: memberships, error } = await supabase
    .from('organization_members')
    .select(`
      role,
      status,
      joined_at,
      organizations (
        id,
        name,
        slug
      )
    `)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('joined_at', { ascending: false }); // Most recent first as tiebreaker

  if (error) {
    console.error('[useUserOrganization] Error fetching memberships:', error);
    return null;
  }

  if (!memberships || memberships.length === 0) {
    console.log('[useUserOrganization] No active memberships found');
    return null;
  }

  console.log('[useUserOrganization] Found memberships:', memberships.length);

  // Sort by role priority: owner > admin > member
  const prioritizedMemberships = memberships
    .filter(m => m.organizations) // Ensure organization data exists
    .sort((a, b) => {
      const roleOrder = { owner: 1, admin: 2, member: 3 };
      const aOrder = roleOrder[a.role as keyof typeof roleOrder] || 999;
      const bOrder = roleOrder[b.role as keyof typeof roleOrder] || 999;
      return aOrder - bOrder;
    });

  const primaryMembership = prioritizedMemberships[0];
  
  if (!primaryMembership) {
    console.log('[useUserOrganization] No valid membership found');
    return null;
  }

  console.log('[useUserOrganization] Selected primary organization:', {
    org: primaryMembership.organizations.name,
    role: primaryMembership.role,
    totalMemberships: memberships.length
  });

  return {
    id: primaryMembership.organizations.id,
    name: primaryMembership.organizations.name,
    slug: primaryMembership.organizations.slug,
    role: primaryMembership.role,
    status: primaryMembership.status,
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
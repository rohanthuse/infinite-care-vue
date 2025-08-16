import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface OrganizationOption {
  id: string;
  name: string;
  slug: string;
}

const fetchOrganizations = async (): Promise<OrganizationOption[]> => {
  // Use Edge Function to list tenants (organizations)
  const { data, error } = await supabase.functions.invoke('list-system-tenants');
  if (error) throw error;

  // data may be { tenants: [...] } or an array depending on function implementation
  const tenants = Array.isArray(data) ? data : data?.tenants || [];
  return tenants.map((t: any) => ({ id: t.id, name: t.name, slug: t.slug })) as OrganizationOption[];
};

export const useOrganizations = () => {
  return useQuery({
    queryKey: ['organizations', 'system-tenants'],
    queryFn: fetchOrganizations,
    staleTime: 0, // Always refetch to ensure fresh data for dropdowns
  });
};

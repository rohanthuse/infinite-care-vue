import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface OrganizationOption {
  id: string;
  name: string;
  subdomain?: string;
  subscription_status?: string;
  max_users?: number;
  max_branches?: number;
}

const fetchOrganizations = async (): Promise<OrganizationOption[]> => {
  // Use Edge Function to list tenants (organizations)
  const { data, error } = await supabase.functions.invoke('list-system-tenants');
  if (error) throw error;

  // data may be { tenants: [...] } or an array depending on function implementation
  const tenants = Array.isArray(data) ? data : data?.tenants || [];
  return tenants.map((t: any) => ({ 
    id: t.id, 
    name: t.name, 
    subdomain: t.subdomain,
    subscription_status: t.subscription_status || 'active',
    max_users: t.max_users || 50,
    max_branches: t.max_branches || 5
  })) as OrganizationOption[];
};

export const useOrganizations = () => {
  return useQuery({
    queryKey: ['system-tenants'],
    queryFn: fetchOrganizations,
  });
};


import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ClientProfile {
  id: string;
  first_name: string;
  last_name: string;
  email?: string;
  phone?: string;
  address?: string;
  date_of_birth?: string;
  gender?: string;
  preferred_name?: string;
  middle_name?: string;
  title?: string;
  pronouns?: string;
  mobile_number?: string;
  telephone_number?: string;
  country_code?: string;
  region?: string;
  additional_information?: string;
  referral_route?: string;
  branch_id?: string;
  status?: string;
  created_at: string;
  registered_on?: string;
}

const fetchClientProfile = async (clientId: string): Promise<ClientProfile | null> => {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', clientId)
    .single();

  if (error) throw error;
  return data;
};

export const useClientProfile = (clientId: string) => {
  return useQuery({
    queryKey: ['client-profile', clientId],
    queryFn: () => fetchClientProfile(clientId),
    enabled: Boolean(clientId),
  });
};

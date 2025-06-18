
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ClientPersonalInfo {
  id: string;
  client_id: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  emergency_contact_relationship?: string;
  preferred_communication?: string;
  cultural_preferences?: string;
  language_preferences?: string;
  religion?: string;
  marital_status?: string;
  next_of_kin_name?: string;
  next_of_kin_phone?: string;
  next_of_kin_relationship?: string;
  gp_name?: string;
  gp_practice?: string;
  gp_phone?: string;
  created_at: string;
  updated_at: string;
}

const fetchClientPersonalInfo = async (clientId: string): Promise<ClientPersonalInfo | null> => {
  console.log('[fetchClientPersonalInfo] Fetching for client:', clientId);
  
  const { data, error } = await supabase
    .from('client_personal_info')
    .select('*')
    .eq('client_id', clientId)
    .maybeSingle();

  if (error) {
    console.error('[fetchClientPersonalInfo] Error:', error);
    throw error;
  }

  return data;
};

const upsertClientPersonalInfo = async (personalInfo: Partial<ClientPersonalInfo> & { client_id: string }) => {
  console.log('[upsertClientPersonalInfo] Upserting:', personalInfo);
  
  const { data, error } = await supabase
    .from('client_personal_info')
    .upsert(personalInfo, { onConflict: 'client_id' })
    .select()
    .single();

  if (error) {
    console.error('[upsertClientPersonalInfo] Error:', error);
    throw error;
  }

  return data;
};

export const useClientPersonalInfo = (clientId: string) => {
  return useQuery({
    queryKey: ['client-personal-info', clientId],
    queryFn: () => fetchClientPersonalInfo(clientId),
    enabled: Boolean(clientId),
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdateClientPersonalInfo = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: upsertClientPersonalInfo,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client-personal-info', data.client_id] });
    },
  });
};

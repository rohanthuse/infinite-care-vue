
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ClientMedicalInfo {
  id: string;
  client_id: string;
  allergies?: string[];
  current_medications?: string[];
  medical_conditions?: string[];
  medical_history?: string;
  mobility_status?: string;
  cognitive_status?: string;
  communication_needs?: string;
  sensory_impairments?: string[];
  mental_health_status?: string;
  created_at: string;
  updated_at: string;
}

const fetchClientMedicalInfo = async (clientId: string): Promise<ClientMedicalInfo | null> => {
  console.log('[fetchClientMedicalInfo] Fetching for client:', clientId);
  
  const { data, error } = await supabase
    .from('client_medical_info')
    .select('*')
    .eq('client_id', clientId)
    .maybeSingle();

  if (error) {
    console.error('[fetchClientMedicalInfo] Error:', error);
    throw error;
  }

  console.log('[fetchClientMedicalInfo] Result:', data);
  return data;
};

const upsertClientMedicalInfo = async (medicalInfo: Partial<ClientMedicalInfo> & { client_id: string }) => {
  console.log('[upsertClientMedicalInfo] Upserting:', medicalInfo);
  
  const { data: user } = await supabase.auth.getUser();
  console.log('[upsertClientMedicalInfo] Auth user ID:', user.user?.id);
  
  const { data, error } = await supabase
    .from('client_medical_info')
    .upsert(medicalInfo, { onConflict: 'client_id' })
    .select()
    .maybeSingle();

  if (error) {
    console.error('[upsertClientMedicalInfo] Error details:', {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    });
    throw new Error(`Failed to update medical information: ${error.message}`);
  }

  console.log('[upsertClientMedicalInfo] Result:', data);
  return data;
};

export const useClientMedicalInfo = (clientId: string) => {
  return useQuery({
    queryKey: ['client-medical-info', clientId],
    queryFn: () => fetchClientMedicalInfo(clientId),
    enabled: Boolean(clientId),
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdateClientMedicalInfo = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: upsertClientMedicalInfo,
    onSuccess: (data) => {
      console.log('[useUpdateClientMedicalInfo] Mutation successful, invalidating queries for client:', data.client_id);
      queryClient.invalidateQueries({ queryKey: ['client-medical-info', data.client_id] });
      queryClient.invalidateQueries({ queryKey: ['comprehensive-care-plan-data'] });
    },
    onError: (error) => {
      console.error('[useUpdateClientMedicalInfo] Mutation error:', error);
    }
  });
};

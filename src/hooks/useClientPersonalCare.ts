
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ClientPersonalCare {
  id: string;
  client_id: string;
  personal_hygiene_needs?: string;
  bathing_preferences?: string;
  dressing_assistance_level?: string;
  toileting_assistance_level?: string;
  continence_status?: string;
  sleep_patterns?: string;
  behavioral_notes?: string;
  comfort_measures?: string;
  pain_management?: string;
  skin_care_needs?: string;
  // Incontinence section
  incontinence_products_required?: boolean;
  // Sleep section
  sleep_go_to_bed_time?: string;
  sleep_wake_up_time?: string;
  sleep_get_out_of_bed_time?: string;
  sleep_prepare_duration?: string;
  assist_going_to_bed?: boolean;
  assist_getting_out_of_bed?: boolean;
  panic_button_in_bed?: boolean;
  assist_turn_to_sleep_position?: boolean;
  created_at: string;
  updated_at: string;
}

const fetchClientPersonalCare = async (clientId: string): Promise<ClientPersonalCare | null> => {
  console.log('[fetchClientPersonalCare] Fetching for client:', clientId);
  
  const { data, error } = await supabase
    .from('client_personal_care')
    .select('*')
    .eq('client_id', clientId)
    .maybeSingle();

  if (error) {
    console.error('[fetchClientPersonalCare] Error:', error);
    throw error;
  }

  return data;
};

const upsertClientPersonalCare = async (personalCare: Partial<ClientPersonalCare> & { client_id: string }) => {
  console.log('[upsertClientPersonalCare] Upserting:', personalCare);
  
  const { data, error } = await supabase
    .from('client_personal_care')
    .upsert(personalCare, { onConflict: 'client_id' })
    .select()
    .single();

  if (error) {
    console.error('[upsertClientPersonalCare] Error:', error);
    throw error;
  }

  return data;
};

export const useClientPersonalCare = (clientId: string) => {
  return useQuery({
    queryKey: ['client-personal-care', clientId],
    queryFn: () => fetchClientPersonalCare(clientId),
    enabled: Boolean(clientId),
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdateClientPersonalCare = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: upsertClientPersonalCare,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client-personal-care', data.client_id] });
    },
  });
};

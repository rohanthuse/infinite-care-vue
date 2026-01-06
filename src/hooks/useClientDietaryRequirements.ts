
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ClientDietaryRequirements {
  id: string;
  client_id: string;
  dietary_restrictions?: string[];
  food_allergies?: string[];
  food_preferences?: string[];
  meal_schedule?: any;
  nutritional_needs?: string;
  supplements?: string[];
  feeding_assistance_required?: boolean;
  special_equipment_needed?: string;
  texture_modifications?: string;
  fluid_restrictions?: string;
  weight_monitoring?: boolean;
  hydration_needs?: string;
  meal_preparation_needs?: string;
  eating_assistance?: string;
  created_at: string;
  updated_at: string;
}

const fetchClientDietaryRequirements = async (clientId: string): Promise<ClientDietaryRequirements | null> => {
  console.log('[fetchClientDietaryRequirements] Fetching for client:', clientId);
  
  const { data, error } = await supabase
    .from('client_dietary_requirements')
    .select('*')
    .eq('client_id', clientId)
    .maybeSingle();

  if (error) {
    console.error('[fetchClientDietaryRequirements] Error:', error);
    throw error;
  }

  return data;
};

const upsertClientDietaryRequirements = async (dietaryReqs: Partial<ClientDietaryRequirements> & { client_id: string }) => {
  console.log('[upsertClientDietaryRequirements] Upserting:', dietaryReqs);
  
  const { data, error } = await supabase
    .from('client_dietary_requirements')
    .upsert(dietaryReqs, { onConflict: 'client_id' })
    .select()
    .single();

  if (error) {
    console.error('[upsertClientDietaryRequirements] Error:', error);
    throw error;
  }

  return data;
};

export const useClientDietaryRequirements = (clientId: string) => {
  return useQuery({
    queryKey: ['client-dietary-requirements', clientId],
    queryFn: () => fetchClientDietaryRequirements(clientId),
    enabled: Boolean(clientId),
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdateClientDietaryRequirements = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: upsertClientDietaryRequirements,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['client-dietary-requirements', data.client_id] });
    },
  });
};

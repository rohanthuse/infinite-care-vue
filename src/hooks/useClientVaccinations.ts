import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ClientVaccination {
  id: string;
  client_id: string;
  vaccination_name: string;
  vaccination_date: string;
  next_due_date?: string;
  interval_months?: number;
  file_path?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

const fetchClientVaccinations = async (clientId: string): Promise<ClientVaccination[]> => {
  try {
    // For now, return empty array since the table doesn't exist
    // This would be replaced with actual database call once table is created
    console.log('[fetchClientVaccinations] Fetching for client:', clientId);
    return [];
  } catch (error) {
    console.error('[fetchClientVaccinations] Catch error:', error);
    return [];
  }
};

const createClientVaccination = async (vaccination: Omit<ClientVaccination, 'id' | 'created_at' | 'updated_at'>) => {
  // For now, return a mock response since the table doesn't exist
  console.log('[createClientVaccination] Would create:', vaccination);
  throw new Error('Vaccination table not yet created. Please contact your administrator.');
};

export const useClientVaccinations = (clientId: string) => {
  return useQuery({
    queryKey: ['client-vaccinations', clientId],
    queryFn: () => fetchClientVaccinations(clientId),
    enabled: Boolean(clientId),
    staleTime: 5 * 60 * 1000,
  });
};

export const useCreateClientVaccination = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: createClientVaccination,
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['client-vaccinations'] });
    },
  });
};
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ClientAuthorityAccounting {
  id: string;
  client_id: string;
  authority_id: string;
  reference_number?: string;
  travel_rate_id?: string;
  charge_based_on: 'planned_time' | 'actual_time';
  extra_time_calculation: boolean;
  client_contribution_required: boolean;
  branch_id?: string;
  organization_id?: string;
  created_at: string;
  updated_at: string;
}

export type ClientAuthorityAccountingInsert = Omit<ClientAuthorityAccounting, 'id' | 'created_at' | 'updated_at'>;
export type ClientAuthorityAccountingUpdate = Partial<ClientAuthorityAccountingInsert>;

// Fetch all authority accounting entries for a client
export const useClientAuthorityAccountingList = (clientId: string) => {
  return useQuery({
    queryKey: ['client-authority-accounting', clientId],
    queryFn: async (): Promise<ClientAuthorityAccounting[]> => {
      const { data, error } = await supabase
        .from('client_authority_accounting')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching client authority accounting:', error);
        throw error;
      }
      return (data || []) as ClientAuthorityAccounting[];
    },
    enabled: !!clientId,
  });
};

// Create a new authority accounting entry
export const useCreateClientAuthorityAccounting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ClientAuthorityAccountingInsert) => {
      const { data: result, error } = await supabase
        .from('client_authority_accounting')
        .insert(data as any)
        .select()
        .single();

      if (error) {
        console.error('Error creating client authority accounting:', error);
        throw error;
      }
      return result as ClientAuthorityAccounting;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client-authority-accounting', variables.client_id] });
      toast.success('Authority accounting entry created successfully');
    },
    onError: (error) => {
      console.error('Failed to create authority accounting entry:', error);
      toast.error('Failed to create authority accounting entry');
    },
  });
};

// Update an existing authority accounting entry
export const useUpdateClientAuthorityAccounting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, clientId, updates }: { id: string; clientId: string; updates: ClientAuthorityAccountingUpdate }) => {
      // Sanitize updates: convert empty strings to null for optional UUID and text fields
      const sanitizedUpdates: Record<string, any> = {};
      
      for (const [key, value] of Object.entries(updates)) {
        if (key === 'travel_rate_id' || key === 'reference_number') {
          // Convert empty strings to null for optional fields
          sanitizedUpdates[key] = value === '' || value === undefined ? null : value;
        } else if (value !== undefined) {
          sanitizedUpdates[key] = value;
        }
      }

      const { data: result, error } = await supabase
        .from('client_authority_accounting')
        .update(sanitizedUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating client authority accounting:', error);
        throw error;
      }
      return { result: result as ClientAuthorityAccounting, clientId };
    },
    onSuccess: ({ clientId }) => {
      queryClient.invalidateQueries({ queryKey: ['client-authority-accounting', clientId] });
      toast.success('Authority accounting entry updated successfully');
    },
    onError: (error) => {
      console.error('Failed to update authority accounting entry:', error);
      toast.error('Failed to update authority accounting entry');
    },
  });
};

// Delete an authority accounting entry
export const useDeleteClientAuthorityAccounting = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, clientId }: { id: string; clientId: string }) => {
      const { error } = await supabase
        .from('client_authority_accounting')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting client authority accounting:', error);
        throw error;
      }
      return { clientId };
    },
    onSuccess: ({ clientId }) => {
      queryClient.invalidateQueries({ queryKey: ['client-authority-accounting', clientId] });
      toast.success('Authority accounting entry deleted successfully');
    },
    onError: (error) => {
      console.error('Failed to delete authority accounting entry:', error);
      toast.error('Failed to delete authority accounting entry');
    },
  });
};

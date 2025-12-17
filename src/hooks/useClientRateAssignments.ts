import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ClientRateAssignment {
  id: string;
  client_id: string;
  service_rate_id: string;
  authority_id: string | null;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  // Joined data
  service_rate?: {
    id: string;
    service_name: string;
    service_code: string;
    rate_type: string;
    amount: number;
    currency: string;
    effective_from: string;
    effective_to: string | null;
    client_type: string;
    funding_source: string;
    applicable_days: string[];
    is_default: boolean;
    status: string;
    description: string | null;
    time_from: string | null;
    time_until: string | null;
    rate_category: string | null;
    pay_based_on: string | null;
    charge_type: string | null;
    rate_15_minutes: number | null;
    rate_30_minutes: number | null;
    rate_45_minutes: number | null;
    rate_60_minutes: number | null;
  };
  authority?: {
    id: string;
    organization_name: string;
  };
}

export interface CreateClientRateAssignmentInput {
  client_id: string;
  service_rate_id: string;
  authority_id: string | null;
  start_date: string;
  end_date?: string | null;
  notes?: string;
}

export interface UpdateClientRateAssignmentInput {
  id: string;
  start_date?: string;
  end_date?: string | null;
  is_active?: boolean;
  notes?: string;
}

// Fetch all rate assignments for a client
export function useClientRateAssignments(clientId: string) {
  return useQuery({
    queryKey: ['client-rate-assignments', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_rate_assignments')
        .select(`
          *,
          service_rate:service_rates(
            id,
            service_name,
            service_code,
            rate_type,
            amount,
            currency,
            effective_from,
            effective_to,
            client_type,
            funding_source,
            applicable_days,
            is_default,
            status,
            description,
            time_from,
            time_until,
            rate_category,
            pay_based_on,
            charge_type,
            rate_15_minutes,
            rate_30_minutes,
            rate_45_minutes,
            rate_60_minutes
          ),
          authority:authorities(
            id,
            organization_name
          )
        `)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as ClientRateAssignment[];
    },
    enabled: !!clientId,
  });
}

// Create a new rate assignment
export function useCreateClientRateAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateClientRateAssignmentInput) => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { data, error } = await supabase
        .from('client_rate_assignments')
        .insert({
          ...input,
          created_by: user?.id,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['client-rate-assignments', variables.client_id] });
      toast.success('Rate assigned successfully');
    },
    onError: (error: Error) => {
      console.error('[useCreateClientRateAssignment] Error:', error);
      toast.error(`Failed to assign rate: ${error.message}`);
    },
  });
}

// Update a rate assignment
export function useUpdateClientRateAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: UpdateClientRateAssignmentInput) => {
      const { id, ...updateData } = input;
      
      const { data, error } = await supabase
        .from('client_rate_assignments')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-rate-assignments'] });
      toast.success('Rate assignment updated');
    },
    onError: (error: Error) => {
      console.error('[useUpdateClientRateAssignment] Error:', error);
      toast.error(`Failed to update rate assignment: ${error.message}`);
    },
  });
}

// Delete a rate assignment
export function useDeleteClientRateAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('client_rate_assignments')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-rate-assignments'] });
      toast.success('Rate assignment removed');
    },
    onError: (error: Error) => {
      console.error('[useDeleteClientRateAssignment] Error:', error);
      toast.error(`Failed to remove rate assignment: ${error.message}`);
    },
  });
}

// Fetch service rates filtered by authority (funding_source)
export function useServiceRatesByAuthority(branchId: string, authorityId?: string) {
  return useQuery({
    queryKey: ['service-rates-by-authority', branchId, authorityId],
    queryFn: async () => {
      if (!branchId) return [];
      
      let query = supabase
        .from('service_rates')
        .select('*')
        .eq('branch_id', branchId)
        .eq('status', 'active')
        .order('service_name', { ascending: true });

      // Filter by funding_source if authorityId is provided
      if (authorityId) {
        query = query.eq('funding_source', authorityId);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!branchId,
  });
}

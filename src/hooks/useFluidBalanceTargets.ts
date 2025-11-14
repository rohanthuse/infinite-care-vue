import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface FluidBalanceTarget {
  id: string;
  client_id: string;
  daily_intake_target_ml?: number;
  daily_output_target_ml?: number;
  alert_threshold_percentage?: number;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export const useFluidBalanceTarget = (clientId: string) => {
  return useQuery({
    queryKey: ['fluid-balance-target', clientId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('fluid_balance_targets')
        .select('*')
        .eq('client_id', clientId)
        .maybeSingle();

      if (error) throw error;
      return data as FluidBalanceTarget | null;
    },
    enabled: !!clientId,
  });
};

export const useUpdateFluidBalanceTarget = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (target: Partial<FluidBalanceTarget> & { client_id: string }) => {
      // Try to update first
      const { data: existing } = await (supabase as any)
        .from('fluid_balance_targets')
        .select('id')
        .eq('client_id', target.client_id)
        .maybeSingle();

      if (existing) {
        // Update existing
        const { data, error } = await (supabase as any)
          .from('fluid_balance_targets')
          .update(target)
          .eq('client_id', target.client_id)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Insert new
        const { data, error } = await (supabase as any)
          .from('fluid_balance_targets')
          .insert(target)
          .select()
          .single();

        if (error) throw error;
        return data;
      }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['fluid-balance-target', data.client_id] });
      toast({
        title: 'Success',
        description: 'Fluid balance target updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update fluid balance target',
        variant: 'destructive',
      });
    },
  });
};

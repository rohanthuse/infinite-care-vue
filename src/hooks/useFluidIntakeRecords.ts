import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

interface FluidIntakeRecord {
  id: string;
  client_id: string;
  visit_record_id?: string;
  service_report_id?: string;
  record_date: string;
  recorded_by?: string;
  time: string;
  fluid_type: string;
  amount_ml: number;
  method: string;
  comments?: string;
  created_at: string;
  updated_at: string;
}

export const useFluidIntakeRecords = (clientId: string, date?: string) => {
  return useQuery({
    queryKey: ['fluid-intake-records', clientId, date],
    queryFn: async () => {
      let query = (supabase as any)
        .from('fluid_intake_records')
        .select('*')
        .eq('client_id', clientId)
        .order('time', { ascending: false });

      if (date) {
        query = query.eq('record_date', date);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as FluidIntakeRecord[];
    },
    enabled: !!clientId,
  });
};

export const useAddFluidIntakeRecord = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (record: Omit<FluidIntakeRecord, 'id' | 'created_at' | 'updated_at'>) => {
      const { data, error } = await (supabase as any)
        .from('fluid_intake_records')
        .insert(record)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['fluid-intake-records', variables.client_id] });
      queryClient.invalidateQueries({ queryKey: ['fluid-intake-summary', variables.client_id, variables.record_date] });
      toast({
        title: 'Success',
        description: 'Fluid intake record added successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add fluid intake record',
        variant: 'destructive',
      });
    },
  });
};

export const useUpdateFluidIntakeRecord = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FluidIntakeRecord> & { id: string }) => {
      const { data, error } = await (supabase as any)
        .from('fluid_intake_records')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['fluid-intake-records', data.client_id] });
      queryClient.invalidateQueries({ queryKey: ['fluid-intake-summary', data.client_id, data.record_date] });
      toast({
        title: 'Success',
        description: 'Fluid intake record updated successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update fluid intake record',
        variant: 'destructive',
      });
    },
  });
};

export const useDeleteFluidIntakeRecord = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, clientId, date }: { id: string; clientId: string; date: string }) => {
      const { error } = await (supabase as any)
        .from('fluid_intake_records')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { id, clientId, date };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['fluid-intake-records', data.clientId] });
      queryClient.invalidateQueries({ queryKey: ['fluid-intake-summary', data.clientId, data.date] });
      toast({
        title: 'Success',
        description: 'Fluid intake record deleted successfully',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to delete fluid intake record',
        variant: 'destructive',
      });
    },
  });
};

export const useFluidIntakeSummary = (clientId: string, date: string) => {
  return useQuery({
    queryKey: ['fluid-intake-summary', clientId, date],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('fluid_intake_records')
        .select('amount_ml')
        .eq('client_id', clientId)
        .eq('record_date', date);

      if (error) throw error;

      const total = data.reduce((sum: number, record: any) => sum + record.amount_ml, 0);
      return { total, count: data.length };
    },
    enabled: !!clientId && !!date,
  });
};

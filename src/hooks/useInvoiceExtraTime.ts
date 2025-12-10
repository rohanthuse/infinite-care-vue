import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Fetch approved extra time records that haven't been invoiced yet for a client
export function useApprovedExtraTimeForClient(clientId?: string) {
  return useQuery({
    queryKey: ['approved-extra-time', clientId],
    queryFn: async () => {
      if (!clientId) return [];

      const { data, error } = await supabase
        .from('extra_time_records')
        .select(`
          id,
          staff_id,
          work_date,
          extra_time_minutes,
          total_cost,
          reason,
          notes,
          status,
          invoiced,
          staff:staff_id (first_name, last_name)
        `)
        .eq('client_id', clientId)
        .eq('status', 'approved')
        .eq('invoiced', false)
        .order('work_date', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!clientId,
  });
}

// Fetch approved extra time for a date range (for bulk invoicing)
export function useApprovedExtraTimeForPeriod(
  branchId?: string,
  startDate?: string,
  endDate?: string
) {
  return useQuery({
    queryKey: ['approved-extra-time-period', branchId, startDate, endDate],
    queryFn: async () => {
      if (!branchId || !startDate || !endDate) return [];

      const { data, error } = await supabase
        .from('extra_time_records')
        .select(`
          id,
          client_id,
          staff_id,
          work_date,
          extra_time_minutes,
          total_cost,
          reason,
          notes,
          status,
          invoiced,
          staff:staff_id (first_name, last_name),
          clients:client_id (first_name, last_name)
        `)
        .eq('branch_id', branchId)
        .eq('status', 'approved')
        .eq('invoiced', false)
        .gte('work_date', startDate)
        .lte('work_date', endDate)
        .order('client_id')
        .order('work_date', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!(branchId && startDate && endDate),
  });
}

// Mark extra time records as invoiced
export function useMarkExtraTimeAsInvoiced() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      recordIds, 
      invoiceId 
    }: { 
      recordIds: string[]; 
      invoiceId: string;
    }) => {
      const { error } = await supabase
        .from('extra_time_records')
        .update({ 
          invoiced: true, 
          invoice_id: invoiceId 
        })
        .in('id', recordIds);

      if (error) throw error;
      return { recordIds, invoiceId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approved-extra-time'] });
      queryClient.invalidateQueries({ queryKey: ['approved-extra-time-period'] });
      queryClient.invalidateQueries({ queryKey: ['extra-time-records'] });
    },
    onError: (error) => {
      console.error('Error marking extra time as invoiced:', error);
      toast.error('Failed to link extra time to invoice');
    },
  });
}

// Calculate extra time totals for invoice
export function calculateExtraTimeTotals(extraTimeRecords: any[]) {
  const totalMinutes = extraTimeRecords.reduce(
    (sum, record) => sum + (record.extra_time_minutes || 0),
    0
  );
  
  const totalCost = extraTimeRecords.reduce(
    (sum, record) => sum + (record.total_cost || 0),
    0
  );

  return {
    totalMinutes,
    totalCost,
    count: extraTimeRecords.length,
    formattedTime: `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`,
  };
}

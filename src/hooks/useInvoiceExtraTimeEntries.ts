import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface InvoiceExtraTimeEntry {
  id: string;
  work_date: string;
  extra_time_minutes: number;
  total_cost: number;
  reason: string | null;
  notes: string | null;
  booking_id: string | null;
  staff_id: string | null;
  staff_name?: string;
}

// Fetch extra time records linked to a specific invoice
export function useInvoiceExtraTimeEntries(invoiceId?: string) {
  return useQuery({
    queryKey: ['invoice-extra-time-entries', invoiceId],
    queryFn: async (): Promise<InvoiceExtraTimeEntry[]> => {
      if (!invoiceId) return [];

      const { data, error } = await supabase
        .from('extra_time_records')
        .select(`
          id,
          work_date,
          extra_time_minutes,
          total_cost,
          reason,
          notes,
          booking_id,
          staff_id,
          staff:staff_id (
            first_name,
            last_name
          )
        `)
        .eq('invoice_id', invoiceId)
        .eq('invoiced', true)
        .order('work_date', { ascending: true });

      if (error) throw error;

      return (data || []).map((record: any) => ({
        id: record.id,
        work_date: record.work_date,
        extra_time_minutes: record.extra_time_minutes,
        total_cost: record.total_cost || 0,
        reason: record.reason,
        notes: record.notes,
        booking_id: record.booking_id,
        staff_id: record.staff_id,
        staff_name: record.staff ? `${record.staff.first_name || ''} ${record.staff.last_name || ''}`.trim() : undefined,
      }));
    },
    enabled: !!invoiceId,
  });
}

// Mark extra time records as invoiced and update invoice total
export function useMarkExtraTimeAsInvoiced() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      extraTimeIds, 
      invoiceId 
    }: { 
      extraTimeIds: string[]; 
      invoiceId: string;
    }) => {
      if (extraTimeIds.length === 0) return { count: 0 };

      // First, get the total cost of selected extra time records
      const { data: extraTimeRecords, error: fetchError } = await supabase
        .from('extra_time_records')
        .select('total_cost')
        .in('id', extraTimeIds);

      if (fetchError) {
        console.error('Error fetching extra time records:', fetchError);
        throw fetchError;
      }

      const extraTimeTotalCost = (extraTimeRecords || []).reduce(
        (sum, record) => sum + (record.total_cost || 0), 
        0
      );

      // Mark extra time records as invoiced
      const { error: updateError } = await supabase
        .from('extra_time_records')
        .update({ 
          invoiced: true, 
          invoice_id: invoiceId 
        })
        .in('id', extraTimeIds);

      if (updateError) {
        console.error('Error marking extra time as invoiced:', updateError);
        throw updateError;
      }

      // Update invoice total if there's extra time cost to add
      if (extraTimeTotalCost > 0) {
        // Get current invoice total
        const { data: invoice, error: invoiceError } = await supabase
          .from('client_billing')
          .select('total_amount, amount')
          .eq('id', invoiceId)
          .maybeSingle();

        if (invoiceError) {
          console.error('Error fetching invoice:', invoiceError);
          throw invoiceError;
        }

        const currentTotal = invoice?.total_amount || invoice?.amount || 0;
        const newTotal = currentTotal + extraTimeTotalCost;

        const { error: updateTotalError } = await supabase
          .from('client_billing')
          .update({ total_amount: newTotal })
          .eq('id', invoiceId);

        if (updateTotalError) {
          console.error('Error updating invoice total:', updateTotalError);
          throw updateTotalError;
        }
      }

      return { count: extraTimeIds.length };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice-extra-time-entries'] });
      queryClient.invalidateQueries({ queryKey: ['eligible-extra-time-for-invoice'] });
      queryClient.invalidateQueries({ queryKey: ['extra-time-records'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['client-billing'] });
      queryClient.invalidateQueries({ queryKey: ['branch-invoices'] });
    },
    onError: (error) => {
      console.error('Error marking extra time as invoiced:', error);
      toast.error('Failed to add extra time to invoice');
    },
  });
}

// Remove extra time from invoice
export function useRemoveExtraTimeFromInvoice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      extraTimeId, 
      invoiceId 
    }: { 
      extraTimeId: string; 
      invoiceId: string;
    }) => {
      // Get the extra time record first
      const { data: record, error: fetchError } = await supabase
        .from('extra_time_records')
        .select('total_cost')
        .eq('id', extraTimeId)
        .single();

      if (fetchError) throw fetchError;

      // Remove invoice link
      const { error: updateError } = await supabase
        .from('extra_time_records')
        .update({ 
          invoiced: false, 
          invoice_id: null 
        })
        .eq('id', extraTimeId);

      if (updateError) throw updateError;

      // Update invoice total
      if (record?.total_cost) {
        const { data: invoiceData } = await supabase
          .from('client_billing')
          .select('total_amount')
          .eq('id', invoiceId)
          .single();

        if (invoiceData) {
          const newTotal = Math.max(0, (invoiceData.total_amount || 0) - record.total_cost);
          await supabase
            .from('client_billing')
            .update({ total_amount: newTotal })
            .eq('id', invoiceId);
        }
      }

      return { extraTimeId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoice-extra-time-entries'] });
      queryClient.invalidateQueries({ queryKey: ['eligible-extra-time-for-invoice'] });
      queryClient.invalidateQueries({ queryKey: ['extra-time-records'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['client-billing'] });
      queryClient.invalidateQueries({ queryKey: ['branch-invoices'] });
      toast.success('Extra time removed from invoice');
    },
    onError: (error) => {
      console.error('Error removing extra time from invoice:', error);
      toast.error('Failed to remove extra time from invoice');
    },
  });
}

// Calculate extra time totals
export function calculateExtraTimeTotals(extraTimeRecords: InvoiceExtraTimeEntry[]) {
  const totalMinutes = extraTimeRecords.reduce((sum, r) => sum + r.extra_time_minutes, 0);
  const totalCost = extraTimeRecords.reduce((sum, r) => sum + r.total_cost, 0);
  
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const formattedTime = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  return {
    totalMinutes,
    totalCost,
    count: extraTimeRecords.length,
    formattedTime,
  };
}

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface EligibleExtraTime {
  id: string;
  work_date: string;
  extra_time_minutes: number;
  total_cost: number;
  reason: string | null;
  notes: string | null;
  booking_id: string | null;
  staff_id: string | null;
  staff_name?: string;
  client_id: string | null;
  invoiced: boolean;
  invoice_id: string | null;
  status: string;
}

export interface EligibleExtraTimeResult {
  extraTimeRecords: EligibleExtraTime[];
  availableCount: number;
  totalAmount: number;
}

export function useEligibleExtraTimeForInvoice(
  clientId?: string,
  startDate?: string,
  endDate?: string
) {
  return useQuery({
    queryKey: ['eligible-extra-time-for-invoice', clientId, startDate, endDate],
    queryFn: async (): Promise<EligibleExtraTimeResult> => {
      if (!clientId) {
        return { extraTimeRecords: [], availableCount: 0, totalAmount: 0 };
      }

      let query = supabase
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
          client_id,
          invoiced,
          invoice_id,
          status,
          staff:staff_id (
            first_name,
            last_name
          )
        `)
        .eq('client_id', clientId)
        .eq('status', 'approved')
        .gt('extra_time_minutes', 0)
        .eq('invoiced', false);

      // Filter by date range if provided
      if (startDate) {
        query = query.gte('work_date', startDate);
      }
      if (endDate) {
        query = query.lte('work_date', endDate);
      }

      query = query.order('work_date', { ascending: false });

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching eligible extra time:', error);
        throw error;
      }

      // Transform extra time records
      const extraTimeRecords: EligibleExtraTime[] = (data || []).map((record: any) => ({
        id: record.id,
        work_date: record.work_date,
        extra_time_minutes: record.extra_time_minutes,
        total_cost: record.total_cost || 0,
        reason: record.reason,
        notes: record.notes,
        booking_id: record.booking_id,
        staff_id: record.staff_id,
        staff_name: record.staff ? `${record.staff.first_name || ''} ${record.staff.last_name || ''}`.trim() : undefined,
        client_id: record.client_id,
        invoiced: record.invoiced || false,
        invoice_id: record.invoice_id,
        status: record.status,
      }));

      const availableRecords = extraTimeRecords.filter(r => !r.invoiced);
      
      return {
        extraTimeRecords,
        availableCount: availableRecords.length,
        totalAmount: availableRecords.reduce((sum, r) => sum + r.total_cost, 0),
      };
    },
    enabled: !!clientId,
  });
}

// Format extra time minutes to readable string
export function formatExtraTimeMinutes(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

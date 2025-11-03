import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BatchHistory {
  id: string;
  organization_id: string;
  branch_id: string;
  period_type: 'weekly' | 'fortnightly' | 'monthly';
  period_start_date: string;
  period_end_date: string;
  generated_at: string;
  generated_by: string | null;
  clients_processed: number;
  invoices_created: number;
  invoices_failed: number;
  total_net_amount: number;
  total_vat_amount: number;
  total_amount: number;
  execution_time_ms: number | null;
  error_details: any;
  invoice_ids: string[] | null;
  status: 'completed' | 'partial' | 'failed';
}

export interface BatchHistoryFilters {
  startDate?: string;
  endDate?: string;
  periodType?: 'weekly' | 'fortnightly' | 'monthly';
  status?: 'completed' | 'partial' | 'failed';
}

const fetchBatchHistory = async (
  branchId: string,
  filters?: BatchHistoryFilters
): Promise<BatchHistory[]> => {
  let query = supabase
    .from('invoice_generation_batches')
    .select('*')
    .eq('branch_id', branchId)
    .order('generated_at', { ascending: false });

  if (filters?.startDate) {
    query = query.gte('generated_at', filters.startDate);
  }
  if (filters?.endDate) {
    query = query.lte('generated_at', filters.endDate);
  }
  if (filters?.periodType) {
    query = query.eq('period_type', filters.periodType);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[fetchBatchHistory] Error:', error);
    throw error;
  }

  return (data || []) as BatchHistory[];
};

export const useBulkInvoiceHistory = (
  branchId: string,
  filters?: BatchHistoryFilters
) => {
  return useQuery({
    queryKey: ['bulk-invoice-history', branchId, filters],
    queryFn: () => fetchBatchHistory(branchId, filters),
    enabled: Boolean(branchId),
  });
};

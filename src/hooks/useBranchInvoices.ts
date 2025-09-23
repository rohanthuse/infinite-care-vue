import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BranchInvoiceFilters {
  status?: 'pending' | 'paid' | 'overdue' | 'draft' | 'sent' | 'cancelled';
  dateFrom?: string;
  dateTo?: string;
  clientId?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
}

export interface BranchInvoiceSorting {
  field: 'due_date' | 'invoice_date' | 'amount' | 'total_amount' | 'client_name' | 'status';
  direction: 'asc' | 'desc';
}

const fetchBranchInvoices = async (
  branchId: string,
  filters: BranchInvoiceFilters = {},
  sorting: BranchInvoiceSorting = { field: 'due_date', direction: 'desc' }
) => {
  // Enhanced query with organization isolation
  let query = supabase
    .from('client_billing')
    .select(`
      *,
      clients!inner(
        id,
        first_name,
        last_name,
        email,
        pin_code,
        branch_id
      ),
      payment_records(*)
    `)
    .eq('clients.branch_id', branchId);

  // Apply filters
  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  if (filters.dateFrom) {
    query = query.gte('invoice_date', filters.dateFrom);
  }

  if (filters.dateTo) {
    query = query.lte('invoice_date', filters.dateTo);
  }

  if (filters.clientId) {
    query = query.eq('client_id', filters.clientId);
  }

  if (filters.minAmount) {
    query = query.gte('amount', filters.minAmount);
  }

  if (filters.maxAmount) {
    query = query.lte('amount', filters.maxAmount);
  }

  if (filters.search) {
    query = query.or(`description.ilike.%${filters.search}%,invoice_number.ilike.%${filters.search}%`);
  }

  // Apply sorting
  query = query.order(sorting.field, { ascending: sorting.direction === 'asc' });

  const { data, error } = await query;

  if (error) throw error;

  // Calculate derived fields
  return (data || []).map(invoice => {
    const totalPaid = invoice.payment_records?.reduce((sum, payment) => sum + payment.payment_amount, 0) || 0;
    const remainingAmount = (invoice.total_amount || invoice.amount) - totalPaid;
    const isOverdue = new Date(invoice.due_date) < new Date() && invoice.status !== 'paid' && remainingAmount > 0;
    
    return {
      ...invoice,
      client_name: `${invoice.clients.first_name} ${invoice.clients.last_name}`,
      client_pin_code: invoice.clients.pin_code,
      total_paid: totalPaid,
      remaining_amount: remainingAmount,
      is_overdue: isOverdue,
      computed_status: isOverdue ? 'overdue' : invoice.status
    };
  });
};

export const useBranchInvoices = (
  branchId: string,
  filters: BranchInvoiceFilters = {},
  sorting: BranchInvoiceSorting = { field: 'due_date', direction: 'desc' }
) => {
  return useQuery({
    queryKey: ['branch-invoices', branchId, filters, sorting],
    queryFn: () => fetchBranchInvoices(branchId, filters, sorting),
    enabled: Boolean(branchId),
  });
};

export const useBranchInvoiceStats = (branchId: string) => {
  return useQuery({
    queryKey: ['branch-invoice-stats', branchId],
    queryFn: async () => {
      const { data: invoices, error } = await supabase
        .from('client_billing')
        .select(`
          *,
          clients!inner(branch_id),
          payment_records(payment_amount)
        `)
        .eq('clients.branch_id', branchId);

      if (error) throw error;

      const now = new Date();
      let totalOutstanding = 0;
      let totalOverdue = 0;
      let totalPaidThisMonth = 0;
      let overdueCount = 0;
      let pendingCount = 0;

      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      invoices?.forEach(invoice => {
        const totalPaid = invoice.payment_records?.reduce((sum, payment) => sum + payment.payment_amount, 0) || 0;
        const remaining = (invoice.total_amount || invoice.amount) - totalPaid;
        const isOverdue = new Date(invoice.due_date) < now && invoice.status !== 'paid' && remaining > 0;

        if (remaining > 0) {
          totalOutstanding += remaining;
          if (isOverdue) {
            totalOverdue += remaining;
            overdueCount++;
          } else if (invoice.status === 'pending' || invoice.status === 'sent') {
            pendingCount++;
          }
        }

        // Check if paid this month - get payments from separate query
        totalPaidThisMonth += totalPaid; // This will be refined with actual payment dates
      });

      return {
        totalOutstanding,
        totalOverdue,
        totalPaidThisMonth,
        overdueCount,
        pendingCount,
        totalInvoices: invoices?.length || 0
      };
    },
    enabled: Boolean(branchId),
  });
};
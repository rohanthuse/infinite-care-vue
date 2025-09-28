import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BranchInvoiceFilters {
  status?: ('draft' | 'ready_to_charge' | 'confirmed' | 'future_invoice' | 'deleted' | 'pending' | 'paid' | 'overdue' | 'cancelled')[];
  startDate?: string;
  endDate?: string;
  clientIds?: string[];
  authorityType?: 'private' | 'local_authority' | 'nhs' | 'ccg' | 'continuing_care' | 'other';
  invoiceMethod?: 'per_visit' | 'weekly' | 'monthly' | 'quarterly' | 'annual' | 'adhoc';
  payMethod?: 'bank_transfer' | 'direct_debit' | 'cash' | 'card' | 'cheque' | 'bacs' | 'faster_payment';
  paidStatus?: ('unpaid' | 'partially_paid' | 'paid' | 'refunded' | 'written_off')[];
  invoiceNumber?: string;
  clientGroupId?: string;
  isReadyToSend?: boolean;
  isFormerClient?: boolean;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
}

export interface BranchInvoiceSorting {
  field: 'due_date' | 'invoice_date' | 'amount' | 'total_amount' | 'client_name' | 'status' | 'start_date' | 'end_date' | 'invoice_number';
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

  // Apply enhanced filters
  if (filters.status && filters.status.length > 0) {
    query = query.in('status', filters.status);
  }

  if (filters.startDate) {
    query = query.gte('start_date', filters.startDate);
  }

  if (filters.endDate) {
    query = query.lte('end_date', filters.endDate);
  }

  if (filters.clientIds && filters.clientIds.length > 0) {
    query = query.in('client_id', filters.clientIds);
  }

  if (filters.authorityType) {
    query = query.eq('authority_type', filters.authorityType);
  }

  if (filters.invoiceMethod) {
    query = query.eq('invoice_method', filters.invoiceMethod);
  }

  if (filters.payMethod) {
    query = query.eq('pay_method', filters.payMethod);
  }

  if (filters.clientGroupId) {
    query = query.eq('client_group_id', filters.clientGroupId);
  }

  if (filters.isReadyToSend !== undefined) {
    query = query.eq('is_ready_to_send', filters.isReadyToSend);
  }

  if (filters.isFormerClient !== undefined) {
    query = query.eq('is_former_client', filters.isFormerClient);
  }

  if (filters.invoiceNumber) {
    query = query.ilike('invoice_number', `%${filters.invoiceNumber}%`);
  }

  if (filters.minAmount) {
    query = query.gte('total_amount', filters.minAmount);
  }

  if (filters.maxAmount) {
    query = query.lte('total_amount', filters.maxAmount);
  }

  if (filters.search) {
    query = query.or(`description.ilike.%${filters.search}%,invoice_number.ilike.%${filters.search}%`);
  }

  // Apply sorting
  query = query.order(sorting.field, { ascending: sorting.direction === 'asc' });

  const { data, error } = await query;

  if (error) throw error;

  // Calculate derived fields with enhanced data
  return (data || []).map(invoice => {
    const totalPaid = invoice.payment_records?.reduce((sum, payment) => sum + payment.payment_amount, 0) || 0;
    const remainingAmount = (invoice.total_amount || invoice.amount) - totalPaid;
    const isOverdue = new Date(invoice.due_date) < new Date() && invoice.status !== 'paid' && remainingAmount > 0;
    
    // Determine paid status for filtering
    let paidStatus: string;
    if (remainingAmount <= 0) {
      paidStatus = 'paid';
    } else if (totalPaid > 0) {
      paidStatus = 'partially_paid';
    } else {
      paidStatus = 'unpaid';
    }

    return {
      ...invoice,
      client_name: `${invoice.clients.first_name} ${invoice.clients.last_name}`,
      client_pin_code: invoice.clients.pin_code,
      total_paid: totalPaid,
      remaining_amount: remainingAmount,
      is_overdue: isOverdue,
      computed_status: isOverdue ? 'overdue' : invoice.status,
      paid_status: paidStatus,
      booked_time_display: `${Math.floor((invoice.booked_time_minutes || 0) / 60)}h ${(invoice.booked_time_minutes || 0) % 60}m`,
      actual_time_display: `${Math.floor((invoice.actual_time_minutes || 0) / 60)}h ${(invoice.actual_time_minutes || 0) % 60}m`
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
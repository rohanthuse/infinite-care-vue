import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BranchPaymentFilters {
  dateFrom?: string;
  dateTo?: string;
  clientId?: string;
  paymentMethod?: string;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
}

export interface BranchPaymentSorting {
  field: 'payment_date' | 'payment_amount' | 'client_name' | 'payment_method';
  direction: 'asc' | 'desc';
}

const fetchBranchPayments = async (
  branchId: string,
  filters: BranchPaymentFilters = {},
  sorting: BranchPaymentSorting = { field: 'payment_date', direction: 'desc' }
) => {
  let query = supabase
    .from('payment_records')
    .select(`
      *,
      client_billing!inner(
        id,
        invoice_number,
        description,
        client_id,
        clients!inner(
          id,
          first_name,
          last_name,
          email,
          pin_code,
          branch_id
        )
      )
    `)
    .eq('client_billing.clients.branch_id', branchId);

  // Apply filters
  if (filters.dateFrom) {
    query = query.gte('payment_date', filters.dateFrom);
  }

  if (filters.dateTo) {
    query = query.lte('payment_date', filters.dateTo);
  }

  if (filters.clientId) {
    query = query.eq('client_billing.client_id', filters.clientId);
  }

  if (filters.paymentMethod) {
    query = query.eq('payment_method', filters.paymentMethod);
  }

  if (filters.minAmount) {
    query = query.gte('payment_amount', filters.minAmount);
  }

  if (filters.maxAmount) {
    query = query.lte('payment_amount', filters.maxAmount);
  }

  if (filters.search) {
    query = query.or(
      `payment_reference.ilike.%${filters.search}%,transaction_id.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`
    );
  }

  // Apply sorting
  query = query.order(sorting.field, { ascending: sorting.direction === 'asc' });

  const { data, error } = await query;

  if (error) throw error;

  return (data || []).map(payment => ({
    ...payment,
    client_name: `${payment.client_billing.clients.first_name} ${payment.client_billing.clients.last_name}`,
    client_pin_code: payment.client_billing.clients.pin_code,
    invoice_number: payment.client_billing.invoice_number,
    invoice_description: payment.client_billing.description
  }));
};

export const useBranchPayments = (
  branchId: string,
  filters: BranchPaymentFilters = {},
  sorting: BranchPaymentSorting = { field: 'payment_date', direction: 'desc' }
) => {
  return useQuery({
    queryKey: ['branch-payments', branchId, filters, sorting],
    queryFn: () => fetchBranchPayments(branchId, filters, sorting),
    enabled: Boolean(branchId),
  });
};

export const usePaymentRecord = (paymentId: string) => {
  return useQuery({
    queryKey: ['payment-record', paymentId],
    queryFn: async () => {
      if (!paymentId) return null;
      
      const { data, error } = await supabase
        .from('payment_records')
        .select(`
          *,
          client_billing!inner(
            id,
            invoice_number,
            description,
            client_id,
            clients!inner(
              id,
              first_name,
              last_name,
              email,
              pin_code,
              branch_id
            )
          )
        `)
        .eq('id', paymentId)
        .single();

      if (error) throw error;
      if (!data) return null;

      return {
        ...data,
        client_name: `${data.client_billing.clients.first_name} ${data.client_billing.clients.last_name}`,
        client_pin_code: data.client_billing.clients.pin_code,
        invoice_number: data.client_billing.invoice_number,
        invoice_description: data.client_billing.description
      };
    },
    enabled: Boolean(paymentId),
  });
};

export const useBranchPaymentStats = (branchId: string) => {
  return useQuery({
    queryKey: ['branch-payment-stats', branchId],
    queryFn: async () => {
      const { data: payments, error } = await supabase
        .from('payment_records')
        .select(`
          *,
          client_billing!inner(
            clients!inner(branch_id)
          )
        `)
        .eq('client_billing.clients.branch_id', branchId);

      if (error) throw error;

      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
      const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;

      let totalThisMonth = 0;
      let totalLastMonth = 0;
      let todayTotal = 0;
      const paymentMethods: Record<string, number> = {};

      payments?.forEach(payment => {
        const paymentDate = new Date(payment.payment_date);
        const isThisMonth = paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear;
        const isLastMonth = paymentDate.getMonth() === lastMonth && paymentDate.getFullYear() === lastMonthYear;
        const isToday = paymentDate.toDateString() === now.toDateString();

        if (isThisMonth) {
          totalThisMonth += payment.payment_amount;
        }

        if (isLastMonth) {
          totalLastMonth += payment.payment_amount;
        }

        if (isToday) {
          todayTotal += payment.payment_amount;
        }

        // Count payment methods
        paymentMethods[payment.payment_method] = (paymentMethods[payment.payment_method] || 0) + payment.payment_amount;
      });

      return {
        totalThisMonth,
        totalLastMonth,
        todayTotal,
        totalPayments: payments?.length || 0,
        paymentMethods
      };
    },
    enabled: Boolean(branchId),
  });
};
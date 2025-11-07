import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { BranchInvoiceFilters, BranchInvoiceSorting } from './useBranchInvoices';

export interface BookingInvoiceData {
  // Invoice fields
  id: string;
  invoice_number: string;
  invoice_date: string;
  due_date: string;
  status: string;
  total_amount: number;
  amount: number;
  client_id: string;
  booking_id: string;
  generated_from_booking: boolean;
  description: string;
  
  // Client fields
  client_name: string;
  client_pin_code?: string;
  
  // Booking fields
  booking: {
    id: string;
    start_time: string;
    end_time: string;
    status: string;
    service_id?: string;
    services?: {
      title: string;
    };
  };
  
  // Computed fields
  total_paid: number;
  remaining_amount: number;
  is_overdue: boolean;
  payment_records?: Array<{ payment_amount: number }>;
}

const fetchBookingInvoices = async (
  branchId: string,
  filters: BranchInvoiceFilters = {},
  sorting: BranchInvoiceSorting = { field: 'invoice_date', direction: 'desc' }
) => {
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
      booking:bookings!inner(
        id,
        start_time,
        end_time,
        status,
        service_id,
        services(title)
      ),
      payment_records(*)
    `)
    .eq('clients.branch_id', branchId)
    .not('booking_id', 'is', null); // Only fetch invoices with bookings

  // Apply filters
  if (filters.status && filters.status.length > 0) {
    query = query.in('status', filters.status);
  }

  if (filters.startDate) {
    query = query.gte('invoice_date', filters.startDate);
  }

  if (filters.endDate) {
    query = query.lte('invoice_date', filters.endDate);
  }

  if (filters.clientIds && filters.clientIds.length > 0) {
    query = query.in('client_id', filters.clientIds);
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
      booking: invoice.booking,
      total_paid: totalPaid,
      remaining_amount: remainingAmount,
      is_overdue: isOverdue,
    };
  });
};

export const useBranchBookingInvoices = (
  branchId: string,
  filters: BranchInvoiceFilters = {},
  sorting: BranchInvoiceSorting = { field: 'invoice_date', direction: 'desc' }
) => {
  return useQuery({
    queryKey: ['branch-booking-invoices', branchId, filters, sorting],
    queryFn: () => fetchBookingInvoices(branchId, filters, sorting),
    enabled: Boolean(branchId),
  });
};

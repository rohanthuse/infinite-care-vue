import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CancelledBookingData {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  cancellation_reason: string | null;
  cancelled_at: string | null;
  cancelled_by: string | null;
  suspension_honor_staff_payment: boolean | null;
  staff_payment_type: string | null;
  staff_payment_amount: number | null;
  is_invoiced: boolean | null;
  included_in_invoice_id: string | null;
  staff_first_name: string | null;
  staff_last_name: string | null;
}

export const useInvoiceCancelledBookings = (invoiceId: string | undefined) => {
  return useQuery({
    queryKey: ['invoice-cancelled-bookings', invoiceId],
    queryFn: async (): Promise<CancelledBookingData[]> => {
      if (!invoiceId) return [];

      // Step 1: Get invoice details (client_id, start_date, end_date)
      const { data: invoice, error: invoiceError } = await supabase
        .from('client_billing')
        .select('client_id, start_date, end_date')
        .eq('id', invoiceId)
        .single();

      if (invoiceError || !invoice) {
        console.error('Failed to fetch invoice:', invoiceError);
        return [];
      }

      // Step 2: Query cancelled bookings - directly linked OR within invoice date range
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          start_time,
          end_time,
          status,
          cancellation_reason,
          cancelled_at,
          cancelled_by,
          suspension_honor_staff_payment,
          staff_payment_type,
          staff_payment_amount,
          is_invoiced,
          included_in_invoice_id,
          staff:staff_id (
            first_name,
            last_name
          )
        `)
        .eq('client_id', invoice.client_id)
        .eq('status', 'cancelled')
        .gte('start_time', invoice.start_date)
        .lte('start_time', `${invoice.end_date}T23:59:59`)
        .order('cancelled_at', { ascending: false });

      if (error) throw error;

      // Transform the data to flatten staff info
      return (data || []).map((booking: any) => ({
        id: booking.id,
        start_time: booking.start_time,
        end_time: booking.end_time,
        status: booking.status,
        cancellation_reason: booking.cancellation_reason,
        cancelled_at: booking.cancelled_at,
        cancelled_by: booking.cancelled_by,
        suspension_honor_staff_payment: booking.suspension_honor_staff_payment,
        staff_payment_type: booking.staff_payment_type,
        staff_payment_amount: booking.staff_payment_amount,
        is_invoiced: booking.is_invoiced,
        included_in_invoice_id: booking.included_in_invoice_id,
        staff_first_name: booking.staff?.first_name || null,
        staff_last_name: booking.staff?.last_name || null,
      }));
    },
    enabled: Boolean(invoiceId),
  });
};

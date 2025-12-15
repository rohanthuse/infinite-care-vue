import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ClientCancelledBookingData {
  id: string;
  start_time: string;
  end_time: string;
  status: string;
  cancellation_reason: string | null;
  cancelled_at: string | null;
  staff_payment_type: string | null;
  staff_payment_amount: number | null;
  service_title: string | null;
}

/**
 * Hook to fetch cancelled bookings with charges for client portal invoice view.
 * This shows cancelled bookings where charges still apply (suspension_honor_staff_payment = true).
 */
export const useClientInvoiceCancelledBookings = (invoiceId: string | undefined) => {
  return useQuery({
    queryKey: ['client-invoice-cancelled-bookings', invoiceId],
    queryFn: async (): Promise<ClientCancelledBookingData[]> => {
      if (!invoiceId) return [];

      // Step 1: Get invoice details (client_id, start_date, end_date)
      const { data: invoice, error: invoiceError } = await supabase
        .from('client_billing')
        .select('client_id, start_date, end_date')
        .eq('id', invoiceId)
        .single();

      if (invoiceError || !invoice) {
        console.error('Failed to fetch invoice for cancelled bookings:', invoiceError);
        return [];
      }

      // Step 2: Query cancelled bookings with charges within invoice date range
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          id,
          start_time,
          end_time,
          status,
          cancellation_reason,
          cancelled_at,
          staff_payment_type,
          staff_payment_amount,
          services:service_id (
            title
          )
        `)
        .eq('client_id', invoice.client_id)
        .eq('status', 'cancelled')
        .eq('suspension_honor_staff_payment', true) // Only bookings with charges
        .gte('start_time', invoice.start_date)
        .lte('start_time', `${invoice.end_date}T23:59:59`)
        .order('cancelled_at', { ascending: false });

      if (error) {
        console.error('Failed to fetch cancelled bookings:', error);
        return [];
      }

      // Transform the data
      return (data || []).map((booking: any) => ({
        id: booking.id,
        start_time: booking.start_time,
        end_time: booking.end_time,
        status: booking.status,
        cancellation_reason: booking.cancellation_reason,
        cancelled_at: booking.cancelled_at,
        staff_payment_type: booking.staff_payment_type,
        staff_payment_amount: booking.staff_payment_amount,
        service_title: booking.services?.title || null,
      }));
    },
    enabled: Boolean(invoiceId),
  });
};

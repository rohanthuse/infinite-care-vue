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
  staff_first_name: string | null;
  staff_last_name: string | null;
}

export const useInvoiceCancelledBookings = (invoiceId: string | undefined) => {
  return useQuery({
    queryKey: ['invoice-cancelled-bookings', invoiceId],
    queryFn: async (): Promise<CancelledBookingData[]> => {
      if (!invoiceId) return [];

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
          staff:staff_id (
            first_name,
            last_name
          )
        `)
        .eq('included_in_invoice_id', invoiceId)
        .eq('status', 'cancelled')
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
        staff_first_name: booking.staff?.first_name || null,
        staff_last_name: booking.staff?.last_name || null,
      }));
    },
    enabled: Boolean(invoiceId),
  });
};

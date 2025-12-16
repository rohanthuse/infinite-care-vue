import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Hook to toggle whether a cancelled booking is included in an invoice
 */
export function useUpdateCancelledBookingInvoiceStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookingId,
      invoiceId,
      isInvoiced,
    }: {
      bookingId: string;
      invoiceId: string;
      isInvoiced: boolean;
    }) => {
      // Get the booking to find staff payment amount
      const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select('staff_payment_amount, suspension_honor_staff_payment')
        .eq('id', bookingId)
        .single();

      if (fetchError) throw fetchError;

      // Update the booking's is_invoiced status
      const { error: updateBookingError } = await supabase
        .from('bookings')
        .update({
          is_invoiced: isInvoiced,
          included_in_invoice_id: isInvoiced ? invoiceId : null,
        })
        .eq('id', bookingId);

      if (updateBookingError) throw updateBookingError;

      // Update invoice total if there's a staff payment amount
      const paymentAmount = booking?.suspension_honor_staff_payment ? (booking?.staff_payment_amount || 0) : 0;
      
      if (paymentAmount > 0) {
        const { data: invoiceData, error: invoiceFetchError } = await supabase
          .from('client_billing')
          .select('total_amount')
          .eq('id', invoiceId)
          .single();

        if (invoiceFetchError) throw invoiceFetchError;

        const currentTotal = invoiceData?.total_amount || 0;
        const newTotal = isInvoiced 
          ? currentTotal + paymentAmount 
          : Math.max(0, currentTotal - paymentAmount);

        const { error: updateInvoiceError } = await supabase
          .from('client_billing')
          .update({ total_amount: newTotal })
          .eq('id', invoiceId);

        if (updateInvoiceError) throw updateInvoiceError;
      }

      return { bookingId, isInvoiced };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['invoice-cancelled-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['client-billing'] });
      queryClient.invalidateQueries({ queryKey: ['branch-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['enhanced-client-billing'] });
      toast.success(
        data.isInvoiced 
          ? 'Cancelled booking added to invoice' 
          : 'Cancelled booking removed from invoice'
      );
    },
    onError: (error) => {
      console.error('Error updating cancelled booking status:', error);
      toast.error('Failed to update cancelled booking status');
    },
  });
}

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ForceDeleteBookingPayload {
  bookingId: string;
  clientId?: string;
  staffId?: string;
}

interface ForceDeleteResult {
  bookingId: string;
  deletedRecords: {
    bookingServices: number;
    expenses: number;
    extraTimeRecords: number;
  };
}

async function forceDeleteBooking({ 
  bookingId 
}: ForceDeleteBookingPayload): Promise<ForceDeleteResult> {
  console.log('[forceDeleteBooking] Starting force delete for booking:', bookingId);
  
  const deletedRecords = {
    bookingServices: 0,
    expenses: 0,
    extraTimeRecords: 0,
  };
  
  // Step 1: Delete booking_services records
  const { data: deletedServices, error: servicesError } = await supabase
    .from('booking_services')
    .delete()
    .eq('booking_id', bookingId)
    .select('id');
  
  if (servicesError) {
    console.error('[forceDeleteBooking] Error deleting booking_services:', servicesError);
    throw new Error(`Failed to delete booking services: ${servicesError.message}`);
  }
  deletedRecords.bookingServices = deletedServices?.length || 0;
  console.log('[forceDeleteBooking] Deleted booking_services:', deletedRecords.bookingServices);
  
  // Step 2: Delete expenses records
  const { data: deletedExpenses, error: expensesError } = await supabase
    .from('expenses')
    .delete()
    .eq('booking_id', bookingId)
    .select('id');
  
  if (expensesError) {
    console.error('[forceDeleteBooking] Error deleting expenses:', expensesError);
    throw new Error(`Failed to delete expenses: ${expensesError.message}`);
  }
  deletedRecords.expenses = deletedExpenses?.length || 0;
  console.log('[forceDeleteBooking] Deleted expenses:', deletedRecords.expenses);
  
  // Step 3: Delete extra_time_records
  const { data: deletedExtraTime, error: extraTimeError } = await supabase
    .from('extra_time_records')
    .delete()
    .eq('booking_id', bookingId)
    .select('id');
  
  if (extraTimeError) {
    console.error('[forceDeleteBooking] Error deleting extra_time_records:', extraTimeError);
    throw new Error(`Failed to delete extra time records: ${extraTimeError.message}`);
  }
  deletedRecords.extraTimeRecords = deletedExtraTime?.length || 0;
  console.log('[forceDeleteBooking] Deleted extra_time_records:', deletedRecords.extraTimeRecords);
  
  // Step 4: Delete the booking itself
  const { error: bookingError } = await supabase
    .from('bookings')
    .delete()
    .eq('id', bookingId);
  
  if (bookingError) {
    console.error('[forceDeleteBooking] Error deleting booking:', bookingError);
    throw new Error(`Failed to delete booking: ${bookingError.message}`);
  }
  
  console.log('[forceDeleteBooking] Successfully deleted booking and all related records');
  
  return {
    bookingId,
    deletedRecords
  };
}

export function useForceDeleteBooking(branchId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: forceDeleteBooking,
    onSuccess: async (result, variables) => {
      console.log('[useForceDeleteBooking] Force delete completed:', result);
      
      // CRITICAL: Use predicate-based invalidation to catch ALL booking-related queries including range-based
      console.log('[useForceDeleteBooking] Invalidating all booking caches with predicate...');
      await queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0];
          return (
            key === "branch-bookings" ||
            key === "branch-bookings-range" ||
            key === "client-bookings" ||
            key === "carer-bookings" ||
            key === "carer-appointments-full" ||
            key === "organization-calendar" ||
            key === "organization-bookings"
          );
        }
      });
      
      // Force refetch active queries using predicate to ensure UI is updated
      await queryClient.refetchQueries({
        predicate: (query) => {
          const key = query.queryKey[0];
          return (
            key === "branch-bookings" ||
            key === "branch-bookings-range" ||
            key === "client-bookings" ||
            key === "carer-bookings" ||
            key === "carer-appointments-full"
          );
        },
        type: 'active'
      });
      
      console.log('[useForceDeleteBooking] All cache invalidations and refetches completed');
      
      const totalDeleted = 
        result.deletedRecords.bookingServices + 
        result.deletedRecords.expenses + 
        result.deletedRecords.extraTimeRecords;
      
      toast.success(
        `Booking deleted successfully`,
        {
          description: totalDeleted > 0 
            ? `Also removed ${totalDeleted} related record${totalDeleted > 1 ? 's' : ''}`
            : undefined
        }
      );
    },
    onError: (error: any) => {
      console.error('[useForceDeleteBooking] Force delete failed:', error);
      toast.error("Failed to delete booking", {
        description: error.message || "An unknown error occurred."
      });
    },
  });
}

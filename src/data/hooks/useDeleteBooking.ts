import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { notifyBookingCancelled } from "@/utils/bookingNotifications";

interface DeleteBookingPayload {
  bookingId: string;
  clientId?: string;
  staffId?: string;
  branchId?: string;
  organizationId?: string;
  clientName?: string;
}

async function deleteBooking({ bookingId }: DeleteBookingPayload) {
  const { error } = await supabase
    .from("bookings")
    .delete()
    .eq("id", bookingId);

  if (error) {
    console.error("Error deleting booking:", error);
    throw error;
  }
  
  return bookingId;
}

export function useDeleteBooking(branchId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteBooking,
    onSuccess: async (deletedBookingId, variables) => {
      console.log('[useDeleteBooking] Successfully deleted booking:', deletedBookingId);
      
      // Send cancellation notifications
      if (variables.branchId) {
        await notifyBookingCancelled({
          bookingId: deletedBookingId,
          branchId: variables.branchId,
          organizationId: variables.organizationId,
          clientId: variables.clientId,
          staffId: variables.staffId,
          clientName: variables.clientName,
          notificationType: 'booking_cancelled',
        });
      }
      
      // CRITICAL: Use predicate-based invalidation to catch ALL booking-related queries including range-based
      console.log('[useDeleteBooking] Invalidating all booking caches with predicate...');
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
      
      console.log('[useDeleteBooking] All refetches completed');
      toast.success("Booking deleted successfully!");
    },
    onError: (error: any) => {
      console.error('[useDeleteBooking] Failed to delete booking:', error);
      
      // Handle specific error cases
      if (error.message?.includes('foreign key') || error.code === '23503') {
        toast.error("Cannot delete booking", {
          description: "This booking has related records. Consider marking it as 'cancelled' instead.",
        });
      } else if (error.message?.includes('policy') || error.code === '42501') {
        toast.error("Permission denied", {
          description: "You don't have permission to delete bookings.",
        });
      } else {
        toast.error("Failed to delete booking", {
          description: error.message || "An unknown error occurred.",
        });
      }
    },
  });
}
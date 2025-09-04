import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DeleteBookingPayload {
  bookingId: string;
  clientId?: string;
  staffId?: string;
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
    onSuccess: (deletedBookingId, variables) => {
      console.log('[useDeleteBooking] Successfully deleted booking:', deletedBookingId);
      
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ["branch-bookings", branchId] });
      
      if (variables.clientId) {
        queryClient.invalidateQueries({ queryKey: ["client-bookings", variables.clientId] });
      }
      
      if (variables.staffId) {
        queryClient.invalidateQueries({ queryKey: ["carer-bookings", variables.staffId] });
        queryClient.invalidateQueries({ queryKey: ["carer-appointments-full", variables.staffId] });
      }
      
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

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UpdateBookingPayload {
  bookingId: string;
  updatedData: Partial<{
    client_id: string;
    staff_id: string;
    start_time: string;
    end_time: string;
    status: string;
    service_id: string;
    notes: string; // Add notes support
  }>;
}

async function updateBooking({ bookingId, updatedData }: UpdateBookingPayload) {
  const { data, error } = await supabase
    .from("bookings")
    .update(updatedData)
    .eq("id", bookingId)
    .select()
    .single();

  if (error) {
    console.error("Error updating booking:", error);
    throw error;
  }
  return data;
}

export function useUpdateBooking(branchId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateBooking,
    onSuccess: (data) => {
      console.log('[useUpdateBooking] Successfully updated booking:', data.id);
      
      // Invalidate all relevant queries
      queryClient.invalidateQueries({ queryKey: ["branch-bookings", branchId] });
      queryClient.invalidateQueries({ queryKey: ["client-bookings", data.client_id] });
      queryClient.invalidateQueries({ queryKey: ["carer-bookings", data.staff_id] });
      queryClient.invalidateQueries({ queryKey: ["carer-appointments-full", data.staff_id] });
      
      toast.success("Booking updated successfully!");
    },
    onError: (error: any) => {
      console.error('[useUpdateBooking] Failed to update booking:', error);
      toast.error("Failed to update booking", {
        description: error.message || "An unknown error occurred.",
      });
    },
  });
}

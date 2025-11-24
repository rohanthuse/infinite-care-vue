
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
    notes: string;
  }>;
}

async function updateBooking({ bookingId, updatedData }: UpdateBookingPayload) {
  console.log("[useUpdateBooking] Updating booking:", { bookingId, updatedData });
  
  const { data, error } = await supabase
    .from("bookings")
    .update(updatedData)
    .eq("id", bookingId)
    .select()
    .single();

  if (error) {
    console.error("[useUpdateBooking] Database error:", error);
    throw error;
  }
  
  console.log("[useUpdateBooking] Successfully updated booking:", data);
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
      queryClient.invalidateQueries({ queryKey: ["organization-calendar"] });
      queryClient.invalidateQueries({ queryKey: ["branch-booking-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["branch-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["client-billing", data.client_id] });
      queryClient.invalidateQueries({ queryKey: ["booking-change-requests"] });
      queryClient.invalidateQueries({ queryKey: ["pending-booking-requests"] });
      
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

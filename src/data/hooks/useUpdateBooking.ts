
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branch-bookings", branchId] });
      toast.success("Booking updated successfully!");
    },
    onError: (error: any) => {
      toast.error("Failed to update booking", {
        description: error.message || "An unknown error occurred.",
      });
    },
  });
}


import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CreateBookingInput } from "./useCreateBooking";

async function createMultipleBookings(inputs: CreateBookingInput[]) {
  console.log("[createMultipleBookings] Creating bookings:", inputs.length, "bookings");
  console.log("[createMultipleBookings] Branch ID from first booking:", inputs[0]?.branch_id);
  
  // Insert all bookings in one API call (if possible), else fallback to multiple
  if (!Array.isArray(inputs) || inputs.length === 0) {
    console.log("[createMultipleBookings] No bookings to create");
    return [];
  }

  const { data, error } = await supabase
    .from("bookings")
    .insert(inputs)
    .select();

  if (error) {
    console.error("[createMultipleBookings] Database error:", error);
    throw error;
  }
  
  console.log("[createMultipleBookings] Successfully created bookings:", data?.length || 0);
  return data;
}

export function useCreateMultipleBookings(branchId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createMultipleBookings,
    onSuccess: (data) => {
      console.log("[useCreateMultipleBookings] onSuccess - Invalidating queries for branch:", branchId);
      console.log("[useCreateMultipleBookings] Created bookings data:", data);
      
      // Invalidate both the main bookings query and client bookings
      queryClient.invalidateQueries({ queryKey: ["branch-bookings", branchId] });
      
      // Also invalidate any client-specific booking queries
      data?.forEach((booking: any) => {
        if (booking.client_id) {
          queryClient.invalidateQueries({ queryKey: ["client-bookings", booking.client_id] });
        }
      });
      
      console.log("[useCreateMultipleBookings] Query invalidation completed");
    },
    onError: (error) => {
      console.error("[useCreateMultipleBookings] onError:", error);
    }
  });
}

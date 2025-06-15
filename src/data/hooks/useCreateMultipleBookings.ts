
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CreateBookingInput } from "./useCreateBooking";

async function createMultipleBookings(inputs: CreateBookingInput[]) {
  // Insert all bookings in one API call (if possible), else fallback to multiple
  if (!Array.isArray(inputs) || inputs.length === 0) return [];

  const { data, error } = await supabase
    .from("bookings")
    .insert(inputs)
    .select();

  if (error) throw error;
  return data;
}

export function useCreateMultipleBookings(branchId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createMultipleBookings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branch-bookings", branchId] });
    },
  });
}

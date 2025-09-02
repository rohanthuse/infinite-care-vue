
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CreateBookingInput {
  branch_id: string;
  client_id: string;
  staff_id: string;
  start_time: string; // ISO string
  end_time: string;   // ISO string
  service_id?: string;
  revenue?: number;
  status?: string; // <-- ADDED
  notes?: string;
}

export async function createBooking(input: CreateBookingInput) {
  const { data, error } = await supabase
    .from("bookings")
    .insert([
      {
        branch_id: input.branch_id,
        client_id: input.client_id,
        staff_id: input.staff_id,
        start_time: input.start_time,
        end_time: input.end_time,
        service_id: input.service_id || null,
        revenue: input.revenue || null,
        status: input.status || "assigned", // <-- ADDED
        notes: input.notes || null,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export function useCreateBooking(branchId?: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createBooking,
    onSuccess: (data) => {
      // Always invalidate queries using the created booking's branch_id
      const bookingBranchId = data.branch_id;
      queryClient.invalidateQueries({ queryKey: ["branch-bookings", bookingBranchId] });
      queryClient.invalidateQueries({ queryKey: ["client-bookings", data.client_id] });
      queryClient.invalidateQueries({ queryKey: ["carer-bookings", data.staff_id] });
      
      // Also invalidate with the provided branchId for backwards compatibility
      if (branchId && branchId !== bookingBranchId) {
        queryClient.invalidateQueries({ queryKey: ["branch-bookings", branchId] });
      }
    },
  });
}

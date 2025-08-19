
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
  status?: string;
  notes?: string; // Add notes support
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
        status: input.status || "assigned",
        notes: input.notes || null, // Include notes
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["branch-bookings", branchId] });
    },
  });
}

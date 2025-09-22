
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface CreateBookingInput {
  branch_id: string;
  client_id: string;
  staff_id?: string; // Made optional to support unassigned bookings
  start_time: string; // ISO string
  end_time: string;   // ISO string
  service_id: string; // Required service ID
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
        staff_id: input.staff_id || null, // Handle null staff_id for unassigned bookings
        start_time: input.start_time,
        end_time: input.end_time,
        service_id: input.service_id,
        revenue: input.revenue || null,
        status: input.status || (input.staff_id ? "assigned" : "unassigned"), // Auto-set status based on staff assignment
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
    onSuccess: async (data) => {
      try {
        // Always invalidate queries using the created booking's branch_id
        const bookingBranchId = data.branch_id;
        
        console.log('[useCreateBooking] Invalidating queries for successful booking creation:', {
          bookingId: data.id,
          branchId: bookingBranchId,
          clientId: data.client_id,
          staffId: data.staff_id
        });

        // Comprehensive cache invalidation with retry logic
        const invalidateWithRetry = async (queryKey: (string | undefined)[]) => {
          try {
            await queryClient.invalidateQueries({ queryKey });
            console.log('[useCreateBooking] Successfully invalidated:', queryKey);
          } catch (error) {
            console.warn('[useCreateBooking] Failed to invalidate, retrying:', queryKey, error);
            // Retry once after a short delay
            setTimeout(() => {
              queryClient.invalidateQueries({ queryKey }).catch(console.error);
            }, 1000);
          }
        };

        // Invalidate all relevant queries
        await Promise.all([
          invalidateWithRetry(["branch-bookings", bookingBranchId]),
          invalidateWithRetry(["client-bookings", data.client_id]),
          invalidateWithRetry(["carer-bookings", data.staff_id]),
          invalidateWithRetry(["carer-appointments-full", data.staff_id])
        ]);
        
        // Also invalidate with the provided branchId for backwards compatibility
        if (branchId && branchId !== bookingBranchId) {
          await invalidateWithRetry(["branch-bookings", branchId]);
        }

        console.log('[useCreateBooking] All query invalidations completed');
      } catch (error) {
        console.error('[useCreateBooking] Error during query invalidation:', error);
        // Force a hard refetch as fallback
        queryClient.refetchQueries({ queryKey: ["branch-bookings"] });
      }
    },
  });
}

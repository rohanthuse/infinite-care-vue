import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UpdateMultipleBookingsPayload {
  bookingIds: string[];
  bookings: Array<{
    id: string;
    clientId?: string;
    staffId?: string;
  }>;
  updatedData: {
    staff_id?: string;
    start_time?: string;
    end_time?: string;
    status?: string;
  };
}

interface UpdateResult {
  successful: string[];
  failed: Array<{
    bookingId: string;
    error: string;
  }>;
}

async function updateMultipleBookings({ 
  bookingIds,
  updatedData 
}: UpdateMultipleBookingsPayload): Promise<UpdateResult> {
  console.log('[updateMultipleBookings] Starting bulk update for', bookingIds.length, 'bookings');
  
  const successful: string[] = [];
  const failed: Array<{ bookingId: string; error: string }> = [];
  
  // Update bookings one by one to track individual failures
  for (const bookingId of bookingIds) {
    try {
      const { error } = await supabase
        .from("bookings")
        .update(updatedData)
        .eq("id", bookingId);

      if (error) {
        console.error(`[updateMultipleBookings] Error updating booking ${bookingId}:`, error);
        failed.push({
          bookingId,
          error: error.message || "Unknown error"
        });
      } else {
        successful.push(bookingId);
      }
    } catch (error: any) {
      console.error(`[updateMultipleBookings] Exception updating booking ${bookingId}:`, error);
      failed.push({
        bookingId,
        error: error.message || "Unknown error"
      });
    }
  }
  
  console.log('[updateMultipleBookings] Results:', {
    successful: successful.length,
    failed: failed.length
  });
  
  return { successful, failed };
}

export function useUpdateMultipleBookings(branchId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateMultipleBookings,
    onSuccess: async (result, variables) => {
      console.log('[useUpdateMultipleBookings] Bulk update completed:', result);
      
      // Collect unique client and staff IDs from successfully updated bookings
      const uniqueClientIds = new Set<string>();
      const uniqueStaffIds = new Set<string>();
      
      variables.bookings
        .filter(b => result.successful.includes(b.id))
        .forEach(booking => {
          if (booking.clientId) uniqueClientIds.add(booking.clientId);
          if (booking.staffId) uniqueStaffIds.add(booking.staffId);
        });
      
      // Also add the new staff ID
      if (variables.updatedData.staff_id) {
        uniqueStaffIds.add(variables.updatedData.staff_id);
      }
      
      // Refetch all affected queries
      await Promise.all([
        queryClient.refetchQueries({ 
          queryKey: ["branch-bookings", branchId],
          type: 'active' 
        }),
        ...Array.from(uniqueClientIds).map(clientId =>
          queryClient.refetchQueries({ 
            queryKey: ["client-bookings", clientId],
            type: 'active'
          })
        ),
        ...Array.from(uniqueStaffIds).flatMap(staffId => [
          queryClient.refetchQueries({ 
            queryKey: ["carer-bookings", staffId],
            type: 'active'
          }),
          queryClient.refetchQueries({ 
            queryKey: ["carer-appointments-full", staffId],
            type: 'active'
          })
        ])
      ]);
      
      console.log('[useUpdateMultipleBookings] All refetches completed');
      
      // Show appropriate toast messages
      if (result.failed.length === 0) {
        toast.success(
          `Successfully reassigned ${result.successful.length} appointment${result.successful.length > 1 ? 's' : ''}!`
        );
      } else if (result.successful.length === 0) {
        toast.error(
          `Failed to reassign all ${variables.bookingIds.length} appointments`,
          {
            description: "Please check the appointments and try again."
          }
        );
      } else {
        // Partial success
        toast.warning(
          `Reassigned ${result.successful.length} of ${variables.bookingIds.length} appointments`,
          {
            description: `${result.failed.length} appointment${result.failed.length > 1 ? 's' : ''} could not be reassigned.`
          }
        );
      }
    },
    onError: (error: any) => {
      console.error('[useUpdateMultipleBookings] Bulk update failed:', error);
      toast.error("Failed to reassign appointments", {
        description: error.message || "An unknown error occurred."
      });
    },
  });
}

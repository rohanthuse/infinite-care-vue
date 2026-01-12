import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DeleteMultipleBookingsPayload {
  bookingIds: string[];
  bookings: Array<{
    id: string;
    clientId?: string;
    staffId?: string;
  }>;
}

interface DeleteResult {
  successful: string[];
  failed: Array<{
    bookingId: string;
    error: string;
  }>;
}

async function deleteMultipleBookings({ 
  bookingIds 
}: DeleteMultipleBookingsPayload): Promise<DeleteResult> {
  console.log('[deleteMultipleBookings] Starting bulk delete for', bookingIds.length, 'bookings');
  
  const successful: string[] = [];
  const failed: Array<{ bookingId: string; error: string }> = [];
  
  // Delete bookings one by one to track individual failures
  for (const bookingId of bookingIds) {
    try {
      const { error } = await supabase
        .from("bookings")
        .delete()
        .eq("id", bookingId);

      if (error) {
        console.error(`[deleteMultipleBookings] Error deleting booking ${bookingId}:`, error);
        failed.push({
          bookingId,
          error: error.message || "Unknown error"
        });
      } else {
        successful.push(bookingId);
      }
    } catch (error: any) {
      console.error(`[deleteMultipleBookings] Exception deleting booking ${bookingId}:`, error);
      failed.push({
        bookingId,
        error: error.message || "Unknown error"
      });
    }
  }
  
  console.log('[deleteMultipleBookings] Results:', {
    successful: successful.length,
    failed: failed.length
  });
  
  return { successful, failed };
}

export function useDeleteMultipleBookings(branchId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteMultipleBookings,
    onSuccess: async (result, variables) => {
      console.log('[useDeleteMultipleBookings] Bulk delete completed:', result);
      
      // CRITICAL: First invalidate ALL booking-related caches to prevent stale data
      console.log('[useDeleteMultipleBookings] Invalidating all booking caches...');
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["branch-bookings"] }),
        queryClient.invalidateQueries({ queryKey: ["client-bookings"] }),
        queryClient.invalidateQueries({ queryKey: ["carer-bookings"] }),
        queryClient.invalidateQueries({ queryKey: ["carer-appointments-full"] }),
      ]);
      
      // Collect unique client and staff IDs from successfully deleted bookings
      const uniqueClientIds = new Set<string>();
      const uniqueStaffIds = new Set<string>();
      
      variables.bookings
        .filter(b => result.successful.includes(b.id))
        .forEach(booking => {
          if (booking.clientId) uniqueClientIds.add(booking.clientId);
          if (booking.staffId) uniqueStaffIds.add(booking.staffId);
        });
      
      // Force refetch active queries to ensure UI is updated
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
      
      console.log('[useDeleteMultipleBookings] All cache invalidations and refetches completed');
      
      // Show appropriate toast messages
      if (result.failed.length === 0) {
        toast.success(
          `Successfully deleted ${result.successful.length} booking${result.successful.length > 1 ? 's' : ''}!`
        );
      } else if (result.successful.length === 0) {
        toast.error(
          `Failed to delete all ${variables.bookingIds.length} bookings`,
          {
            description: "Please check the bookings and try again."
          }
        );
      } else {
        // Partial success
        toast.warning(
          `Deleted ${result.successful.length} of ${variables.bookingIds.length} bookings`,
          {
            description: `${result.failed.length} booking${result.failed.length > 1 ? 's' : ''} could not be deleted. They may have related records.`
          }
        );
      }
    },
    onError: (error: any) => {
      console.error('[useDeleteMultipleBookings] Bulk delete failed:', error);
      toast.error("Failed to delete bookings", {
        description: error.message || "An unknown error occurred."
      });
    },
  });
}

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { notifyBookingUpdated } from "@/utils/bookingNotifications";
import { ensureValidBookingTimes } from "@/utils/bookingTimeValidation";

interface UpdateBookingPayload {
  bookingId: string;
  previousData?: {
    staff_id?: string;
    start_time?: string;
    end_time?: string;
    status?: string;
  };
  updatedData: Partial<{
    client_id: string;
    staff_id: string;
    start_time: string;
    end_time: string;
    status: string;
    service_id: string;
    notes: string;
    location_address: string;
  }>;
}

async function updateBooking({ bookingId, updatedData }: UpdateBookingPayload) {
  console.log("[useUpdateBooking] Updating booking:", { bookingId, updatedData });
  
  // CRITICAL: Validate booking times if both start_time and end_time are being updated
  let validatedData = { ...updatedData };
  if (updatedData.start_time && updatedData.end_time) {
    const validatedTimes = ensureValidBookingTimes(updatedData.start_time, updatedData.end_time);
    validatedData.start_time = validatedTimes.startTime;
    validatedData.end_time = validatedTimes.endTime;
    console.log("[useUpdateBooking] Validated booking times:", validatedTimes);
  }
  
  const { data, error } = await supabase
    .from("bookings")
    .update(validatedData)
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
    onSuccess: async (data, variables) => {
      console.log('[useUpdateBooking] Successfully updated booking:', data.id);
      
      // Detect what changed for notifications
      const changes: {
        staffChanged?: { oldStaffId?: string; newStaffId?: string };
        timeChanged?: boolean;
        statusChanged?: { oldStatus?: string; newStatus?: string };
      } = {};

      const prev = variables.previousData;
      if (prev) {
        // Check if staff changed
        if (prev.staff_id !== data.staff_id) {
          changes.staffChanged = {
            oldStaffId: prev.staff_id,
            newStaffId: data.staff_id,
          };
        }

        // Check if time changed
        if (prev.start_time !== data.start_time || prev.end_time !== data.end_time) {
          changes.timeChanged = true;
        }

        // Check if status changed
        if (prev.status !== data.status) {
          changes.statusChanged = {
            oldStatus: prev.status,
            newStatus: data.status,
          };
        }
      }

      // Send notifications if there are changes
      if (Object.keys(changes).length > 0) {
        // Get client name for notifications
        let clientName: string | undefined;
        if (data.client_id) {
          const { data: client } = await supabase
            .from('clients')
            .select('first_name, last_name')
            .eq('id', data.client_id)
            .single();
          if (client) {
            clientName = `${client.first_name} ${client.last_name}`;
          }
        }

        await notifyBookingUpdated({
          booking: {
            bookingId: data.id,
            branchId: data.branch_id || branchId || '',
            organizationId: data.organization_id,
            clientId: data.client_id,
            staffId: data.staff_id,
            clientName,
            startTime: data.start_time,
            notificationType: 'booking_updated',
          },
          changes,
        });
      }
      
      // CRITICAL: Use predicate-based invalidation to catch ALL booking-related queries including range-based
      console.log('[useUpdateBooking] Invalidating all booking caches with predicate...');
      await queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey[0];
          return (
            key === "branch-bookings" ||
            key === "branch-bookings-range" ||
            key === "client-bookings" ||
            key === "carer-bookings" ||
            key === "carer-appointments-full" ||
            key === "organization-calendar" ||
            key === "organization-bookings"
          );
        }
      });

      // Force refetch active queries to ensure UI updates immediately
      await queryClient.refetchQueries({
        predicate: (query) => {
          const key = query.queryKey[0];
          return (
            key === "branch-bookings" ||
            key === "branch-bookings-range" ||
            key === "client-bookings" ||
            key === "carer-bookings" ||
            key === "carer-appointments-full"
          );
        },
        type: 'active'
      });

      // Keep additional invalidations for billing/invoicing (non-schedule related)
      queryClient.invalidateQueries({ queryKey: ["branch-invoices"] });
      queryClient.invalidateQueries({ queryKey: ["client-billing", data.client_id] });
      queryClient.invalidateQueries({ queryKey: ["booking-change-requests"] });
      queryClient.invalidateQueries({ queryKey: ["pending-booking-requests"] });

      console.log('[useUpdateBooking] All refetches completed');
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

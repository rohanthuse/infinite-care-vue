import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { addDays, addWeeks, startOfWeek, endOfWeek, differenceInDays, format } from "date-fns";

export type ReplicationMode = 'single' | 'this-week' | 'recurring' | 'custom';

export interface ReplicationOptions {
  mode: ReplicationMode;
  sourceStartDate: Date;
  sourceEndDate: Date;
  targetStartDate: Date;
  recurringWeeks?: number;
  includeStaff: boolean;
  includeCancelled: boolean;
  branchId: string;
  singleBookingId?: string;
}

export interface BookingToReplicate {
  id: string;
  start_time: string;
  end_time: string;
  client_id: string;
  staff_id: string | null;
  branch_id: string;
  service_id: string | null;
  notes: string | null;
  revenue: number | null;
  status: string;
  organization_id: string | null;
  staff_payment_amount: number | null;
  staff_payment_type: string | null;
  service_ids?: string[];
}

interface ReplicationResult {
  successCount: number;
  failedCount: number;
  createdBookingIds: string[];
}

// Fetch bookings to replicate based on mode
export async function fetchBookingsToReplicate(
  options: ReplicationOptions
): Promise<BookingToReplicate[]> {
  console.log('[fetchBookingsToReplicate] Options:', options);

  let query = supabase
    .from('bookings')
    .select(`
      id,
      start_time,
      end_time,
      client_id,
      staff_id,
      branch_id,
      service_id,
      notes,
      revenue,
      status,
      organization_id,
      staff_payment_amount,
      staff_payment_type,
      booking_services (
        service_id
      )
    `)
    .eq('branch_id', options.branchId);

  // Handle single booking mode
  if (options.mode === 'single' && options.singleBookingId) {
    query = query.eq('id', options.singleBookingId);
  } else {
    // Filter by date range for other modes
    const startIso = options.sourceStartDate.toISOString();
    const endIso = options.sourceEndDate.toISOString();
    query = query
      .gte('start_time', startIso)
      .lt('start_time', endIso);
  }

  // Exclude cancelled unless specified
  if (!options.includeCancelled) {
    query = query.neq('status', 'cancelled');
  }

  const { data, error } = await query;

  if (error) {
    console.error('[fetchBookingsToReplicate] Error:', error);
    throw error;
  }

  console.log('[fetchBookingsToReplicate] Found', data?.length || 0, 'bookings');

  // Map booking_services to service_ids array
  return (data || []).map(booking => ({
    ...booking,
    service_ids: booking.booking_services?.map((bs: any) => bs.service_id) || []
  }));
}

// Calculate the new dates for replicated bookings
function calculateNewDateTime(
  originalDateTime: string,
  sourceStartDate: Date,
  targetStartDate: Date
): string {
  const original = new Date(originalDateTime);
  const dayOffset = differenceInDays(original, sourceStartDate);
  const newDate = addDays(targetStartDate, dayOffset);
  
  // Preserve the time from original
  newDate.setHours(original.getHours());
  newDate.setMinutes(original.getMinutes());
  newDate.setSeconds(original.getSeconds());
  newDate.setMilliseconds(original.getMilliseconds());
  
  return newDate.toISOString();
}

// Main replication function
async function replicateBookings(
  options: ReplicationOptions
): Promise<ReplicationResult> {
  console.log('[replicateBookings] Starting replication with options:', options);

  // Fetch source bookings
  const sourceBookings = await fetchBookingsToReplicate(options);

  if (sourceBookings.length === 0) {
    return { successCount: 0, failedCount: 0, createdBookingIds: [] };
  }

  const allBookingsToCreate: any[] = [];
  const serviceInputs: { bookingIndex: number; serviceIds: string[] }[] = [];

  // Calculate target weeks based on mode
  const targetWeeks: Date[] = [];
  
  if (options.mode === 'recurring' && options.recurringWeeks) {
    for (let i = 0; i < options.recurringWeeks; i++) {
      targetWeeks.push(addWeeks(options.targetStartDate, i));
    }
  } else {
    targetWeeks.push(options.targetStartDate);
  }

  // Create bookings for each target week
  for (const targetStart of targetWeeks) {
    for (const booking of sourceBookings) {
      const newStartTime = calculateNewDateTime(
        booking.start_time,
        options.sourceStartDate,
        targetStart
      );
      const newEndTime = calculateNewDateTime(
        booking.end_time,
        options.sourceStartDate,
        targetStart
      );

      const newBooking = {
        start_time: newStartTime,
        end_time: newEndTime,
        client_id: booking.client_id,
        staff_id: options.includeStaff ? booking.staff_id : null,
        branch_id: booking.branch_id,
        service_id: booking.service_id,
        notes: booking.notes,
        revenue: booking.revenue,
        status: 'scheduled',
        organization_id: booking.organization_id,
        staff_payment_amount: booking.staff_payment_amount,
        staff_payment_type: booking.staff_payment_type,
      };

      allBookingsToCreate.push(newBooking);
      
      // Track service_ids for junction table
      if (booking.service_ids && booking.service_ids.length > 0) {
        serviceInputs.push({
          bookingIndex: allBookingsToCreate.length - 1,
          serviceIds: booking.service_ids
        });
      }
    }
  }

  console.log('[replicateBookings] Creating', allBookingsToCreate.length, 'new bookings');

  // Insert all bookings
  const { data: createdBookings, error } = await supabase
    .from('bookings')
    .insert(allBookingsToCreate)
    .select('id');

  if (error) {
    console.error('[replicateBookings] Insert error:', error);
    throw error;
  }

  const createdBookingIds = createdBookings?.map(b => b.id) || [];

  // Create booking_services entries
  const bookingServicesEntries: { booking_id: string; service_id: string }[] = [];
  for (const { bookingIndex, serviceIds } of serviceInputs) {
    const bookingId = createdBookingIds[bookingIndex];
    if (bookingId) {
      for (const serviceId of serviceIds) {
        bookingServicesEntries.push({
          booking_id: bookingId,
          service_id: serviceId
        });
      }
    }
  }

  if (bookingServicesEntries.length > 0) {
    const { error: servicesError } = await supabase
      .from('booking_services')
      .insert(bookingServicesEntries);

    if (servicesError) {
      console.error('[replicateBookings] Services insert error:', servicesError);
    }
  }

  console.log('[replicateBookings] Successfully created', createdBookingIds.length, 'bookings');

  return {
    successCount: createdBookingIds.length,
    failedCount: allBookingsToCreate.length - createdBookingIds.length,
    createdBookingIds
  };
}

export function useReplicateBookings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: replicateBookings,
    onSuccess: async (result, variables) => {
      console.log('[useReplicateBookings] Replication complete:', result);

      // Invalidate calendar and booking queries
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['organization-calendar'] }),
        queryClient.invalidateQueries({ queryKey: ['branch-bookings', variables.branchId] }),
      ]);

      if (result.successCount > 0) {
        toast.success(`Successfully replicated ${result.successCount} booking${result.successCount !== 1 ? 's' : ''}`);
      }

      if (result.failedCount > 0) {
        toast.warning(`${result.failedCount} booking${result.failedCount !== 1 ? 's' : ''} failed to replicate`);
      }
    },
    onError: (error: Error) => {
      console.error('[useReplicateBookings] Error:', error);
      toast.error(`Failed to replicate bookings: ${error.message}`);
    }
  });
}

// Helper function to get week boundaries
export function getWeekBoundaries(date: Date): { start: Date; end: Date } {
  const start = startOfWeek(date, { weekStartsOn: 1 }); // Monday
  const end = endOfWeek(date, { weekStartsOn: 1 }); // Sunday
  return { start, end };
}

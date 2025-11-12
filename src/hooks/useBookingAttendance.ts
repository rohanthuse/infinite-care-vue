
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { useAutomaticAttendance, AutoAttendanceData } from "./useAutomaticAttendance";

export interface BookingAttendanceData {
  bookingId: string;
  staffId: string;
  branchId: string;
  action: 'start_visit' | 'end_visit';
  location?: {
    latitude: number;
    longitude: number;
  };
  lateArrivalReason?: string;
  arrivalDelayMinutes?: number;
}

export const useBookingAttendance = (options?: { silent?: boolean }) => {
  const queryClient = useQueryClient();
  const automaticAttendance = useAutomaticAttendance({ silent: true });

  return useMutation({
    mutationFn: async (data: BookingAttendanceData) => {
      console.log('[useBookingAttendance] Processing booking attendance:', data);
      
      // Validate required fields
      if (!data.bookingId || !data.staffId || !data.branchId) {
        const missingFields = [];
        if (!data.bookingId) missingFields.push('bookingId');
        if (!data.staffId) missingFields.push('staffId');
        if (!data.branchId) missingFields.push('branchId');
        throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
      }
      
      try {
        // Update booking status
        const newStatus = data.action === 'start_visit' ? 'in_progress' : 'done';
        
        console.log('[useBookingAttendance] Updating booking status to:', newStatus);
        const { error: bookingError } = await supabase
          .from('bookings')
          .update({ 
            status: newStatus
          })
          .eq('id', data.bookingId);

        if (bookingError) {
          console.error('[useBookingAttendance] Booking update error:', bookingError);
          throw new Error(`Failed to update booking: ${bookingError.message}`);
        }

        console.log('[useBookingAttendance] Booking updated successfully');

        // If starting visit and late arrival data provided, create/update visit record with late arrival info
        if (data.action === 'start_visit' && (data.lateArrivalReason || data.arrivalDelayMinutes)) {
          console.log('[useBookingAttendance] Recording late arrival information');
          
          // Check if visit record exists
          const { data: existingVisit } = await supabase
            .from('visit_records')
            .select('id')
            .eq('booking_id', data.bookingId)
            .single();

          if (existingVisit) {
            // Update existing visit record
            const { error: visitError } = await supabase
              .from('visit_records')
              .update({
                late_arrival_reason: data.lateArrivalReason,
                arrival_delay_minutes: data.arrivalDelayMinutes,
              })
              .eq('id', existingVisit.id);

            if (visitError) {
              console.error('[useBookingAttendance] Error updating visit record:', visitError);
            }
          } else {
            // Create new visit record with late arrival info
            const { data: booking } = await supabase
              .from('bookings')
              .select('client_id, staff_id, branch_id, start_time')
              .eq('id', data.bookingId)
              .single();

            if (booking) {
              const { error: createError } = await supabase
                .from('visit_records')
                .insert({
                  booking_id: data.bookingId,
                  client_id: booking.client_id,
                  staff_id: booking.staff_id,
                  branch_id: booking.branch_id,
                  visit_date: format(new Date(booking.start_time), 'yyyy-MM-dd'),
                  visit_start_time: new Date().toISOString(),
                  status: 'in_progress',
                  late_arrival_reason: data.lateArrivalReason,
                  arrival_delay_minutes: data.arrivalDelayMinutes,
                });

              if (createError) {
                console.error('[useBookingAttendance] Error creating visit record:', createError);
              }
            }
          }
        }

        // Process attendance automatically with retry logic
        const attendanceData: AutoAttendanceData = {
          personId: data.staffId,
          personType: 'staff',
          branchId: data.branchId,
          bookingId: data.bookingId,
          action: data.action === 'start_visit' ? 'check_in' : 'check_out',
          location: data.location || { latitude: 0, longitude: 0 }
        };

        console.log('[useBookingAttendance] Processing attendance:', attendanceData);
        try {
          await automaticAttendance.mutateAsync(attendanceData);
          console.log('[useBookingAttendance] Attendance processed successfully');
        } catch (attendanceError) {
          console.error('[useBookingAttendance] Attendance error:', attendanceError);
          // Don't throw here - allow the booking update to succeed even if attendance fails
          console.warn('[useBookingAttendance] Continuing despite attendance error');
        }

        return { success: true, bookingStatus: newStatus };
      } catch (error) {
        console.error('[useBookingAttendance] Error processing booking attendance:', error);
        throw error;
      }
    },
    onSuccess: (result, variables) => {
      console.log('[useBookingAttendance] Success, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['branch-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['carer-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['carer-appointments-full'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-records'] });
      queryClient.invalidateQueries({ queryKey: ['today-attendance'] });
      queryClient.invalidateQueries({ queryKey: ['carer-completed-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['branch-booking-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['branch-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['client-billing'] });
      
      // Only show success toast if not in silent mode
      if (!options?.silent) {
        const actionText = variables.action === 'start_visit' ? 'started' : 'completed';
        toast.success(`Visit ${actionText} successfully`);
      }
    },
    onError: (error: any) => {
      console.error('[useBookingAttendance] Mutation error:', error);
      
      // Only show error toast if not in silent mode
      if (!options?.silent) {
        const errorMessage = error?.message || 'Failed to update visit status';
        toast.error('Failed to update visit status', {
          description: errorMessage
        });
      }
    },
  });
};

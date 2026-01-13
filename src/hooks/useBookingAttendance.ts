
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
        
        console.log('[useBookingAttendance] Updating booking status from current to:', newStatus);
        
        // Fetch current booking data including start_time for late calculation
        const { data: currentBooking } = await supabase
          .from('bookings')
          .select('status, start_time')
          .eq('id', data.bookingId)
          .single();
        
        console.log('[useBookingAttendance] Current booking status:', currentBooking?.status);
        
        // Calculate late start info when starting a visit
        let lateStartMinutes = 0;
        let isLateStart = false;
        
        if (data.action === 'start_visit' && currentBooking?.start_time) {
          const scheduledStart = new Date(currentBooking.start_time);
          const actualStart = new Date();
          lateStartMinutes = Math.floor((actualStart.getTime() - scheduledStart.getTime()) / (1000 * 60));
          isLateStart = lateStartMinutes > 0;
          
          console.log('[useBookingAttendance] Late start calculation:', {
            scheduledStart: scheduledStart.toISOString(),
            actualStart: actualStart.toISOString(),
            lateStartMinutes,
            isLateStart
          });
        }
        
        // Build update object with late start info if applicable
        const bookingUpdate: Record<string, any> = { 
          status: newStatus
        };
        
        if (data.action === 'start_visit') {
          if (isLateStart) {
            bookingUpdate.is_late_start = true;
            bookingUpdate.late_start_minutes = lateStartMinutes;
          }
          bookingUpdate.is_missed = false; // Always clear missed flag when starting visit
        }
        
        // Phase 3: Always clear is_missed when ending visit (completing)
        if (data.action === 'end_visit') {
          bookingUpdate.is_missed = false;
        }
        
        const { error: bookingError } = await supabase
          .from('bookings')
          .update(bookingUpdate)
          .eq('id', data.bookingId);

        if (bookingError) {
          console.error('[useBookingAttendance] Booking update error:', bookingError);
          
          // Log RLS policy issues specifically
          if (bookingError.message?.includes('policy') || bookingError.message?.includes('permission')) {
            console.error('[useBookingAttendance] RLS policy violation detected - check if carer has permission to update this booking');
          }
          
          throw new Error(`Failed to update booking: ${bookingError.message}`);
        }

        // CRITICAL: Double-verify the update succeeded
        const { data: updatedBooking, error: verifyError } = await supabase
          .from('bookings')
          .select('status')
          .eq('id', data.bookingId)
          .single();

        if (verifyError || !updatedBooking || updatedBooking.status !== newStatus) {
          console.error('[useBookingAttendance] Verification failed:', { 
            expected: newStatus, 
            actual: updatedBooking?.status,
            error: verifyError 
          });
          throw new Error(`Booking status verification failed - expected ${newStatus} but got ${updatedBooking?.status || 'null'}`);
        }
        
        console.log('[useBookingAttendance] Booking updated and verified successfully, new status:', updatedBooking.status);

        // If starting visit, always create/update visit record with actual start time and late info
        if (data.action === 'start_visit') {
          // Use calculated late minutes or provided value
          const actualDelayMinutes = data.arrivalDelayMinutes || (isLateStart ? lateStartMinutes : 0);
          
          console.log('[useBookingAttendance] Recording visit start information:', {
            isLate: isLateStart || actualDelayMinutes > 0,
            delayMinutes: actualDelayMinutes,
            reason: data.lateArrivalReason
          });
          
          // Check if visit record exists
          const { data: existingVisit } = await supabase
            .from('visit_records')
            .select('id')
            .eq('booking_id', data.bookingId)
            .maybeSingle();

          if (existingVisit) {
            // Update existing visit record with audit trail
            const visitUpdateData: Record<string, any> = {
              visit_start_time: new Date().toISOString(),
              late_arrival_reason: data.lateArrivalReason || null,
              arrival_delay_minutes: actualDelayMinutes,
              status: 'in_progress',
            };
            
            // Add audit trail if late arrival reason provided
            if (data.lateArrivalReason) {
              visitUpdateData.late_submitted_by = data.staffId;
              visitUpdateData.late_submitted_at = new Date().toISOString();
            }
            
            const { error: visitError } = await supabase
              .from('visit_records')
              .update(visitUpdateData)
              .eq('id', existingVisit.id);

            if (visitError) {
              console.error('[useBookingAttendance] Error updating visit record:', visitError);
            }
          } else {
            // Create new visit record with actual start time
            const { data: booking } = await supabase
              .from('bookings')
              .select('client_id, staff_id, branch_id, start_time')
              .eq('id', data.bookingId)
              .single();

            if (booking && booking.branch_id) {
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
                  late_arrival_reason: data.lateArrivalReason || null,
                  arrival_delay_minutes: actualDelayMinutes,
                  late_submitted_by: data.lateArrivalReason ? data.staffId : null,
                  late_submitted_at: data.lateArrivalReason ? new Date().toISOString() : null,
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
      queryClient.invalidateQueries({ queryKey: ['carer-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['carer-upcoming-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-records'] });
      queryClient.invalidateQueries({ queryKey: ['today-attendance'] });
      queryClient.invalidateQueries({ queryKey: ['carer-completed-bookings'] });
      
      queryClient.invalidateQueries({ queryKey: ['branch-invoices'] });
      queryClient.invalidateQueries({ queryKey: ['client-billing'] });
      
      console.log('[useBookingAttendance] Invalidated carer-appointments and carer-upcoming-appointments for dashboard refresh');
      
      // Force immediate refetch with slight delay to ensure DB write completes
      setTimeout(() => {
        queryClient.refetchQueries({ 
          queryKey: ['carer-appointments-full'], 
          exact: false 
        });
      }, 300);
      
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

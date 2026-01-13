
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface RescheduleAppointmentData {
  appointmentId: string;
  newDate: Date;
  newTimeSlot: string;
  reason?: string;
}

const rescheduleAppointment = async ({ appointmentId, newDate, newTimeSlot, reason }: RescheduleAppointmentData) => {
  console.log('[rescheduleAppointment] Starting reschedule process:', {
    appointmentId,
    newDate: newDate.toISOString(),
    newTimeSlot,
    reason
  });

  // Convert time slot to 24-hour format for database storage
  const timeMapping: { [key: string]: string } = {
    '9:00 AM': '09:00',
    '9:30 AM': '09:30',
    '10:00 AM': '10:00',
    '10:30 AM': '10:30',
    '11:00 AM': '11:00',
    '11:30 AM': '11:30',
    '12:00 PM': '12:00',
    '12:30 PM': '12:30',
    '1:00 PM': '13:00',
    '1:30 PM': '13:30',
    '2:00 PM': '14:00',
    '2:30 PM': '14:30',
    '3:00 PM': '15:00',
    '3:30 PM': '15:30',
    '4:00 PM': '16:00',
    '4:30 PM': '16:30',
    '5:00 PM': '17:00',
  };

  const time24 = timeMapping[newTimeSlot];
  if (!time24) {
    console.error('[rescheduleAppointment] Invalid time slot:', newTimeSlot);
    throw new Error(`Invalid time slot selected: ${newTimeSlot}`);
  }

  // Create new start_time and end_time using UTC to avoid timezone conversion issues
  const newStartTime = new Date(newDate);
  const [hours, minutes] = time24.split(':');
  
  // Use setUTCHours to set the time directly in UTC, avoiding local timezone conversion
  newStartTime.setUTCHours(parseInt(hours), parseInt(minutes), 0, 0);
  
  // Assume 1-hour appointments
  const newEndTime = new Date(newStartTime);
  newEndTime.setUTCHours(newEndTime.getUTCHours() + 1);

  console.log('[rescheduleAppointment] Calculated times (UTC):', {
    selectedTimeSlot: newTimeSlot,
    time24Format: time24,
    newStartTime: newStartTime.toISOString(),
    newEndTime: newEndTime.toISOString(),
    startTimeUTCHours: newStartTime.getUTCHours(),
    startTimeUTCMinutes: newStartTime.getUTCMinutes()
  });

  const { data, error } = await supabase
    .from('bookings')
    .update({
      start_time: newStartTime.toISOString(),
      end_time: newEndTime.toISOString(),
      status: 'confirmed' // Ensure status remains confirmed after reschedule
    })
    .eq('id', appointmentId)
    .select()
    .single();

  if (error) {
    console.error('[rescheduleAppointment] Database error:', error);
    throw new Error(`Failed to reschedule appointment: ${error.message}`);
  }

  console.log('[rescheduleAppointment] Successfully rescheduled:', data);
  return data;
};

export const useRescheduleAppointment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: rescheduleAppointment,
    onSuccess: async (data) => {
      console.log('[useRescheduleAppointment] Reschedule successful:', data);
      
      // CRITICAL: Use predicate-based invalidation for all booking-related queries
      console.log('[useRescheduleAppointment] Invalidating all booking caches...');
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
            key === "organization-bookings" ||
            key === "client-appointments" ||
            key === "completed-appointments"
          );
        }
      });

      // Force refetch active queries
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

      console.log('[useRescheduleAppointment] All refetches completed');
      toast.success('Appointment rescheduled successfully!');
    },
    onError: (error: any) => {
      console.error('[useRescheduleAppointment] Reschedule failed:', error);
      const errorMessage = error.message || 'An unexpected error occurred';
      toast.error(`Failed to reschedule appointment: ${errorMessage}`);
    },
  });
};

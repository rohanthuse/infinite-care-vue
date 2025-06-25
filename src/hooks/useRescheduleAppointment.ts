
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
  // Convert time slot to 24-hour format for database storage
  const timeMapping: { [key: string]: string } = {
    '9:00 AM': '09:00',
    '10:00 AM': '10:00',
    '11:00 AM': '11:00',
    '1:00 PM': '13:00',
    '2:00 PM': '14:00',
    '3:00 PM': '15:00',
    '4:00 PM': '16:00',
  };

  const time24 = timeMapping[newTimeSlot];
  if (!time24) {
    throw new Error('Invalid time slot selected');
  }

  // Create new start_time and end_time
  const newStartTime = new Date(newDate);
  const [hours, minutes] = time24.split(':');
  newStartTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
  
  // Assume 1-hour appointments
  const newEndTime = new Date(newStartTime);
  newEndTime.setHours(newEndTime.getHours() + 1);

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
    console.error('Error rescheduling appointment:', error);
    throw error;
  }

  return data;
};

export const useRescheduleAppointment = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: rescheduleAppointment,
    onSuccess: (data) => {
      toast.success('Appointment rescheduled successfully!');
      
      // Invalidate and refetch appointments
      queryClient.invalidateQueries({ queryKey: ['client-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['completed-appointments'] });
    },
    onError: (error: any) => {
      console.error('Failed to reschedule appointment:', error);
      toast.error('Failed to reschedule appointment. Please try again.');
    },
  });
};

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CalendarEvent } from '@/types/calendar';
import { toast } from 'sonner';

interface UpdateEventParams {
  id: string;
  type: string;
  updates: Record<string, any>;
}

interface DeleteEventParams {
  id: string;
  type: string;
}

export const useUpdateCalendarEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, type, updates }: UpdateEventParams) => {
      console.log(`[useUpdateCalendarEvent] Updating ${type} event:`, id, updates);

      switch (type) {
        case 'booking':
          const { error: bookingError } = await supabase
            .from('bookings')
            .update(updates)
            .eq('id', id);
          if (bookingError) throw bookingError;
          break;

        case 'agreement':
          const { error: agreementError } = await supabase
            .from('scheduled_agreements')
            .update(updates)
            .eq('id', id);
          if (agreementError) throw agreementError;
          break;

        case 'training':
          const { error: trainingError } = await supabase
            .from('staff_training_records')
            .update(updates)
            .eq('id', id);
          if (trainingError) throw trainingError;
          break;

        case 'leave':
          const { error: leaveError } = await supabase
            .from('annual_leave_calendar')
            .update(updates)
            .eq('id', id);
          if (leaveError) throw leaveError;
          break;

        case 'meeting':
          const { error: meetingError } = await supabase
            .from('client_appointments')
            .update(updates)
            .eq('id', id);
          if (meetingError) throw meetingError;
          break;

        default:
          throw new Error(`Unknown event type: ${type}`);
      }

      return { id, type, updates };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-calendar'] });
      toast.success('Event updated successfully');
    },
    onError: (error) => {
      console.error('Error updating event:', error);
      toast.error('Failed to update event');
    },
  });
};

export const useDeleteCalendarEvent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, type }: DeleteEventParams) => {
      console.log(`[useDeleteCalendarEvent] Deleting ${type} event:`, id);

      switch (type) {
        case 'booking':
          const { error: bookingError } = await supabase
            .from('bookings')
            .delete()
            .eq('id', id);
          if (bookingError) throw bookingError;
          break;

        case 'agreement':
          const { error: agreementError } = await supabase
            .from('scheduled_agreements')
            .delete()
            .eq('id', id);
          if (agreementError) throw agreementError;
          break;

        case 'training':
          const { error: trainingError } = await supabase
            .from('staff_training_records')
            .delete()
            .eq('id', id);
          if (trainingError) throw trainingError;
          break;

        case 'leave':
          const { error: leaveError } = await supabase
            .from('annual_leave_calendar')
            .delete()
            .eq('id', id);
          if (leaveError) throw leaveError;
          break;

        case 'meeting':
          const { error: meetingError } = await supabase
            .from('client_appointments')
            .delete()
            .eq('id', id);
          if (meetingError) throw meetingError;
          break;

        default:
          throw new Error(`Unknown event type: ${type}`);
      }

      return { id, type };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-calendar'] });
      toast.success('Event deleted successfully');
    },
    onError: (error) => {
      console.error('Error deleting event:', error);
      toast.error('Failed to delete event');
    },
  });
};

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
}

export const useBookingAttendance = () => {
  const queryClient = useQueryClient();
  const automaticAttendance = useAutomaticAttendance();

  return useMutation({
    mutationFn: async (data: BookingAttendanceData) => {
      console.log('Processing booking attendance:', data);
      
      try {
        // Update booking status
        const newStatus = data.action === 'start_visit' ? 'in_progress' : 'completed';
        
        const { error: bookingError } = await supabase
          .from('bookings')
          .update({ 
            status: newStatus,
            updated_at: new Date().toISOString()
          })
          .eq('id', data.bookingId);

        if (bookingError) throw bookingError;

        // Process attendance automatically
        const attendanceData: AutoAttendanceData = {
          personId: data.staffId,
          personType: 'staff',
          branchId: data.branchId,
          bookingId: data.bookingId,
          action: data.action === 'start_visit' ? 'check_in' : 'check_out',
          location: data.location
        };

        await automaticAttendance.mutateAsync(attendanceData);

        return { success: true, bookingStatus: newStatus };
      } catch (error) {
        console.error('Error processing booking attendance:', error);
        throw error;
      }
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({ queryKey: ['branch-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-records'] });
      
      if (variables.action === 'start_visit') {
        toast.success("Visit started and attendance marked");
      } else {
        toast.success("Visit completed and attendance updated");
      }
    },
    onError: (error: any) => {
      console.error('Error processing booking attendance:', error);
      toast.error('Failed to process visit: ' + (error.message || 'Unknown error'));
    },
  });
};

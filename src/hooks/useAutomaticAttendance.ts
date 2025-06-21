
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

export interface AutoAttendanceData {
  personId: string;
  personType: 'staff' | 'client';
  branchId: string;
  bookingId?: string;
  action: 'check_in' | 'check_out';
  location?: {
    latitude: number;
    longitude: number;
  };
}

export const useAutomaticAttendance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: AutoAttendanceData) => {
      console.log('Processing automatic attendance:', data);
      
      const today = format(new Date(), 'yyyy-MM-dd');
      const currentTime = format(new Date(), 'HH:mm');
      
      if (data.action === 'check_in') {
        // Check if attendance record already exists for today
        const { data: existingRecord } = await supabase
          .from('attendance_records')
          .select('id')
          .eq('person_id', data.personId)
          .eq('attendance_date', today)
          .single();

        if (existingRecord) {
          // Update existing record with check-in time
          const { data: updatedRecord, error } = await supabase
            .from('attendance_records')
            .update({
              status: 'present',
              check_in_time: currentTime,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingRecord.id)
            .select()
            .single();

          if (error) throw error;
          return updatedRecord;
        } else {
          // Create new attendance record
          const { data: newRecord, error } = await supabase
            .from('attendance_records')
            .insert({
              person_id: data.personId,
              person_type: data.personType,
              branch_id: data.branchId,
              attendance_date: today,
              status: 'present',
              check_in_time: currentTime,
              hours_worked: 0
            })
            .select()
            .single();

          if (error) throw error;
          return newRecord;
        }
      } else {
        // Check out - update existing record
        const { data: existingRecord } = await supabase
          .from('attendance_records')
          .select('id, check_in_time')
          .eq('person_id', data.personId)
          .eq('attendance_date', today)
          .single();

        if (!existingRecord) {
          throw new Error('No check-in record found for today');
        }

        // Calculate hours worked
        let hoursWorked = 0;
        if (existingRecord.check_in_time) {
          const checkInTime = new Date(`2000-01-01 ${existingRecord.check_in_time}`);
          const checkOutTime = new Date(`2000-01-01 ${currentTime}`);
          const diffMs = checkOutTime.getTime() - checkInTime.getTime();
          hoursWorked = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
        }

        const { data: updatedRecord, error } = await supabase
          .from('attendance_records')
          .update({
            check_out_time: currentTime,
            hours_worked: hoursWorked,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingRecord.id)
          .select()
          .single();

        if (error) throw error;
        return updatedRecord;
      }
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['attendance-records'] });
      
      if (variables.action === 'check_in') {
        toast.success("Checked in successfully");
      } else {
        toast.success("Checked out successfully");
      }
    },
    onError: (error: any) => {
      console.error('Error processing automatic attendance:', error);
      toast.error('Failed to process attendance: ' + (error.message || 'Unknown error'));
    },
  });
};

export const useGetTodayAttendance = (personId: string) => {
  return async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    
    const { data, error } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('person_id', personId)
      .eq('attendance_date', today)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
      throw error;
    }

    return data;
  };
};

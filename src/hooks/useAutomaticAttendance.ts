
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";

export interface AutoAttendanceData {
  personId: string;
  personType: 'staff' | 'client';
  branchId: string;
  bookingId?: string;
  action: 'check_in' | 'check_out' | 'recheck_in';
  location?: {
    latitude: number;
    longitude: number;
  };
}

export const useAutomaticAttendance = (options?: { silent?: boolean }) => {
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
          .select('id, check_in_time')
          .eq('person_id', data.personId)
          .eq('attendance_date', today)
          .maybeSingle();

        if (existingRecord) {
          // Update existing record with check-in time (only if not already checked in)
          if (!existingRecord.check_in_time) {
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
            throw new Error('Already checked in for today');
          }
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
              hours_worked: 0,
              notes: data.bookingId ? `Auto check-in from booking ${data.bookingId}` : 'Manual check-in'
            })
            .select()
            .single();

          if (error) throw error;
          return newRecord;
        }
      } else if (data.action === 'recheck_in') {
        // Re-check-in after checkout - clear checkout time and reset status
        const { data: existingRecord } = await supabase
          .from('attendance_records')
          .select('id, check_in_time, check_out_time, notes')
          .eq('person_id', data.personId)
          .eq('attendance_date', today)
          .maybeSingle();

        if (!existingRecord) {
          throw new Error('No attendance record found for today');
        }

        if (!existingRecord.check_out_time) {
          throw new Error('Cannot re-check-in without first checking out');
        }

        const recheckNotes = data.bookingId 
          ? `Re-check-in from booking ${data.bookingId} at ${currentTime}` 
          : `Manual re-check-in at ${currentTime}`;

        const { data: updatedRecord, error } = await supabase
          .from('attendance_records')
          .update({
            check_out_time: null,
            status: 'present',
            notes: existingRecord.notes ? `${existingRecord.notes}; ${recheckNotes}` : recheckNotes,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingRecord.id)
          .select()
          .single();

        if (error) throw error;
        return updatedRecord;
      } else {
        // Check out - update existing record
        const { data: existingRecord } = await supabase
          .from('attendance_records')
          .select('id, check_in_time, check_out_time')
          .eq('person_id', data.personId)
          .eq('attendance_date', today)
          .maybeSingle();

        if (!existingRecord) {
          throw new Error('No check-in record found for today');
        }

        if (existingRecord.check_out_time) {
          // Return existing record instead of throwing - allows visit completion to proceed
          console.log('[useAutomaticAttendance] Already checked out today, returning existing record');
          return existingRecord;
        }

        // Calculate hours worked
        let hoursWorked = 0;
        if (existingRecord.check_in_time) {
          const checkInTime = new Date(`2000-01-01 ${existingRecord.check_in_time}`);
          const checkOutTime = new Date(`2000-01-01 ${currentTime}`);
          const diffMs = checkOutTime.getTime() - checkInTime.getTime();
          hoursWorked = Math.round((diffMs / (1000 * 60 * 60)) * 100) / 100;
        }

        const updateNotes = data.bookingId 
          ? `Auto check-out from booking ${data.bookingId}` 
          : 'Manual check-out';

        const { data: updatedRecord, error } = await supabase
          .from('attendance_records')
          .update({
            check_out_time: currentTime,
            hours_worked: hoursWorked,
            notes: updateNotes,
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
      queryClient.invalidateQueries({ queryKey: ['today-attendance', variables.personId] });
      
      // Only show success toast if not in silent mode
      if (!options?.silent) {
        if (variables.action === 'check_in') {
          toast.success("Checked in successfully");
        } else if (variables.action === 'recheck_in') {
          toast.success("Re-checked in successfully");
        } else {
          toast.success("Checked out successfully");
        }
      }
    },
    onError: (error: any) => {
      console.error('Error processing automatic attendance:', error);
      
      // Only show error toast if not in silent mode
      if (!options?.silent) {
        toast.error('Failed to process attendance: ' + (error.message || 'Unknown error'));
      }
    },
  });
};

export const useTodayAttendance = (personId: string) => {
  const today = format(new Date(), 'yyyy-MM-dd');
  
  return useQuery({
    queryKey: ['today-attendance', personId, today],
    queryFn: async () => {
      console.log('[useTodayAttendance] Fetching attendance for:', personId, 'on:', today);
      
      const { data, error } = await supabase
        .from('attendance_records')
        .select('*')
        .eq('person_id', personId)
        .eq('attendance_date', today)
        .maybeSingle();

      if (error) {
        console.error('[useTodayAttendance] Error:', error);
        throw error;
      }

      console.log('[useTodayAttendance] Result:', data);
      return data;
    },
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 30000, // 30 seconds
    enabled: !!personId
  });
};

// Keep the old function for backward compatibility
export const useGetTodayAttendance = (personId: string) => {
  return async () => {
    const today = format(new Date(), 'yyyy-MM-dd');
    console.log('[useGetTodayAttendance] Fetching attendance for:', personId, 'on:', today);
    
    const { data, error } = await supabase
      .from('attendance_records')
      .select('*')
      .eq('person_id', personId)
      .eq('attendance_date', today)
      .maybeSingle();

    if (error) {
      console.error('[useGetTodayAttendance] Error:', error);
      throw error;
    }

    console.log('[useGetTodayAttendance] Result:', data);
    return data;
  };
};

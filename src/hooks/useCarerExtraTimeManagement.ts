import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCarerProfile } from './useCarerProfile';

export interface CreateExtraTimeRecordData {
  work_date: string;
  scheduled_start_time: string;
  scheduled_end_time: string;
  actual_start_time: string;
  actual_end_time: string;
  hourly_rate: number;
  extra_time_rate?: number;
  reason?: string;
  notes?: string;
  client_id?: string;
  booking_id?: string;
}

export const useCarerExtraTimeManagement = () => {
  const queryClient = useQueryClient();
  const { data: carerProfile } = useCarerProfile();

  const createExtraTimeRecord = useMutation({
    mutationFn: async (data: CreateExtraTimeRecordData) => {
      if (!carerProfile?.id || !carerProfile?.branch_id) {
        throw new Error('Carer profile not found');
      }

      // Calculate durations and costs
      const scheduledStart = new Date(`2000-01-01T${data.scheduled_start_time}`);
      const scheduledEnd = new Date(`2000-01-01T${data.scheduled_end_time}`);
      const actualStart = new Date(`2000-01-01T${data.actual_start_time}`);
      const actualEnd = new Date(`2000-01-01T${data.actual_end_time}`);

      const scheduled_duration_minutes = (scheduledEnd.getTime() - scheduledStart.getTime()) / (1000 * 60);
      const actual_duration_minutes = (actualEnd.getTime() - actualStart.getTime()) / (1000 * 60);
      const extra_time_minutes = Math.max(0, actual_duration_minutes - scheduled_duration_minutes);

      const extra_rate = data.extra_time_rate || data.hourly_rate * 1.5; // 1.5x overtime rate if not specified
      const total_cost = (extra_time_minutes / 60) * extra_rate;

      const { data: extraTimeRecord, error } = await supabase
        .from('extra_time_records')
        .insert({
          ...data,
          staff_id: carerProfile.id,
          branch_id: carerProfile.branch_id,
          scheduled_duration_minutes: Math.round(scheduled_duration_minutes),
          actual_duration_minutes: Math.round(actual_duration_minutes),
          extra_time_minutes: Math.round(extra_time_minutes),
          extra_time_rate: extra_rate,
          total_cost,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      // Notify admins about the new extra time claim
      try {
        await supabase.functions.invoke('create-expense-notifications', {
          body: {
            action: 'submitted',
            expense_id: extraTimeRecord.id,
            staff_id: carerProfile.id,
            staff_name: `${carerProfile.first_name || ''} ${carerProfile.last_name || ''}`.trim(),
            branch_id: carerProfile.branch_id,
            expense_source: 'extra_time',
            expense_type: 'Extra Time',
            amount: total_cost
          }
        });
      } catch (notifyError) {
        console.error('[useCarerExtraTimeManagement] Failed to send notification:', notifyError);
      }

      return extraTimeRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-extra-time'] });
      queryClient.invalidateQueries({ queryKey: ['extra-time-records'] });
    },
  });

  return {
    createExtraTimeRecord,
  };
};
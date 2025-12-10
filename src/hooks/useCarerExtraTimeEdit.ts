import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCarerProfile } from './useCarerProfile';
import { toast } from 'sonner';

export interface UpdateExtraTimeData {
  id: string;
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
}

export const useCarerExtraTimeEdit = () => {
  const queryClient = useQueryClient();
  const { data: carerProfile } = useCarerProfile();

  const updateExtraTime = useMutation({
    mutationFn: async (data: UpdateExtraTimeData) => {
      if (!carerProfile?.id) {
        throw new Error('Carer profile not found');
      }

      // Verify the extra time belongs to this carer and is pending
      const { data: extraTime, error: fetchError } = await supabase
        .from('extra_time_records')
        .select('id, staff_id, status')
        .eq('id', data.id)
        .single();

      if (fetchError) throw fetchError;
      if (!extraTime) throw new Error('Extra time record not found');
      if (extraTime.staff_id !== carerProfile.id) throw new Error('Unauthorized');
      if (extraTime.status !== 'pending') throw new Error('Only pending extra time records can be edited');

      // Calculate durations and costs
      const scheduledStart = new Date(`2000-01-01T${data.scheduled_start_time}`);
      const scheduledEnd = new Date(`2000-01-01T${data.scheduled_end_time}`);
      const actualStart = new Date(`2000-01-01T${data.actual_start_time}`);
      const actualEnd = new Date(`2000-01-01T${data.actual_end_time}`);

      const scheduled_duration_minutes = (scheduledEnd.getTime() - scheduledStart.getTime()) / (1000 * 60);
      const actual_duration_minutes = (actualEnd.getTime() - actualStart.getTime()) / (1000 * 60);
      const extra_time_minutes = Math.max(0, actual_duration_minutes - scheduled_duration_minutes);

      const extra_rate = data.extra_time_rate || data.hourly_rate * 1.5;
      const total_cost = (extra_time_minutes / 60) * extra_rate;

      const { error } = await supabase
        .from('extra_time_records')
        .update({
          work_date: data.work_date,
          scheduled_start_time: data.scheduled_start_time,
          scheduled_end_time: data.scheduled_end_time,
          actual_start_time: data.actual_start_time,
          actual_end_time: data.actual_end_time,
          hourly_rate: data.hourly_rate,
          extra_time_rate: extra_rate,
          scheduled_duration_minutes: Math.round(scheduled_duration_minutes),
          actual_duration_minutes: Math.round(actual_duration_minutes),
          extra_time_minutes: Math.round(extra_time_minutes),
          total_cost,
          reason: data.reason,
          notes: data.notes,
          client_id: data.client_id || null,
        })
        .eq('id', data.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-extra-time'] });
      queryClient.invalidateQueries({ queryKey: ['carer-payments'] });
      toast.success('Extra time record updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update extra time record', { description: error.message });
    },
  });

  return { updateExtraTime };
};

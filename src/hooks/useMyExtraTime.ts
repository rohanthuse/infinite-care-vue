import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCarerProfile } from './useCarerProfile';

export interface MyExtraTimeRecord {
  id: string;
  work_date: string;
  scheduled_start_time: string;
  scheduled_end_time: string;
  actual_start_time: string | null;
  actual_end_time: string | null;
  scheduled_duration_minutes: number;
  actual_duration_minutes: number | null;
  extra_time_minutes: number;
  hourly_rate: number;
  extra_time_rate: number | null;
  total_cost: number;
  reason: string | null;
  notes: string | null;
  status: string;
  approved_at: string | null;
  approved_by: string | null;
  invoiced: boolean;
  created_at: string;
}

export const useMyExtraTime = () => {
  const { data: carerProfile } = useCarerProfile();

  return useQuery({
    queryKey: ['my-extra-time', carerProfile?.id],
    queryFn: async () => {
      if (!carerProfile?.id) {
        throw new Error('Carer profile not found');
      }

      const { data, error } = await supabase
        .from('extra_time_records')
        .select('*')
        .eq('staff_id', carerProfile.id)
        .order('work_date', { ascending: false });

      if (error) throw error;

      return data as MyExtraTimeRecord[];
    },
    enabled: !!carerProfile?.id,
  });
};
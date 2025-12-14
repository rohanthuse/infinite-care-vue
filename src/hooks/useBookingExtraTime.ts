import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface BookingExtraTimeRecord {
  id: string;
  status: string;
  extra_time_minutes: number;
  total_cost: number;
  reason: string | null;
  created_at: string;
}

export const useBookingExtraTime = (bookingId: string | undefined) => {
  return useQuery({
    queryKey: ['booking-extra-time', bookingId],
    queryFn: async () => {
      if (!bookingId) return null;

      const { data, error } = await supabase
        .from('extra_time_records')
        .select('id, status, extra_time_minutes, total_cost, reason, created_at')
        .eq('booking_id', bookingId)
        .maybeSingle();

      if (error) throw error;
      return data as BookingExtraTimeRecord | null;
    },
    enabled: !!bookingId,
  });
};

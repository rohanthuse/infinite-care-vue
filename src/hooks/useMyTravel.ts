import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCarerProfile } from './useCarerProfile';

export interface MyTravelRecord {
  id: string;
  travel_date: string;
  start_location: string;
  end_location: string;
  distance_miles: number;
  travel_time_minutes: number | null;
  mileage_rate: number;
  total_cost: number;
  vehicle_type: string;
  purpose: string;
  status: string;
  receipt_url: string | null;
  notes: string | null;
  approved_at: string | null;
  approved_by: string | null;
  reimbursed_at: string | null;
  created_at: string;
}

export const useMyTravel = () => {
  const { data: carerProfile } = useCarerProfile();

  return useQuery({
    queryKey: ['my-travel', carerProfile?.id],
    queryFn: async () => {
      if (!carerProfile?.id) {
        throw new Error('Carer profile not found');
      }

      const { data, error } = await supabase
        .from('travel_records')
        .select('*')
        .eq('staff_id', carerProfile.id)
        .order('travel_date', { ascending: false });

      if (error) throw error;

      return data as MyTravelRecord[];
    },
    enabled: !!carerProfile?.id,
  });
};
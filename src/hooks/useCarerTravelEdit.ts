import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCarerProfile } from './useCarerProfile';
import { toast } from 'sonner';

export interface UpdateTravelData {
  id: string;
  travel_date: string;
  client_id?: string;
  start_location: string;
  end_location: string;
  distance_miles: number;
  travel_time_minutes?: number;
  vehicle_type: string;
  purpose: string;
  notes?: string;
  mileage_rate: number;
}

export const useCarerTravelEdit = () => {
  const queryClient = useQueryClient();
  const { data: carerProfile } = useCarerProfile();

  const updateTravel = useMutation({
    mutationFn: async (data: UpdateTravelData) => {
      if (!carerProfile?.id) {
        throw new Error('Carer profile not found');
      }

      // Verify the travel belongs to this carer and is pending
      const { data: travel, error: fetchError } = await supabase
        .from('travel_records')
        .select('id, staff_id, status')
        .eq('id', data.id)
        .single();

      if (fetchError) throw fetchError;
      if (!travel) throw new Error('Travel record not found');
      if (travel.staff_id !== carerProfile.id) throw new Error('Unauthorized');
      if (travel.status !== 'pending') throw new Error('Only pending travel records can be edited');

      const total_cost = data.distance_miles * data.mileage_rate;

      const { error } = await supabase
        .from('travel_records')
        .update({
          travel_date: data.travel_date,
          client_id: data.client_id || null,
          start_location: data.start_location,
          end_location: data.end_location,
          distance_miles: data.distance_miles,
          travel_time_minutes: data.travel_time_minutes || null,
          vehicle_type: data.vehicle_type,
          purpose: data.purpose,
          notes: data.notes || null,
          mileage_rate: data.mileage_rate,
          total_cost,
        })
        .eq('id', data.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-travel'] });
      queryClient.invalidateQueries({ queryKey: ['carer-payments'] });
      toast.success('Travel record updated successfully');
    },
    onError: (error: Error) => {
      toast.error('Failed to update travel record', { description: error.message });
    },
  });

  return { updateTravel };
};

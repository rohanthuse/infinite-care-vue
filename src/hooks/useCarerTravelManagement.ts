import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCarerProfile } from './useCarerProfile';

export interface CreateTravelRecordData {
  travel_date: string;
  start_location: string;
  end_location: string;
  distance_miles: number;
  travel_time_minutes?: number;
  vehicle_type: string;
  purpose: string;
  notes?: string;
  mileage_rate: number;
}

export const useCarerTravelManagement = () => {
  const queryClient = useQueryClient();
  const { data: carerProfile } = useCarerProfile();

  const createTravelRecord = useMutation({
    mutationFn: async (data: CreateTravelRecordData) => {
      if (!carerProfile?.id || !carerProfile?.branch_id) {
        throw new Error('Carer profile not found');
      }

      const total_cost = data.distance_miles * data.mileage_rate;

      const { data: travelRecord, error } = await supabase
        .from('travel_records')
        .insert({
          ...data,
          staff_id: carerProfile.id,
          branch_id: carerProfile.branch_id,
          total_cost,
          status: 'pending',
        })
        .select()
        .single();

      if (error) throw error;

      return travelRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-travel'] });
    },
  });

  const uploadReceipt = async (file: File): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const filePath = `travel-receipts/${carerProfile?.id}/${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('documents')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  return {
    createTravelRecord,
    uploadReceipt,
  };
};
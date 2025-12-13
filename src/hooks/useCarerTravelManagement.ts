import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCarerProfile } from './useCarerProfile';

export interface CreateTravelRecordData {
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
  receipt_url?: string;
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
          staff_id: carerProfile.id,
          branch_id: carerProfile.branch_id,
          total_cost,
          status: 'pending',
          receipt_url: data.receipt_url || null,
        })
        .select()
        .single();

      if (error) throw error;

      // Notify admins about the new travel claim
      try {
        await supabase.functions.invoke('create-expense-notifications', {
          body: {
            action: 'submitted',
            expense_id: travelRecord.id,
            staff_id: carerProfile.id,
            staff_name: `${carerProfile.first_name || ''} ${carerProfile.last_name || ''}`.trim(),
            branch_id: carerProfile.branch_id,
            expense_source: 'travel_mileage',
            expense_type: 'Travel & Mileage',
            amount: total_cost
          }
        });
      } catch (notifyError) {
        console.error('[useCarerTravelManagement] Failed to send notification:', notifyError);
      }

      return travelRecord;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-travel'] });
      queryClient.invalidateQueries({ queryKey: ['carer-payments'] });
      queryClient.invalidateQueries({ queryKey: ['travel-records'] });
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
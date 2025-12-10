import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type TravelPaymentType = 'pay_mileage' | 'pay_travel_time' | 'none';

export const travelPaymentTypeLabels: Record<TravelPaymentType, string> = {
  pay_mileage: 'Pay Mileage',
  pay_travel_time: 'Pay Travel Time',
  none: 'No Travel Payment',
};

// Fetch staff's travel payment type
export function useStaffTravelPaymentType(staffId?: string) {
  return useQuery({
    queryKey: ['staff-travel-payment-type', staffId],
    queryFn: async () => {
      if (!staffId) return null;

      const { data, error } = await supabase
        .from('staff')
        .select('travel_payment_type')
        .eq('id', staffId)
        .single();

      if (error) throw error;
      return data?.travel_payment_type as TravelPaymentType | null;
    },
    enabled: !!staffId,
  });
}

// Update staff's travel payment type
export function useUpdateStaffTravelPaymentType() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      staffId, 
      travelPaymentType 
    }: { 
      staffId: string; 
      travelPaymentType: TravelPaymentType;
    }) => {
      const { data, error } = await supabase
        .from('staff')
        .update({ travel_payment_type: travelPaymentType })
        .eq('id', staffId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['staff-travel-payment-type'] });
      queryClient.invalidateQueries({ queryKey: ['staff', data.id] });
      toast.success('Travel payment type updated successfully');
    },
    onError: (error) => {
      console.error('Error updating travel payment type:', error);
      toast.error('Failed to update travel payment type');
    },
  });
}

// Fetch approved travel records for payroll calculation
export function useApprovedTravelForPayroll(
  staffId?: string,
  startDate?: string,
  endDate?: string
) {
  return useQuery({
    queryKey: ['approved-travel-payroll', staffId, startDate, endDate],
    queryFn: async () => {
      if (!staffId || !startDate || !endDate) return [];

      const { data, error } = await supabase
        .from('travel_records')
        .select('*')
        .eq('staff_id', staffId)
        .eq('status', 'approved')
        .gte('travel_date', startDate)
        .lte('travel_date', endDate)
        .order('travel_date', { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!(staffId && startDate && endDate),
  });
}

// Calculate travel compensation based on payment type
export function calculateTravelCompensation(
  travelRecords: any[],
  paymentType: TravelPaymentType | null,
  hourlyRate: number = 12.00 // Default hourly rate
) {
  if (!paymentType || paymentType === 'none' || travelRecords.length === 0) {
    return {
      totalAmount: 0,
      totalMiles: 0,
      totalMinutes: 0,
      paymentType,
      records: [],
    };
  }

  const totalMiles = travelRecords.reduce(
    (sum, record) => sum + (record.distance_miles || 0),
    0
  );

  const totalMinutes = travelRecords.reduce(
    (sum, record) => sum + (record.travel_time_minutes || 0),
    0
  );

  let totalAmount = 0;

  if (paymentType === 'pay_mileage') {
    // Calculate based on mileage rate from records
    totalAmount = travelRecords.reduce(
      (sum, record) => sum + (record.total_cost || 0),
      0
    );
  } else if (paymentType === 'pay_travel_time') {
    // Calculate based on travel time and hourly rate
    totalAmount = (totalMinutes / 60) * hourlyRate;
  }

  return {
    totalAmount,
    totalMiles,
    totalMinutes,
    paymentType,
    formattedTime: `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`,
    records: travelRecords,
  };
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type TravelPaymentType = 'pay_mileage' | 'pay_travel_time' | 'fixed_per_shift' | 'flat_daily_rate' | 'none';

export const travelPaymentTypeLabels: Record<TravelPaymentType, string> = {
  pay_mileage: 'Pay Mileage',
  pay_travel_time: 'Pay Travel Time',
  fixed_per_shift: 'Fixed Per Shift',
  flat_daily_rate: 'Flat Daily Rate',
  none: 'No Travel Payment',
};

// Parse stored travel payment types (supports both single string and JSON array)
function parseTravelPaymentTypes(value: string | null): TravelPaymentType[] {
  if (!value) return [];
  
  // Try parsing as JSON array first
  try {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.filter((t): t is TravelPaymentType => 
        ['pay_mileage', 'pay_travel_time', 'fixed_per_shift', 'flat_daily_rate', 'none'].includes(t)
      );
    }
  } catch {
    // Not JSON, treat as single value
  }
  
  // Handle single value for backwards compatibility
  if (['pay_mileage', 'pay_travel_time', 'fixed_per_shift', 'flat_daily_rate', 'none'].includes(value)) {
    return [value as TravelPaymentType];
  }
  
  return [];
}

// Fetch staff's travel payment type (single - backwards compatible)
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
      
      const types = parseTravelPaymentTypes(data?.travel_payment_type);
      return types.length > 0 ? types[0] : null;
    },
    enabled: !!staffId,
  });
}

// Fetch staff's travel payment types (multiple)
export function useStaffTravelPaymentTypes(staffId?: string) {
  return useQuery({
    queryKey: ['staff-travel-payment-types', staffId],
    queryFn: async () => {
      if (!staffId) return [];

      const { data, error } = await supabase
        .from('staff')
        .select('travel_payment_type')
        .eq('id', staffId)
        .single();

      if (error) throw error;
      return parseTravelPaymentTypes(data?.travel_payment_type);
    },
    enabled: !!staffId,
  });
}

// Update staff's travel payment type (single - backwards compatible)
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
      queryClient.invalidateQueries({ queryKey: ['staff-travel-payment-types'] });
      queryClient.invalidateQueries({ queryKey: ['staff', data.id] });
      toast.success('Travel payment type updated successfully');
    },
    onError: (error) => {
      console.error('Error updating travel payment type:', error);
      toast.error('Failed to update travel payment type');
    },
  });
}

// Update staff's travel payment types (multiple)
export function useUpdateStaffTravelPaymentTypes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      staffId, 
      travelPaymentTypes 
    }: { 
      staffId: string; 
      travelPaymentTypes: TravelPaymentType[];
    }) => {
      // Store as JSON array string
      const value = travelPaymentTypes.length === 0 
        ? null 
        : JSON.stringify(travelPaymentTypes);
      
      const { data, error } = await supabase
        .from('staff')
        .update({ travel_payment_type: value })
        .eq('id', staffId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['staff-travel-payment-type'] });
      queryClient.invalidateQueries({ queryKey: ['staff-travel-payment-types'] });
      queryClient.invalidateQueries({ queryKey: ['staff', data.id] });
      toast.success('Travel payment preferences updated');
    },
    onError: (error) => {
      console.error('Error updating travel payment types:', error);
      toast.error('Failed to update travel payment preferences');
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

// Calculate travel compensation based on payment types (supports multiple)
export function calculateTravelCompensation(
  travelRecords: any[],
  paymentTypes: TravelPaymentType[] | TravelPaymentType | null,
  hourlyRate: number = 12.00, // Default hourly rate
  fixedPerShift: number = 5.00, // Default fixed per shift
  flatDailyRate: number = 10.00 // Default flat daily rate
) {
  // Normalize to array
  const types = Array.isArray(paymentTypes) 
    ? paymentTypes 
    : paymentTypes 
      ? [paymentTypes] 
      : [];
  
  if (types.length === 0 || types.includes('none') || travelRecords.length === 0) {
    return {
      totalAmount: 0,
      totalMiles: 0,
      totalMinutes: 0,
      paymentTypes: types,
      breakdown: {},
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

  // Get unique days for flat daily rate
  const uniqueDays = new Set(travelRecords.map(r => r.travel_date)).size;
  
  // Get unique shifts for fixed per shift
  const uniqueShifts = travelRecords.length;

  let totalAmount = 0;
  const breakdown: Record<string, number> = {};

  if (types.includes('pay_mileage')) {
    // Calculate based on mileage rate from records
    const mileageAmount = travelRecords.reduce(
      (sum, record) => sum + (record.total_cost || 0),
      0
    );
    breakdown.mileage = mileageAmount;
    totalAmount += mileageAmount;
  }
  
  if (types.includes('pay_travel_time')) {
    // Calculate based on travel time and hourly rate
    const timeAmount = (totalMinutes / 60) * hourlyRate;
    breakdown.travel_time = timeAmount;
    totalAmount += timeAmount;
  }
  
  if (types.includes('fixed_per_shift')) {
    const shiftAmount = uniqueShifts * fixedPerShift;
    breakdown.fixed_per_shift = shiftAmount;
    totalAmount += shiftAmount;
  }
  
  if (types.includes('flat_daily_rate')) {
    const dailyAmount = uniqueDays * flatDailyRate;
    breakdown.flat_daily = dailyAmount;
    totalAmount += dailyAmount;
  }

  return {
    totalAmount,
    totalMiles,
    totalMinutes,
    paymentTypes: types,
    formattedTime: `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}m`,
    breakdown,
    uniqueDays,
    uniqueShifts,
    records: travelRecords,
  };
}
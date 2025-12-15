import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Car, Clock, Ban, Banknote, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Toggle } from "@/components/ui/toggle";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type TravelPaymentType = 'pay_mileage' | 'pay_travel_time' | 'fixed_per_shift' | 'flat_daily_rate' | 'none';

export const travelPaymentTypeLabels: Record<TravelPaymentType, string> = {
  pay_mileage: 'Per KM/Mile',
  pay_travel_time: 'Travel Time (Hourly)',
  fixed_per_shift: 'Fixed Per Shift',
  flat_daily_rate: 'Flat Daily Rate',
  none: 'No Travel Payment',
};

export const travelPaymentTypeDescriptions: Record<TravelPaymentType, string> = {
  pay_mileage: 'Staff paid based on mileage/distance logged',
  pay_travel_time: 'Staff paid for travel time at hourly rate',
  fixed_per_shift: 'Fixed travel allowance per shift worked',
  flat_daily_rate: 'Fixed daily travel allowance',
  none: 'No additional payment for travel',
};

const getIcon = (type: TravelPaymentType) => {
  switch (type) {
    case 'pay_mileage':
      return <Car className="h-4 w-4" />;
    case 'pay_travel_time':
      return <Clock className="h-4 w-4" />;
    case 'fixed_per_shift':
      return <Banknote className="h-4 w-4" />;
    case 'flat_daily_rate':
      return <Calendar className="h-4 w-4" />;
    case 'none':
      return <Ban className="h-4 w-4" />;
    default:
      return null;
  }
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

// Hook to fetch travel payment types
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

// Hook to update travel payment types
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
      queryClient.invalidateQueries({ queryKey: ['staff-travel-payment-types'] });
      queryClient.invalidateQueries({ queryKey: ['staff-travel-payment-type'] });
      queryClient.invalidateQueries({ queryKey: ['staff', data.id] });
      toast.success('Travel payment preferences updated');
    },
    onError: (error) => {
      console.error('Error updating travel payment types:', error);
      toast.error('Failed to update travel payment preferences');
    },
  });
}

interface StaffTravelPaymentSelectorProps {
  staffId: string;
  readOnly?: boolean;
}

export const StaffTravelPaymentSelector: React.FC<StaffTravelPaymentSelectorProps> = ({
  staffId,
  readOnly = false,
}) => {
  const { data: selectedTypes = [], isLoading } = useStaffTravelPaymentTypes(staffId);
  const updateTypes = useUpdateStaffTravelPaymentTypes();

  const handleToggle = (type: TravelPaymentType) => {
    if (readOnly || updateTypes.isPending) return;

    let newTypes: TravelPaymentType[];
    
    if (type === 'none') {
      // If selecting 'none', clear all others
      newTypes = selectedTypes.includes('none') ? [] : ['none'];
    } else {
      // If selecting a payment type, remove 'none' and toggle this type
      const withoutNone = selectedTypes.filter(t => t !== 'none');
      
      if (withoutNone.includes(type)) {
        newTypes = withoutNone.filter(t => t !== type);
      } else {
        newTypes = [...withoutNone, type];
      }
    }

    updateTypes.mutate({ staffId, travelPaymentTypes: newTypes });
  };

  const isSelected = (type: TravelPaymentType) => selectedTypes.includes(type);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  const paymentTypes: TravelPaymentType[] = ['pay_mileage', 'pay_travel_time', 'fixed_per_shift', 'flat_daily_rate'];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Car className="h-5 w-5 text-primary" />
          Travel Payment Preferences
        </CardTitle>
        <CardDescription>
          Select one or more ways to compensate this staff member for travel between client visits
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Payment Types</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {paymentTypes.map((type) => (
              <Toggle
                key={type}
                pressed={isSelected(type)}
                onPressedChange={() => handleToggle(type)}
                disabled={readOnly || updateTypes.isPending}
                className="h-auto p-4 justify-start data-[state=on]:bg-primary/10 data-[state=on]:border-primary border"
                variant="outline"
              >
                <div className="flex items-start gap-3 w-full">
                  <div className={`mt-0.5 ${isSelected(type) ? 'text-primary' : 'text-muted-foreground'}`}>
                    {getIcon(type)}
                  </div>
                  <div className="text-left">
                    <p className={`font-medium ${isSelected(type) ? 'text-primary' : ''}`}>
                      {travelPaymentTypeLabels[type]}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {travelPaymentTypeDescriptions[type]}
                    </p>
                  </div>
                </div>
              </Toggle>
            ))}
          </div>
        </div>

        <div className="pt-2">
          <Toggle
            pressed={isSelected('none')}
            onPressedChange={() => handleToggle('none')}
            disabled={readOnly || updateTypes.isPending}
            className="h-auto p-3 justify-start data-[state=on]:bg-muted data-[state=on]:border-muted-foreground/30 border w-full"
            variant="outline"
          >
            <div className="flex items-center gap-3">
              <Ban className={`h-4 w-4 ${isSelected('none') ? 'text-muted-foreground' : 'text-muted-foreground/50'}`} />
              <div className="text-left">
                <p className="font-medium text-muted-foreground">
                  {travelPaymentTypeLabels.none}
                </p>
                <p className="text-xs text-muted-foreground/70">
                  {travelPaymentTypeDescriptions.none}
                </p>
              </div>
            </div>
          </Toggle>
        </div>

        {selectedTypes.length > 0 && !selectedTypes.includes('none') && (
          <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md">
            <strong>Active:</strong> {selectedTypes.map(t => travelPaymentTypeLabels[t]).join(', ')}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
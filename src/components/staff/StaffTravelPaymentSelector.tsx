import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Car, Clock, Ban } from "lucide-react";
import { 
  useStaffTravelPaymentType, 
  useUpdateStaffTravelPaymentType, 
  TravelPaymentType, 
  travelPaymentTypeLabels 
} from "@/hooks/useStaffTravelPayment";
import { Skeleton } from "@/components/ui/skeleton";

interface StaffTravelPaymentSelectorProps {
  staffId: string;
  readOnly?: boolean;
}

export const StaffTravelPaymentSelector: React.FC<StaffTravelPaymentSelectorProps> = ({
  staffId,
  readOnly = false,
}) => {
  const { data: travelPaymentType, isLoading } = useStaffTravelPaymentType(staffId);
  const updateTravelPaymentType = useUpdateStaffTravelPaymentType();

  const handleChange = (value: TravelPaymentType) => {
    updateTravelPaymentType.mutate({ staffId, travelPaymentType: value });
  };

  const getIcon = (type: TravelPaymentType | null) => {
    switch (type) {
      case 'pay_mileage':
        return <Car className="h-4 w-4 text-primary" />;
      case 'pay_travel_time':
        return <Clock className="h-4 w-4 text-primary" />;
      case 'none':
        return <Ban className="h-4 w-4 text-muted-foreground" />;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          {getIcon(travelPaymentType)}
          Travel Payment Preference
        </CardTitle>
        <CardDescription>
          Choose how this staff member should be compensated for travel between client visits
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="travel-payment-type">Payment Type</Label>
          <Select
            value={travelPaymentType || 'none'}
            onValueChange={(value) => handleChange(value as TravelPaymentType)}
            disabled={readOnly || updateTravelPaymentType.isPending}
          >
            <SelectTrigger id="travel-payment-type" className="w-full">
              <SelectValue placeholder="Select payment type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pay_mileage">
                <div className="flex items-center gap-2">
                  <Car className="h-4 w-4" />
                  <span>{travelPaymentTypeLabels.pay_mileage}</span>
                </div>
              </SelectItem>
              <SelectItem value="pay_travel_time">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{travelPaymentTypeLabels.pay_travel_time}</span>
                </div>
              </SelectItem>
              <SelectItem value="none">
                <div className="flex items-center gap-2">
                  <Ban className="h-4 w-4" />
                  <span>{travelPaymentTypeLabels.none}</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="text-sm text-muted-foreground space-y-1">
          {travelPaymentType === 'pay_mileage' && (
            <p>Staff will be paid based on the mileage rate for each trip logged.</p>
          )}
          {travelPaymentType === 'pay_travel_time' && (
            <p>Staff will be paid based on their hourly rate for travel time between visits.</p>
          )}
          {(travelPaymentType === 'none' || !travelPaymentType) && (
            <p>Staff will not receive additional payment for travel.</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

import React from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Calendar, FileText, Ban, DollarSign } from "lucide-react";
import { format, parseISO } from "date-fns";
import { useClientSuspensions } from "@/hooks/useClientSuspensions";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface SuspensionAlertBannerProps {
  clientId: string;
  onViewDetails?: () => void;
}

export const SuspensionAlertBanner: React.FC<SuspensionAlertBannerProps> = ({ 
  clientId,
  onViewDetails 
}) => {
  const { data: suspensionData, isLoading } = useClientSuspensions(clientId);

  if (isLoading || !suspensionData?.is_suspended) {
    return null;
  }

  const fromDate = suspensionData.effective_from 
    ? format(parseISO(suspensionData.effective_from), 'MMM dd, yyyy HH:mm')
    : 'Unknown';
  
  const untilDate = suspensionData.effective_until
    ? format(parseISO(suspensionData.effective_until), 'MMM dd, yyyy HH:mm')
    : 'Indefinitely';

  const applyTo = (suspensionData.apply_to as any) || {};
  const visitsBlocked = applyTo.visits === true;
  const billingBlocked = applyTo.billing === false;
  const notify = (suspensionData as any).notify || {};
  const payStaff = notify.carers === true;

  return (
    <Alert variant="destructive" className="mb-4 border-2 border-destructive bg-destructive/10">
      <div className="flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 mt-0.5 text-destructive" />
        <div className="flex-1">
          <AlertTitle className="text-lg font-bold mb-2 text-destructive">
            ⚠️ Client Currently Suspended
          </AlertTitle>
          <AlertDescription className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4" />
              <span>
                <strong>Period:</strong> {fromDate} → {untilDate}
              </span>
            </div>
            
            {suspensionData.reason && (
              <div className="flex items-start gap-2 text-sm">
                <FileText className="h-4 w-4 mt-0.5" />
                <span>
                  <strong>Reason:</strong> {suspensionData.reason}
                </span>
              </div>
            )}

            {suspensionData.suspension_type && (
              <div className="flex items-center gap-2 text-sm">
                <Ban className="h-4 w-4" />
                <span>
                  <strong>Type:</strong> {suspensionData.suspension_type}
                </span>
              </div>
            )}

            <div className="flex flex-wrap gap-2 mt-3">
              {visitsBlocked && (
                <Badge className="bg-destructive text-destructive-foreground">
                  <Ban className="h-3 w-3 mr-1" />
                  Visits Blocked
                </Badge>
              )}
              {billingBlocked && (
                <Badge className="bg-orange-600 text-white">
                  <FileText className="h-3 w-3 mr-1" />
                  Billing Suspended
                </Badge>
              )}
              {payStaff && (
                <Badge className="bg-blue-600 text-white">
                  <DollarSign className="h-3 w-3 mr-1" />
                  Staff Payment Protected
                </Badge>
              )}
            </div>
          </AlertDescription>
        </div>
        {onViewDetails && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onViewDetails}
            className="ml-auto border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
          >
            View Details
          </Button>
        )}
      </div>
    </Alert>
  );
};
